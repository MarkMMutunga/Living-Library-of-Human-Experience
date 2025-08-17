-- Add embedding column for vector search
-- This migration adds support for vector embeddings using pgvector

-- Enable the pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to fragment table
ALTER TABLE fragment 
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS fragment_embedding_idx 
ON fragment 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Add function to update embeddings
CREATE OR REPLACE FUNCTION update_fragment_embedding()
RETURNS TRIGGER AS $$
BEGIN
  -- Trigger can be used to automatically generate embeddings
  -- For now, embeddings will be generated via API calls
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add metadata for tracking embedding generation
ALTER TABLE fragment 
ADD COLUMN IF NOT EXISTS embedding_generated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS embedding_model VARCHAR(100) DEFAULT 'text-embedding-3-large';

-- Add comments for documentation
COMMENT ON COLUMN fragment.embedding IS 'Vector embedding for semantic search (1536 dimensions for OpenAI text-embedding-3-large)';
COMMENT ON COLUMN fragment.embedding_generated_at IS 'Timestamp when the embedding was generated';
COMMENT ON COLUMN fragment.embedding_model IS 'Model used to generate the embedding';

-- Add function for similarity search
CREATE OR REPLACE FUNCTION search_similar_fragments(
  query_embedding vector(1536),
  similarity_threshold float DEFAULT 0.7,
  max_results int DEFAULT 10
)
RETURNS TABLE (
  fragment_id uuid,
  title text,
  content text,
  system_themes text[],
  system_emotions text[],
  similarity float,
  created_at timestamp with time zone,
  user_id uuid
) 
LANGUAGE sql STABLE
AS $$
  SELECT 
    f.id as fragment_id,
    f.title,
    f.body as content,
    f.system_themes,
    f.system_emotions,
    1 - (f.embedding <=> query_embedding) as similarity,
    f.created_at,
    f.user_id
  FROM fragment f
  WHERE f.embedding IS NOT NULL
    AND 1 - (f.embedding <=> query_embedding) > similarity_threshold
  ORDER BY f.embedding <=> query_embedding
  LIMIT max_results;
$$;

-- Add function for hybrid search (vector + text)
CREATE OR REPLACE FUNCTION hybrid_search_fragments(
  query_text text,
  query_embedding vector(1536),
  similarity_threshold float DEFAULT 0.6,
  max_results int DEFAULT 10
)
RETURNS TABLE (
  fragment_id uuid,
  title text,
  content text,
  system_themes text[],
  system_emotions text[],
  similarity float,
  text_rank float,
  combined_score float,
  created_at timestamp with time zone,
  user_id uuid
) 
LANGUAGE sql STABLE
AS $$
  WITH vector_results AS (
    SELECT 
      f.id as fragment_id,
      f.title,
      f.body as content,
      f.system_themes,
      f.system_emotions,
      1 - (f.embedding <=> query_embedding) as similarity,
      f.created_at,
      f.user_id
    FROM fragment f
    WHERE f.embedding IS NOT NULL
      AND 1 - (f.embedding <=> query_embedding) > similarity_threshold
  ),
  text_results AS (
    SELECT 
      f.id as fragment_id,
      ts_rank_cd(to_tsvector('english', f.title || ' ' || f.body), plainto_tsquery('english', query_text)) as text_rank
    FROM fragment f
    WHERE to_tsvector('english', f.title || ' ' || f.body) @@ plainto_tsquery('english', query_text)
  )
  SELECT 
    v.fragment_id,
    v.title,
    v.content,
    v.system_themes,
    v.system_emotions,
    v.similarity,
    COALESCE(t.text_rank, 0) as text_rank,
    (v.similarity * 0.7 + COALESCE(t.text_rank, 0) * 0.3) as combined_score,
    v.created_at,
    v.user_id
  FROM vector_results v
  LEFT JOIN text_results t ON v.fragment_id = t.fragment_id
  ORDER BY combined_score DESC
  LIMIT max_results;
$$;

-- Add RLS policy for embeddings (security)
CREATE POLICY "Users can read their own fragment embeddings" ON fragment
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own fragment embeddings" ON fragment
  FOR UPDATE USING (auth.uid() = user_id);

-- Add index on embedding_generated_at for performance
CREATE INDEX IF NOT EXISTS fragment_embedding_generated_at_idx 
ON fragment (embedding_generated_at) 
WHERE embedding_generated_at IS NOT NULL;

-- Add index on user_id + embedding for user-specific searches
CREATE INDEX IF NOT EXISTS fragment_user_embedding_idx 
ON fragment (user_id) 
WHERE embedding IS NOT NULL;
