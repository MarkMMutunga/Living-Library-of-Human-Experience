# Living Library of Human Experiences (LLHE)

A privacy-first platform for capturing, connecting, and exploring human experiences through AI-powered analysis.

## 🌟 Features

- **Privacy-First**: All data is private by default with explicit consent controls
- **Multi-Modal Fragments**: Support for text, images, audio, and video
- **AI-Powered Connections**: Automatic linking through semantic analysis, themes, emotions, time, and location
- **Multiple Exploration Modes**: Search, map view, timeline, and link-graph navigation
- **Production-Ready**: Built with scalability, security, and observability in mind

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Next.js API routes with Supabase
- **Database**: PostgreSQL with pgvector for semantic search
- **Auth**: Supabase Auth with Row Level Security
- **Storage**: Supabase Storage with signed URLs
- **AI Services**: Pluggable adapters (OpenAI/local models)
- **Deployment**: Vercel + Supabase

### Key Components
- **Fragments**: Core experience units with rich metadata
- **Links**: AI-generated connections between fragments
- **Collections**: User-curated groups of fragments
- **Search**: Hybrid lexical + semantic search
- **Processing Pipeline**: Background jobs for transcription, embedding, and linking

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account
- (Optional) OpenAI API key for enhanced AI features

### Installation

1. **Clone and install dependencies**
```bash
git clone <repository-url>
cd living-library-human-experiences
npm install
```

2. **Set up Supabase**
- Create a new Supabase project
- Run the migration files in `supabase/migrations/` in order
- Enable the pgvector extension
- Set up storage bucket named "fragments"

3. **Configure environment variables**
```bash
cp apps/web/.env.example apps/web/.env.local
```

Fill in your values:
```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SUPABASE_URL=your-project-url.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE=your-service-role-key

# AI Services (optional)
EMBEDDINGS_PROVIDER=openai  # or 'local'
TRANSCRIBE_PROVIDER=whisper # or 'local'
OPENAI_API_KEY=your-openai-api-key

# Monitoring (optional)
SENTRY_DSN=your-sentry-dsn
```

4. **Run the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔧 Development

### Project Structure
```
├── apps/web/                 # Next.js application
│   ├── src/
│   │   ├── app/              # App Router pages
│   │   ├── components/       # React components
│   │   ├── lib/             # Utilities and services
│   │   └── types/           # TypeScript types
├── supabase/
│   └── migrations/          # Database migrations
└── packages/                # Shared packages (future)
```

### Key Features

#### Fragment Creation
- Rich text editor with markdown support
- Drag-and-drop media upload
- Location tagging with coordinates
- Privacy controls (Private/Unlisted/Public)
- Automatic PII detection

#### AI Processing Pipeline
The system processes fragments through several stages:
1. **Transcription**: Audio/video → text using Whisper
2. **Embedding**: Content → vector using text-embedding-3-large
3. **Classification**: Text → emotions and themes
4. **Linking**: Create connections based on similarity and rules

#### Search & Discovery
- **Hybrid Search**: Combines lexical and semantic search
- **Faceted Filters**: By emotions, themes, time, location
- **Link Graph**: Visual exploration of connections
- **Timeline View**: Chronological browsing
- **Map View**: Geographic exploration

### AI Service Architecture

The system uses pluggable AI adapters:

```typescript
// Automatic fallback to local services
const transcription = getTranscriptionService() // OpenAI → Local
const embeddings = getEmbeddingService()       // OpenAI → Local  
const classification = getClassificationService() // OpenAI → Rules
```

This ensures the application works even without API keys, using:
- Local Whisper for transcription
- Local embedding models (BGE-M3)
- Rule-based classification for emotions/themes

## 🔒 Privacy & Security

### Privacy Controls
- **Private by Default**: All fragments start as private
- **Granular Consent**: Research sharing, model training, study invitations
- **PII Detection**: Automatic detection and redaction prompts
- **Right to Delete**: Complete data removal including media files
- **Audit Trail**: All privacy actions are logged

### Security Features
- **Row Level Security**: Database-level access controls
- **Signed URLs**: Secure media upload/access
- **Content Scanning**: Virus scanning for uploaded files
- **HTTPS Everywhere**: End-to-end encryption
- **WCAG AA**: Accessibility compliance

## 📊 API Documentation

### Core Endpoints

#### Fragments
```http
GET    /api/fragments          # Search fragments
POST   /api/fragments          # Create fragment
GET    /api/fragments/{id}     # Get fragment with links
PUT    /api/fragments/{id}     # Update fragment
DELETE /api/fragments/{id}     # Delete fragment
```

#### Upload
```http
POST   /api/upload/url         # Get signed upload URL
```

#### Links
```http
POST   /api/links/recompute/{fragmentId}  # Recompute links
```

See the full OpenAPI specification in the codebase for detailed schemas.

## 🚀 Production Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main

### Supabase Setup
1. Create production Supabase project
2. Run migrations
3. Configure RLS policies
4. Set up storage buckets with proper CORS

### Monitoring
- **Sentry**: Error tracking and performance monitoring
- **Logflare**: Structured logging
- **OpenTelemetry**: Distributed tracing

## 🧪 Testing

```bash
# Run tests
npm run test

# Type checking
npm run type-check

# Linting
npm run lint
```

## 📈 Performance

### Optimization Features
- **Edge Functions**: Fast global response times
- **Database Indexes**: Optimized for search queries
- **Vector Search**: Efficient similarity search with pgvector
- **CDN**: Media served via Vercel + Supabase CDN
- **Streaming**: Real-time updates for processing status

### SLOs
- p95 search response time: < 300ms
- p95 fragment creation: < 1.5s (excluding upload)
- 99.9% uptime target

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🔗 Links

- [Documentation](./docs/)
- [API Reference](./docs/api.md)
- [Privacy Policy](./docs/privacy.md)
- [Support](mailto:support@llhe.app)

---

Built with ❤️ for preserving and connecting human experiences.
