-- Add community and trust features to the database schema

-- Add role and verification fields to app_user table
ALTER TABLE app_user 
ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
ADD COLUMN verification_level TEXT DEFAULT 'unverified' CHECK (verification_level IN ('unverified', 'basic', 'verified', 'expert')),
ADD COLUMN trust_score DECIMAL(3,2) DEFAULT 0.00 CHECK (trust_score >= 0 AND trust_score <= 1),
ADD COLUMN verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create verification_requests table
CREATE TABLE verification_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    verification_type TEXT NOT NULL CHECK (verification_type IN ('identity', 'expertise', 'experience')),
    personal_statement TEXT NOT NULL,
    submitted_documents JSONB DEFAULT '[]'::jsonb,
    ai_credibility_score DECIMAL(3,2) DEFAULT 0.00,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'under-review', 'approved', 'rejected')),
    reviewer_id UUID REFERENCES app_user(id),
    reviewer_notes TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create verification_endorsements table
CREATE TABLE verification_endorsements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id UUID NOT NULL REFERENCES verification_requests(id) ON DELETE CASCADE,
    endorser_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    endorsement_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(request_id, endorser_id)
);

-- Create verification_votes table
CREATE TABLE verification_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id UUID NOT NULL REFERENCES verification_requests(id) ON DELETE CASCADE,
    voter_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    vote_type TEXT NOT NULL CHECK (vote_type IN ('positive', 'negative')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(request_id, voter_id)
);

-- Create moderation_items table
CREATE TABLE moderation_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('fragment', 'comment', 'user', 'collection')),
    target_id UUID NOT NULL,
    reported_by UUID NOT NULL REFERENCES app_user(id),
    report_reason TEXT NOT NULL,
    severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'under-review', 'approved', 'rejected')),
    ai_confidence DECIMAL(3,2) DEFAULT 0.00,
    reviewer_id UUID REFERENCES app_user(id),
    reviewer_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Create collections table (for collaborative collections)
CREATE TABLE collections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    privacy TEXT DEFAULT 'private' CHECK (privacy IN ('public', 'private', 'community')),
    tags TEXT[] DEFAULT '{}',
    likes_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create collection_collaborators table
CREATE TABLE collection_collaborators (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'viewer' CHECK (role IN ('viewer', 'contributor', 'editor')),
    invited_by UUID REFERENCES app_user(id),
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(collection_id, user_id)
);

-- Create collection_items table (linking fragments to collections)
CREATE TABLE collection_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    fragment_id UUID NOT NULL REFERENCES fragment(id) ON DELETE CASCADE,
    added_by UUID NOT NULL REFERENCES app_user(id),
    position INTEGER DEFAULT 0,
    notes TEXT,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(collection_id, fragment_id)
);

-- Create collection_likes table
CREATE TABLE collection_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(collection_id, user_id)
);

-- Create collection_comments table
CREATE TABLE collection_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'deleted')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create fragment_ratings table (for rating fragments)
CREATE TABLE fragment_ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    fragment_id UUID NOT NULL REFERENCES fragment(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(fragment_id, user_id)
);

-- Add status column to fragment table if it doesn't exist
ALTER TABLE fragment 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'deleted'));

-- Create indexes for better performance
CREATE INDEX idx_verification_requests_user_id ON verification_requests(user_id);
CREATE INDEX idx_verification_requests_status ON verification_requests(status);
CREATE INDEX idx_moderation_items_status ON moderation_items(status);
CREATE INDEX idx_moderation_items_severity ON moderation_items(severity);
CREATE INDEX idx_collections_created_by ON collections(created_by);
CREATE INDEX idx_collections_privacy ON collections(privacy);
CREATE INDEX idx_collection_collaborators_user_id ON collection_collaborators(user_id);
CREATE INDEX idx_collection_collaborators_status ON collection_collaborators(status);
CREATE INDEX idx_app_user_role ON app_user(role);
CREATE INDEX idx_app_user_verification_level ON app_user(verification_level);
CREATE INDEX idx_app_user_trust_score ON app_user(trust_score);

