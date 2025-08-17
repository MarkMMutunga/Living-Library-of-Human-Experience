-- Row Level Security policies for community features

-- Enable RLS on all new tables
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_endorsements ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE fragment_ratings ENABLE ROW LEVEL SECURITY;

-- Verification Requests Policies
CREATE POLICY "Users can view their own verification requests" ON verification_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create verification requests" ON verification_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending requests" ON verification_requests
    FOR UPDATE USING (auth.uid() = user_id AND status = 'pending')
    WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Moderators can view all verification requests" ON verification_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM app_user 
            WHERE id = auth.uid() 
            AND role IN ('moderator', 'admin')
        )
    );

CREATE POLICY "Moderators can update verification requests" ON verification_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM app_user 
            WHERE id = auth.uid() 
            AND role IN ('moderator', 'admin')
        )
    );

-- Verification Endorsements Policies
CREATE POLICY "Users can view endorsements for any request" ON verification_endorsements
    FOR SELECT USING (true);

CREATE POLICY "Verified users can create endorsements" ON verification_endorsements
    FOR INSERT WITH CHECK (
        auth.uid() = endorser_id AND
        EXISTS (
            SELECT 1 FROM app_user 
            WHERE id = auth.uid() 
            AND verification_level IN ('verified', 'expert')
        )
    );

-- Verification Votes Policies
CREATE POLICY "Users can view votes for any request" ON verification_votes
    FOR SELECT USING (true);

CREATE POLICY "Users can vote on verification requests" ON verification_votes
    FOR INSERT WITH CHECK (auth.uid() = voter_id);

CREATE POLICY "Users can update their own votes" ON verification_votes
    FOR UPDATE USING (auth.uid() = voter_id)
    WITH CHECK (auth.uid() = voter_id);

-- Moderation Items Policies
CREATE POLICY "Users can view their own reports" ON moderation_items
    FOR SELECT USING (auth.uid() = reported_by);

CREATE POLICY "Users can create moderation reports" ON moderation_items
    FOR INSERT WITH CHECK (auth.uid() = reported_by);

CREATE POLICY "Moderators can view all moderation items" ON moderation_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM app_user 
            WHERE id = auth.uid() 
            AND role IN ('moderator', 'admin')
        )
    );

CREATE POLICY "Moderators can update moderation items" ON moderation_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM app_user 
            WHERE id = auth.uid() 
            AND role IN ('moderator', 'admin')
        )
    );

-- Collections Policies
CREATE POLICY "Users can view public collections" ON collections
    FOR SELECT USING (privacy = 'public');

CREATE POLICY "Users can view community collections if verified" ON collections
    FOR SELECT USING (
        privacy = 'community' AND
        EXISTS (
            SELECT 1 FROM app_user 
            WHERE id = auth.uid() 
            AND verification_level IN ('basic', 'verified', 'expert')
        )
    );

CREATE POLICY "Users can view their own collections" ON collections
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Collaborators can view shared collections" ON collections
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM collection_collaborators 
            WHERE collection_id = collections.id 
            AND user_id = auth.uid() 
            AND status = 'accepted'
        )
    );

CREATE POLICY "Users can create collections" ON collections
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Owners can update their collections" ON collections
    FOR UPDATE USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Editors can update shared collections" ON collections
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM collection_collaborators 
            WHERE collection_id = collections.id 
            AND user_id = auth.uid() 
            AND role = 'editor' 
            AND status = 'accepted'
        )
    );

CREATE POLICY "Owners can delete their collections" ON collections
    FOR DELETE USING (auth.uid() = created_by);

-- Collection Collaborators Policies
CREATE POLICY "Users can view collaborators for accessible collections" ON collection_collaborators
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM collections 
            WHERE id = collection_id 
            AND (
                created_by = auth.uid() OR
                privacy = 'public' OR
                (privacy = 'community' AND EXISTS (
                    SELECT 1 FROM app_user 
                    WHERE id = auth.uid() 
                    AND verification_level IN ('basic', 'verified', 'expert')
                )) OR
                EXISTS (
                    SELECT 1 FROM collection_collaborators cc
                    WHERE cc.collection_id = collections.id 
                    AND cc.user_id = auth.uid() 
                    AND cc.status = 'accepted'
                )
            )
        )
    );

CREATE POLICY "Collection owners can manage collaborators" ON collection_collaborators
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM collections 
            WHERE id = collection_id 
            AND created_by = auth.uid()
        )
    );

