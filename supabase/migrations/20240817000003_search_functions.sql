-- Helper functions for search and processing

-- Function to search fragments with hybrid lexical + vector search
create or replace function search_fragments(
  query_text text,
  query_embedding vector(1536) default null,
  user_id_filter uuid default null,
  limit_count int default 20,
  offset_count int default 0
)
returns table(
  id uuid,
  title text,
  body text,
  event_at timestamptz,
  location_text text,
  tags text[],
  system_emotions text[],
  system_themes text[],
  visibility visibility,
  similarity float,
  rank float
) language plpgsql as $$
begin
  return query
  select 
    f.id,
    f.title,
    f.body,
    f.event_at,
    f.location_text,
    f.tags,
    f.system_emotions,
    f.system_themes,
    f.visibility,
    case 
      when query_embedding is not null and f.embedding is not null 
      then 1 - (f.embedding <=> query_embedding)
      else 0.0
    end as similarity,
    ts_rank(
      to_tsvector('english', f.title || ' ' || f.body || ' ' || f.transcript),
      plainto_tsquery('english', query_text)
    ) as rank
  from fragment f
  where 
    (user_id_filter is null or f.user_id = user_id_filter)
    and (f.visibility = 'PUBLIC' or f.user_id = auth.uid())
    and (
      query_text = '' or
      to_tsvector('english', f.title || ' ' || f.body || ' ' || f.transcript) 
      @@ plainto_tsquery('english', query_text)
    )
  order by 
    case when query_embedding is not null then similarity else rank end desc
  limit limit_count
  offset offset_count;
end;
$$;

-- Function to find KNN neighbors for linking
create or replace function find_fragment_neighbors(
  fragment_id uuid,
  k int default 12
)
returns table(
  id uuid,
  similarity float
) language plpgsql as $$
declare
  target_embedding vector(1536);
begin
  -- Get the embedding of the target fragment
  select embedding into target_embedding
  from fragment
  where fragment.id = fragment_id;
  
  if target_embedding is null then
    return;
  end if;
  
  return query
  select 
    f.id,
    1 - (f.embedding <=> target_embedding) as similarity
  from fragment f
  where 
    f.id != fragment_id
    and f.embedding is not null
    and f.status = 'READY'
    and (f.visibility = 'PUBLIC' or f.user_id = (
      select user_id from fragment where fragment.id = fragment_id
    ))
  order by f.embedding <=> target_embedding
  limit k;
end;
$$;

-- Function to create semantic links based on similarity
create or replace function create_semantic_links(fragment_id uuid)
returns void language plpgsql as $$
declare
  neighbor record;
  link_reason text;
begin
  -- Remove existing semantic links for this fragment
  delete from link 
  where (from_id = fragment_id or to_id = fragment_id) 
  and type = 'SEMANTIC';
  
  -- Create new semantic links
  for neighbor in 
    select id, similarity 
    from find_fragment_neighbors(fragment_id, 12)
    where similarity > 0.7 -- Only create links for high similarity
  loop
    link_reason := format('High semantic similarity (%.2f) based on content analysis', neighbor.similarity);
    
    insert into link (from_id, to_id, type, score, reason)
    values (fragment_id, neighbor.id, 'SEMANTIC', neighbor.similarity, link_reason)
    on conflict (from_id, to_id, type) do update set
      score = excluded.score,
      reason = excluded.reason;
  end loop;
end;
$$;

-- Function to create rule-based links
create or replace function create_rule_links(fragment_id uuid)
returns void language plpgsql as $$
declare
  fragment_record record;
  other_fragment record;
  link_reason text;
  time_window interval := '7 days';
begin
  -- Get the target fragment
  select * into fragment_record
  from fragment
  where id = fragment_id;
  
  if not found then
    return;
  end if;
  
  -- Create shared tag links
  for other_fragment in
    select f.*, array_length(array(select unnest(f.tags) intersect select unnest(fragment_record.tags)), 1) as shared_tag_count
    from fragment f
    where f.id != fragment_id
    and f.tags && fragment_record.tags -- Has shared tags
    and (f.visibility = 'PUBLIC' or f.user_id = fragment_record.user_id)
  loop
    if other_fragment.shared_tag_count >= 2 then
      link_reason := format('Shares %s tags: %s', 
        other_fragment.shared_tag_count,
        array_to_string(
          array(select unnest(other_fragment.tags) intersect select unnest(fragment_record.tags)), 
          ', '
        )
      );
      
      insert into link (from_id, to_id, type, score, reason)
      values (fragment_id, other_fragment.id, 'SHARED_TAG', other_fragment.shared_tag_count::float / 10, link_reason)
      on conflict (from_id, to_id, type) do update set
        score = excluded.score,
        reason = excluded.reason;
    end if;
  end loop;
  
  -- Create time window links
  for other_fragment in
    select f.*
    from fragment f
    where f.id != fragment_id
    and abs(extract(epoch from (f.event_at - fragment_record.event_at))) <= extract(epoch from time_window)
    and (f.visibility = 'PUBLIC' or f.user_id = fragment_record.user_id)
  loop
    link_reason := format('Occurred within same time window (%s apart)', 
      justify_interval(other_fragment.event_at - fragment_record.event_at)
    );
    
    insert into link (from_id, to_id, type, score, reason)
    values (fragment_id, other_fragment.id, 'SAME_TIMEWINDOW', 0.8, link_reason)
    on conflict (from_id, to_id, type) do update set
      score = excluded.score,
      reason = excluded.reason;
  end loop;
  
  -- Create location links (if both have coordinates)
  if fragment_record.lat is not null and fragment_record.lng is not null then
    for other_fragment in
      select f.*,
        ST_Distance(
          ST_Point(fragment_record.lng, fragment_record.lat)::geography,
          ST_Point(f.lng, f.lat)::geography
        ) as distance_meters
      from fragment f
      where f.id != fragment_id
      and f.lat is not null and f.lng is not null
      and ST_DWithin(
        ST_Point(fragment_record.lng, fragment_record.lat)::geography,
        ST_Point(f.lng, f.lat)::geography,
        1000 -- Within 1km
      )
      and (f.visibility = 'PUBLIC' or f.user_id = fragment_record.user_id)
    loop
      link_reason := format('Located nearby (%.0fm apart) in %s', 
        other_fragment.distance_meters,
        coalesce(fragment_record.location_text, 'same area')
      );
      
      insert into link (from_id, to_id, type, score, reason)
      values (fragment_id, other_fragment.id, 'SAME_LOCATION', 1.0 - (other_fragment.distance_meters / 1000.0), link_reason)
      on conflict (from_id, to_id, type) do update set
        score = excluded.score,
        reason = excluded.reason;
    end loop;
  end if;
end;
$$;

-- Create indexes for performance
create index if not exists fragment_tsvector_idx on fragment using gin(to_tsvector('english', title || ' ' || body || ' ' || transcript));
create index if not exists fragment_user_status_idx on fragment(user_id, status);
create index if not exists link_from_id_idx on link(from_id);
create index if not exists link_to_id_idx on link(to_id);
