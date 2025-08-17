# Living Library of Human Experiences (LLHE)

A privacy-first platform for capturing, connecting, and exploring human experiences through AI-powered analysis. Featuring advanced search capabilities, ML-powered insights, and interactive data visualizations.

## 🌟 Features

### Core Functionality
- **Privacy-First**: All data is private by default with explicit consent controls
- **Multi-Modal Fragments**: Support for text, images, audio, and video
- **AI-Powered Connections**: Automatic linking through semantic analysis, themes, emotions, time, and location
- **Advanced Search**: Hybrid semantic + traditional search with intelligent filtering
- **Personal Insights**: ML-powered pattern analysis and growth tracking
- **Interactive Visualizations**: Timeline charts, theme analysis, emotional journey mapping

### Advanced Features (Phase 5B)
- **Smart Search Interface**: Real-time suggestions, auto-complete, and search history
- **Search Result Clustering**: AI-powered grouping of related memories
- **Personal Pattern Detection**: Identify thematic, emotional, temporal, and behavioral patterns
- **Growth Analytics**: Track personal development over time
- **Relationship Mapping**: Visualize important people, places, and concepts
- **Predictive Insights**: AI-powered recommendations and writing prompts

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Charts**: Recharts for interactive data visualizations
- **Backend**: Next.js API routes with Supabase
- **Database**: PostgreSQL with pgvector for semantic search
- **Auth**: Supabase Auth with Row Level Security
- **Storage**: Supabase Storage with signed URLs
- **AI Services**: OpenAI GPT-4 + text-embedding-3-large
- **Deployment**: Vercel + Supabase

### Database Schema
```sql
Tables:
├── app_user (User management)
├── consent (Privacy consent tracking)
├── fragment (Core experience data with vector embeddings)
├── link (AI-generated connections between fragments)
├── collection (User-curated fragment groups)
├── collection_item (Collection membership)
└── audit_event (Privacy compliance logging)

Features:
├── Row Level Security (RLS) policies
├── Vector similarity search with ivfflat indexes
├── Full-text search capabilities
├── Audit logging for compliance
└── Cascading deletes for data integrity
```

### API Routes
```
Authentication:
├── POST /api/auth/login (Magic link authentication)

Fragments:
├── GET /api/fragments (Search with filters, pagination)
├── POST /api/fragments (Create new fragments)
├── GET /api/fragments/[id] (Get specific fragment with links)
├── PUT /api/fragments/[id] (Update fragment)
└── DELETE /api/fragments/[id] (Delete with media cleanup)

Advanced Search:
├── POST /api/search/advanced (Multi-method search with clustering)
├── GET /api/search/advanced?action=suggestions (AI-powered suggestions)
├── GET /api/search/advanced?action=filters (Available filter options)
└── GET /api/search/advanced?action=analytics (Search analytics)

Insights & Analytics:
├── GET /api/insights?type=full (Comprehensive analysis)
├── GET /api/insights?type=patterns (Pattern analysis)
├── GET /api/insights?type=growth (Growth insights)
└── GET /api/insights?type=relationships (Relationship mapping)

Media Upload:
├── POST /api/upload/url (Generate signed upload URLs)

Background Processing:
└── POST /api/links/recompute/[fragmentId] (Recompute fragment links)
```

### AI Services
```typescript
Services:
├── Embedding Service (OpenAI text-embedding-3-large)
├── Analysis Service (GPT-4 for story analysis and insights)
├── Classification Service (Emotion/theme detection + PII detection)
├── Transcription Service (Whisper API)
├── Vector Search Service (Semantic similarity with pgvector)
├── Advanced Search Service (Multi-method search with clustering)
└── Insights Analyzer (ML-powered pattern detection)
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account
- OpenAI API key (for AI features)

### Installation

1. **Clone and install dependencies**
```bash
git clone <repository-url>
cd living-library-human-experiences
npm install
```

2. **Set up Supabase**
- Create a new Supabase project
- Run the migration files in `supabase/migrations/` in order:
  1. `20240817000001_initial_schema.sql`
  2. `20240817000002_rls_policies.sql`
  3. `20240817000003_search_functions.sql`
- Enable the pgvector extension
- Create a storage bucket named "fragments" (private)

3. **Environment Configuration**
```bash
cp apps/web/.env.example apps/web/.env.local
```

Fill in your environment variables:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# AI Services
OPENAI_API_KEY=your-openai-api-key

# Optional providers (defaults to openai)
EMBEDDINGS_PROVIDER=openai
TRANSCRIBE_PROVIDER=openai

# Optional monitoring
SENTRY_DSN=your-sentry-dsn
```

4. **Run the development server**
```bash
npm run dev
```

Visit `http://localhost:3000` to see your application.

## 📖 Usage Guide

### Creating Your First Memory
1. Sign up using the magic link authentication
2. Click "Share Your Story" or navigate to `/create`
3. Write your memory, add media files if desired
4. The AI will automatically analyze and connect your content

