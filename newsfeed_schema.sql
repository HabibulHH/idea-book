-- Newsfeed Schema for Self Manager
-- This schema supports saving external links, posts, and comments

-- Posts table for newsfeed items
CREATE TABLE IF NOT EXISTS newsfeed_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL, -- Simple user identifier
  title TEXT NOT NULL,
  content TEXT, -- User's own notes/description
  url TEXT, -- External link URL
  url_metadata JSONB, -- Extracted metadata (title, description, image, etc.)
  post_type TEXT NOT NULL CHECK (post_type IN ('link', 'note', 'post')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_archived BOOLEAN DEFAULT FALSE
);

-- Comments table for posts
CREATE TABLE IF NOT EXISTS newsfeed_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES newsfeed_posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tags table for categorizing posts
CREATE TABLE IF NOT EXISTS newsfeed_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  color TEXT DEFAULT '#3B82F6', -- Default blue color
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Post tags junction table
CREATE TABLE IF NOT EXISTS newsfeed_post_tags (
  post_id UUID NOT NULL REFERENCES newsfeed_posts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES newsfeed_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_newsfeed_posts_user_id ON newsfeed_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_newsfeed_posts_created_at ON newsfeed_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_newsfeed_posts_post_type ON newsfeed_posts(post_type);
CREATE INDEX IF NOT EXISTS idx_newsfeed_comments_post_id ON newsfeed_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_newsfeed_comments_created_at ON newsfeed_comments(created_at DESC);

-- RLS (Row Level Security) policies
ALTER TABLE newsfeed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsfeed_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsfeed_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsfeed_post_tags ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (you can restrict later)
CREATE POLICY "Allow all operations on newsfeed_posts" ON newsfeed_posts FOR ALL USING (true);
CREATE POLICY "Allow all operations on newsfeed_comments" ON newsfeed_comments FOR ALL USING (true);
CREATE POLICY "Allow all operations on newsfeed_tags" ON newsfeed_tags FOR ALL USING (true);
CREATE POLICY "Allow all operations on newsfeed_post_tags" ON newsfeed_post_tags FOR ALL USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_newsfeed_posts_updated_at BEFORE UPDATE ON newsfeed_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_newsfeed_comments_updated_at BEFORE UPDATE ON newsfeed_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some default tags
INSERT INTO newsfeed_tags (name, color) VALUES 
  ('Technology', '#3B82F6'),
  ('Design', '#10B981'),
  ('Business', '#F59E0B'),
  ('Learning', '#8B5CF6'),
  ('Personal', '#EF4444'),
  ('News', '#06B6D4')
ON CONFLICT (name) DO NOTHING;