-- Create function to update trust scores
CREATE OR REPLACE FUNCTION update_trust_score(user_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
    user_data RECORD;
    trust_score DECIMAL := 0;
    verification_scores JSONB := '{"unverified": 0.2, "basic": 0.4, "verified": 0.7, "expert": 0.9}';
    account_age_months DECIMAL;
    contribution_count INTEGER;
    avg_rating DECIMAL;
    report_count INTEGER;
    age_factor DECIMAL;
    contribution_factor DECIMAL;
    rating_factor DECIMAL;
    report_penalty DECIMAL;
BEGIN
    -- Get user data
    SELECT 
        verification_level,
        created_at,
        (SELECT COUNT(*) FROM fragment WHERE created_by = user_uuid AND status = 'active') as fragment_count,
        (SELECT AVG(rating) FROM fragment_ratings WHERE fragment_id IN 
         (SELECT id FROM fragment WHERE created_by = user_uuid)) as average_rating,
        (SELECT COUNT(*) FROM moderation_items WHERE target_id = user_uuid) as report_count
    INTO user_data;

    IF user_data IS NULL THEN
        RETURN 0;
    END IF;

    -- Base score for verification level
    trust_score := (verification_scores ->> user_data.verification_level)::DECIMAL;

    -- Account age factor (up to 0.1)
    account_age_months := EXTRACT(EPOCH FROM (NOW() - user_data.created_at)) / (30 * 24 * 60 * 60);
    age_factor := LEAST(account_age_months / 12, 1) * 0.1;
    trust_score := trust_score + age_factor;

    -- Contribution factor (up to 0.15)
    contribution_count := COALESCE(user_data.fragment_count, 0);
    contribution_factor := LEAST(contribution_count::DECIMAL / 50, 1) * 0.15;
    trust_score := trust_score + contribution_factor;

    -- Rating factor (up to 0.15)
    IF user_data.average_rating IS NOT NULL THEN
        rating_factor := (user_data.average_rating / 5) * 0.15;
        trust_score := trust_score + rating_factor;
    END IF;

    -- Penalty for reports
    report_count := COALESCE(user_data.report_count, 0);
    report_penalty := LEAST(report_count * 0.05, 0.2);
    trust_score := trust_score - report_penalty;

    -- Ensure score is between 0 and 1
    trust_score := GREATEST(0, LEAST(1, trust_score));

    -- Update the user's trust score
    UPDATE app_user 
    SET trust_score = trust_score, updated_at = NOW() 
    WHERE id = user_uuid;

    RETURN trust_score;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update collection counts
CREATE OR REPLACE FUNCTION update_collection_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'collection_likes' THEN
        IF TG_OP = 'INSERT' THEN
            UPDATE collections SET likes_count = likes_count + 1 WHERE id = NEW.collection_id;
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE collections SET likes_count = likes_count - 1 WHERE id = OLD.collection_id;
        END IF;
    ELSIF TG_TABLE_NAME = 'collection_comments' THEN
        IF TG_OP = 'INSERT' THEN
            UPDATE collections SET comments_count = comments_count + 1 WHERE id = NEW.collection_id;
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE collections SET comments_count = comments_count - 1 WHERE id = OLD.collection_id;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER collection_likes_count_trigger
    AFTER INSERT OR DELETE ON collection_likes
    FOR EACH ROW EXECUTE FUNCTION update_collection_counts();

CREATE TRIGGER collection_comments_count_trigger
    AFTER INSERT OR DELETE ON collection_comments
    FOR EACH ROW EXECUTE FUNCTION update_collection_counts();

-- Update updated_at triggers for new tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_verification_requests_updated_at
    BEFORE UPDATE ON verification_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collections_updated_at
    BEFORE UPDATE ON collections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collection_comments_updated_at
    BEFORE UPDATE ON collection_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fragment_ratings_updated_at
    BEFORE UPDATE ON fragment_ratings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
