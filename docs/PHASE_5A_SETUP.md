# Phase 5A: Real AI Integration - Environment Setup

## Required Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4
OPENAI_EMBEDDING_MODEL=text-embedding-3-large

# Optional: API Rate Limiting
OPENAI_MAX_REQUESTS_PER_MINUTE=100
OPENAI_MAX_TOKENS_PER_MINUTE=150000
```

## Getting Your OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to "API Keys" in your dashboard
4. Click "Create new secret key"
5. Copy the key and add it to your `.env.local` file

## Database Migration

To enable vector search capabilities, run the new migration:

```bash
# Navigate to the supabase directory
cd supabase

# Run the new migration
supabase db push

# Or if using Supabase CLI locally
supabase migration up
```

## Supabase Vector Extension

Make sure your Supabase project has the `pgvector` extension enabled:

1. Go to your Supabase dashboard
2. Navigate to Database > Extensions
3. Enable the `vector` extension if not already enabled

## Testing the Integration

Once configured, the following endpoints will use real AI:

- `/api/ai/story-mapping` - GPT-4 powered story analysis
- `/api/ai/recommendations` - Vector similarity recommendations  
- `/api/ai/temporal-search` - Semantic search with embeddings

## Features Implemented

### 1. OpenAI Service (`/lib/ai/openai-service.ts`)
- **Story Analysis**: Deep psychological and thematic analysis using GPT-4
- **Embedding Generation**: Vector embeddings for semantic search
- **Content Recommendations**: AI-powered content suggestions

### 2. Vector Search Service (`/lib/ai/vector-search.ts`)
- **Semantic Search**: Find similar content using vector similarity
- **Hybrid Search**: Combines vector search with PostgreSQL full-text search
- **Batch Processing**: Efficiently generate embeddings for multiple fragments

### 3. Enhanced API Endpoints
- **Story Mapping**: Real AI analysis replacing mock data
- **Recommendations**: Vector-based and theme-based recommendations
- **Temporal Search**: Semantic search with temporal context

## API Usage Examples

### Story Analysis
```typescript
POST /api/ai/story-mapping
{
  "fragmentId": "uuid",
  "generateEmbedding": true
}
```

### Get Recommendations
```typescript
POST /api/ai/recommendations
{
  "fragmentId": "uuid",
  "type": "similar",
  "limit": 5
}
```

### Semantic Search
```typescript
POST /api/ai/temporal-search
{
  "query": "childhood memories about family",
  "semanticSearch": true,
  "limit": 10
}
```

## Performance Considerations

- **Embedding Generation**: ~1-2 seconds per fragment
- **Vector Search**: Very fast (<100ms for similarity queries)
- **Rate Limits**: OpenAI has API rate limits, consider batching
- **Costs**: OpenAI charges per token used

## Security Notes

- API keys should never be committed to version control
- Use environment variables for all sensitive configuration
- Vector embeddings contain semantic information about your content
- Consider data privacy implications when using third-party AI services

## Next Steps (Phase 5B)

The foundation is now ready for:
- Advanced search UI components
- Real-time embedding generation
- Machine learning insights
- Personalized content curation
- Cross-user semantic similarity (with privacy controls)
