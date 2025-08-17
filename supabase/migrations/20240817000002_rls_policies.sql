-- RLS Policies for app_user
create policy "Users can view own profile" on app_user for select using (auth.uid() = id);
create policy "Users can update own profile" on app_user for update using (auth.uid() = id);
create policy "Users can insert own profile" on app_user for insert with check (auth.uid() = id);

-- RLS Policies for consent
create policy "Users can view own consent" on consent for select using (auth.uid() = user_id);
create policy "Users can update own consent" on consent for update using (auth.uid() = user_id);
create policy "Users can insert own consent" on consent for insert with check (auth.uid() = user_id);

-- RLS Policies for fragment
create policy "Fragment read policy" on fragment for select using (
  visibility = 'PUBLIC' or user_id = auth.uid()
);
create policy "Fragment write policy" on fragment for update using (user_id = auth.uid());
create policy "Fragment insert policy" on fragment for insert with check (user_id = auth.uid());
create policy "Fragment delete policy" on fragment for delete using (user_id = auth.uid());

-- RLS Policies for link
create policy "Link read policy" on link for select using (
  exists (
    select 1 from fragment f1, fragment f2 
    where f1.id = from_id and f2.id = to_id 
    and (
      (f1.visibility = 'PUBLIC' or f1.user_id = auth.uid()) and 
      (f2.visibility = 'PUBLIC' or f2.user_id = auth.uid())
    )
  )
);

-- RLS Policies for collection
create policy "Collection read policy" on collection for select using (
  user_id = auth.uid()
);
create policy "Collection write policy" on collection for update using (user_id = auth.uid());
create policy "Collection insert policy" on collection for insert with check (user_id = auth.uid());
create policy "Collection delete policy" on collection for delete using (user_id = auth.uid());

-- RLS Policies for collection_item
create policy "Collection item read policy" on collection_item for select using (
  exists (
    select 1 from collection c 
    where c.id = collection_id and c.user_id = auth.uid()
  )
);
create policy "Collection item write policy" on collection_item for update using (
  exists (
    select 1 from collection c 
    where c.id = collection_id and c.user_id = auth.uid()
  )
);
create policy "Collection item insert policy" on collection_item for insert with check (
  exists (
    select 1 from collection c 
    where c.id = collection_id and c.user_id = auth.uid()
  )
);
create policy "Collection item delete policy" on collection_item for delete using (
  exists (
    select 1 from collection c 
    where c.id = collection_id and c.user_id = auth.uid()
  )
);

-- RLS Policies for audit_event
create policy "Audit event read policy" on audit_event for select using (
  user_id = auth.uid()
);
create policy "Audit event insert policy" on audit_event for insert with check (
  user_id = auth.uid()
);