### Exploring Your Memories
- **Browse**: View all your memories on the fragments page
- **Search**: Use the advanced search with filters for themes, emotions, and time periods
- **Insights**: Visit the insights page to see patterns and analytics about your life story
- **Connections**: Click on any memory to see AI-generated connections to related experiences

### Advanced Search Features
- **Multi-Method Search**: Combines semantic and traditional search for better results
- **Smart Suggestions**: Get AI-powered suggestions as you type
- **Result Clustering**: Related memories are automatically grouped together
- **Advanced Filters**: Filter by themes, emotions, time periods, sentiment, and more

### Personal Insights Dashboard
- **Timeline View**: See your writing activity and content trends over time
- **Theme Analysis**: Discover your dominant themes and interests
- **Emotional Journey**: Visualize your emotional patterns and growth
- **Growth Tracking**: Monitor personal development areas over time
- **Relationship Mapping**: See important people, places, and concepts in your life
- **Pattern Recognition**: AI identifies recurring behavioral and thematic patterns

## 🚀 Deployment

### Quick Deploy to Vercel + Supabase

1. **Fork this repository**

2. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Run the migration files in the SQL editor
   - Create a "fragments" storage bucket (set to private)
   - Note your project URL, anon key, and service role key

3. **Deploy to Vercel**
   - Connect your forked repository to Vercel
   - Set environment variables in Vercel dashboard
   - Deploy!

4. **Configure environment variables in Vercel**
```env
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=your-openai-key
```

### Production Considerations
- Set up Sentry for error monitoring
- Configure Supabase backup policies
- Set up health checks and uptime monitoring
- Consider rate limiting for AI API calls
- Review and adjust database performance settings

## 🔧 Development

### Project Structure
```
├── apps/
│   └── web/                 # Next.js application
│       ├── src/
│       │   ├── app/         # App router pages and API routes
│       │   ├── components/  # React components
│       │   │   ├── auth/    # Authentication components
│       │   │   ├── fragments/ # Fragment-related components
│       │   │   ├── search/  # Advanced search components
│       │   │   ├── insights/ # Analytics and insights components
│       │   │   └── ui/      # Base UI components
│       │   ├── lib/         # Utility libraries
│       │   │   ├── ai/      # AI services and integrations
│       │   │   ├── search/  # Advanced search services
│       │   │   ├── ml/      # Machine learning and insights
│       │   │   └── supabase/ # Database client configuration
│       │   └── types/       # TypeScript type definitions
├── packages/
│   └── ui/                  # Shared UI components
├── supabase/
│   └── migrations/          # Database migration files
└── docs/                    # Additional documentation
```

### Key Components

#### Advanced Search System
- **AdvancedSearchService**: Multi-method search with semantic and traditional approaches
- **SearchResultsClustering**: AI-powered grouping of related results
- **AdvancedSearchInterface**: Smart search UI with real-time suggestions

#### ML Insights Engine
- **InsightsAnalyzer**: Pattern detection and personal analytics
- **InsightsVisualization**: Interactive charts and data visualizations
- **PersonalPattern Detection**: Thematic, emotional, temporal, and growth patterns

#### AI Services
- **OpenAI Integration**: GPT-4 for analysis, text-embedding-3-large for vectors
- **Vector Search**: Semantic similarity using pgvector
- **Classification**: Automated theme and emotion detection

### Development Commands
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Run type checking
npm run type-check
```

### Testing
- Visit `/create` to test fragment creation
- Try the advanced search at `/fragments` with various filters
- Explore the insights dashboard at `/insights`
- Test AI features by creating multiple related memories

## 🔒 Security & Privacy

### Privacy-First Design
- All user data is private by default
- Explicit consent required for any data processing
- Complete audit logging for privacy compliance
- Right to delete with full data removal

### Security Features
- Row Level Security (RLS) policies at database level
- Signed URLs for secure media upload/download
- PII detection and prevention
- Secure authentication with Supabase Auth
- API rate limiting and validation

### Compliance
- GDPR-compliant data handling
- Comprehensive audit logging
- User consent management
- Data portability features

## 🎯 Roadmap

### ✅ Completed (Phase 5B)
- Advanced search with multi-method approach
- ML-powered personal insights and pattern detection
- Interactive data visualizations and analytics
- Search result clustering and smart suggestions
- Personal growth tracking and recommendations

### 🔄 Future Enhancements
- Mobile application (React Native)
- Collaborative features (shared collections)
- Advanced AI models (local deployment options)
- Integration with external services (calendars, social media)
- Enhanced privacy controls and encryption

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the documentation above
- Review the API endpoints and usage examples
- Test with sample data to understand the features
- The codebase is well-documented with inline comments

## 🙏 Acknowledgments

- Built with Next.js, Supabase, and OpenAI
- UI components from shadcn/ui
- Charts and visualizations with Recharts
- Inspired by the need for privacy-first personal data platforms
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

Built by Mark Mikile Mutunga with ❤️ for preserving and connecting human experiences.