CREATE POLICY "Users can update their own collaboration status" ON collection_collaborators
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Collection Items Policies
CREATE POLICY "Users can view items in accessible collections" ON collection_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM collections 
            WHERE id = collection_id 
            AND (
                created_by = auth.uid() OR
                privacy = 'public' OR
                (privacy = 'community' AND EXISTS (
                    SELECT 1 FROM app_user 
                    WHERE id = auth.uid() 
                    AND verification_level IN ('basic', 'verified', 'expert')
                )) OR
                EXISTS (
                    SELECT 1 FROM collection_collaborators 
                    WHERE collection_id = collections.id 
                    AND user_id = auth.uid() 
                    AND status = 'accepted'
                )
            )
        )
    );

CREATE POLICY "Contributors can add items to collections" ON collection_items
    FOR INSERT WITH CHECK (
        auth.uid() = added_by AND
        EXISTS (
            SELECT 1 FROM collections 
            WHERE id = collection_id 
            AND (
                created_by = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM collection_collaborators 
                    WHERE collection_id = collections.id 
                    AND user_id = auth.uid() 
                    AND role IN ('contributor', 'editor') 
                    AND status = 'accepted'
                )
            )
        )
    );

CREATE POLICY "Contributors can update items they added" ON collection_items
    FOR UPDATE USING (auth.uid() = added_by)
    WITH CHECK (auth.uid() = added_by);

CREATE POLICY "Contributors can remove items they added" ON collection_items
    FOR DELETE USING (auth.uid() = added_by);

CREATE POLICY "Editors can manage all items" ON collection_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM collections 
            WHERE id = collection_id 
            AND (
                created_by = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM collection_collaborators 
                    WHERE collection_id = collections.id 
                    AND user_id = auth.uid() 
                    AND role = 'editor' 
                    AND status = 'accepted'
                )
            )
        )
    );

-- Collection Likes Policies
CREATE POLICY "Users can view collection likes" ON collection_likes
    FOR SELECT USING (true);

CREATE POLICY "Users can like collections they can access" ON collection_likes
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM collections 
            WHERE id = collection_id 
            AND (
                privacy = 'public' OR
                created_by = auth.uid() OR
                (privacy = 'community' AND EXISTS (
                    SELECT 1 FROM app_user 
                    WHERE id = auth.uid() 
                    AND verification_level IN ('basic', 'verified', 'expert')
                )) OR
                EXISTS (
                    SELECT 1 FROM collection_collaborators 
                    WHERE collection_id = collections.id 
                    AND user_id = auth.uid() 
                    AND status = 'accepted'
                )
            )
        )
    );

CREATE POLICY "Users can remove their own likes" ON collection_likes
    FOR DELETE USING (auth.uid() = user_id);

-- Collection Comments Policies
CREATE POLICY "Users can view comments on accessible collections" ON collection_comments
    FOR SELECT USING (
        status = 'active' AND
        EXISTS (
            SELECT 1 FROM collections 
            WHERE id = collection_id 
            AND (
                privacy = 'public' OR
                created_by = auth.uid() OR
                (privacy = 'community' AND EXISTS (
                    SELECT 1 FROM app_user 
                    WHERE id = auth.uid() 
                    AND verification_level IN ('basic', 'verified', 'expert')
                )) OR
                EXISTS (
                    SELECT 1 FROM collection_collaborators 
                    WHERE collection_id = collections.id 
                    AND user_id = auth.uid() 
                    AND status = 'accepted'
                )
            )
        )
    );

CREATE POLICY "Users can comment on accessible collections" ON collection_comments
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM collections 
            WHERE id = collection_id 
            AND (
                privacy = 'public' OR
                created_by = auth.uid() OR
                (privacy = 'community' AND EXISTS (
                    SELECT 1 FROM app_user 
                    WHERE id = auth.uid() 
                    AND verification_level IN ('basic', 'verified', 'expert')
                )) OR
                EXISTS (
                    SELECT 1 FROM collection_collaborators 
                    WHERE collection_id = collections.id 
                    AND user_id = auth.uid() 
                    AND status = 'accepted'
                )
            )
        )
    );

CREATE POLICY "Users can update their own comments" ON collection_comments
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON collection_comments
    FOR DELETE USING (auth.uid() = user_id);

-- Fragment Ratings Policies
CREATE POLICY "Users can view fragment ratings" ON fragment_ratings
    FOR SELECT USING (true);

CREATE POLICY "Users can rate public fragments" ON fragment_ratings
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM fragment 
            WHERE id = fragment_id 
            AND (is_private = false OR created_by = auth.uid())
        )
    );

CREATE POLICY "Users can update their own ratings" ON fragment_ratings
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ratings" ON fragment_ratings
    FOR DELETE USING (auth.uid() = user_id);
