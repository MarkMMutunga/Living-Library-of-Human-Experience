# LLHE Deployment Guide

## Quick Deploy to Production

### 1. Database Setup (Supabase)

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Note your project URL and anon key

2. **Run Migrations**
   ```sql
   -- In Supabase SQL Editor, run these files in order:
   -- 1. supabase/migrations/20240817000001_initial_schema.sql
   -- 2. supabase/migrations/20240817000002_rls_policies.sql  
   -- 3. supabase/migrations/20240817000003_search_functions.sql
   ```

3. **Set up Storage**
   - Create bucket named "fragments"
   - Set to public: false
   - Add CORS policy for your domain

### 2. Frontend Deploy (Vercel)

1. **Connect Repository**
   - Fork this repository
   - Connect to Vercel
   - Set build command: `npm run build`
   - Set output directory: `apps/web/.next`

2. **Environment Variables**
   ```env
   NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE=your-service-role-key
   
   # Optional AI features
   OPENAI_API_KEY=your-openai-key
   EMBEDDINGS_PROVIDER=openai
   TRANSCRIBE_PROVIDER=openai
   
   # Optional monitoring
   SENTRY_DSN=your-sentry-dsn
   ```

3. **Deploy**
   - Push to main branch
   - Vercel will auto-deploy

### 3. Post-Deploy Setup

1. **Test Authentication**
   - Visit your deployed site
   - Try magic link login
   - Check Supabase auth logs

2. **Test Fragment Creation**
   - Create a test fragment
   - Upload media
   - Verify processing pipeline

3. **Configure DNS** (if using custom domain)
   - Add domain in Vercel
   - Update CNAME records
   - Update NEXT_PUBLIC_SITE_URL

### 4. Monitoring (Optional)

1. **Sentry Setup**
   - Create Sentry project
   - Add DSN to environment variables
   - Deploy to enable error tracking

2. **Health Checks**
   - Set up Vercel monitoring
   - Configure Supabase alerts
   - Test backup/restore procedures

## Development Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Local Supabase** (Optional)
   ```bash
   npx supabase start
   npx supabase db reset
   ```

3. **Environment Setup**
   ```bash
   cp apps/web/.env.example apps/web/.env.local
   # Fill in your values
   ```

4. **Start Development**
   ```bash
   npm run dev
   ```

## Production Checklist

- [ ] Database migrations applied
- [ ] RLS policies enabled
- [ ] Storage bucket configured
- [ ] Environment variables set
- [ ] Domain configured
- [ ] SSL certificate active
- [ ] Magic link authentication tested
- [ ] Fragment creation/upload tested
- [ ] Search functionality verified
- [ ] Monitoring configured
- [ ] Backup strategy in place

## Troubleshooting

### Common Issues

1. **Magic Links Not Working**
   - Check NEXT_PUBLIC_SITE_URL matches your domain
   - Verify Supabase auth redirect URLs
   - Check email template configuration

2. **Upload Errors**
   - Verify storage bucket exists and has correct permissions
   - Check CORS configuration
   - Verify file size limits

3. **Search Not Working**
   - Ensure pgvector extension is enabled
   - Check if search functions were created
   - Verify embeddings are being generated

4. **Performance Issues**
   - Enable database indexes
   - Configure CDN
   - Check Vercel function regions

### Support

For deployment issues, check:
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Project Issues](https://github.com/your-repo/issues)

---

Need help? Create an issue or contact support at support@llhe.app
