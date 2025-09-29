-- Self-Management App Database Schema
-- Run this SQL in your Supabase SQL editor to create the required tables

-- 1. Ideas table
CREATE TABLE IF NOT EXISTS public.ideas (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    created_at timestamptz DEFAULT now(),
    priority text CHECK (priority IN ('low', 'medium', 'high')) NOT NULL,
    tags text[] DEFAULT '{}',
    status text CHECK (status IN ('parking', 'in-pipeline', 'completed', 'archived')) NOT NULL DEFAULT 'parking'
);

-- 2. Execution pipelines table
CREATE TABLE IF NOT EXISTS public.execution_pipelines (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text NOT NULL,
    idea_id text NOT NULL,
    current_stage integer DEFAULT 1,
    stages jsonb DEFAULT '[]',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    notes text DEFAULT ''
);

-- 3. Repeated tasks table
CREATE TABLE IF NOT EXISTS public.repeated_tasks (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    frequency text CHECK (frequency IN ('daily', 'weekly', 'monthly')) NOT NULL,
    is_active boolean DEFAULT true,
    last_completed timestamptz,
    streak integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- 4. Non-repeated tasks table
CREATE TABLE IF NOT EXISTS public.non_repeated_tasks (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    deadline timestamptz NOT NULL,
    priority text CHECK (priority IN ('low', 'medium', 'high', 'urgent')) NOT NULL,
    status text CHECK (status IN ('pending', 'in-progress', 'completed', 'overdue')) NOT NULL DEFAULT 'pending',
    created_at timestamptz DEFAULT now(),
    completed_at timestamptz
);

-- Enable Row Level Security (RLS) for all tables
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.execution_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repeated_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.non_repeated_tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users to access only their own data
CREATE POLICY "Users can view their own ideas" ON public.ideas
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own ideas" ON public.ideas
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own ideas" ON public.ideas
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own ideas" ON public.ideas
    FOR DELETE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can view their own execution pipelines" ON public.execution_pipelines
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own execution pipelines" ON public.execution_pipelines
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own execution pipelines" ON public.execution_pipelines
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own execution pipelines" ON public.execution_pipelines
    FOR DELETE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can view their own repeated tasks" ON public.repeated_tasks
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own repeated tasks" ON public.repeated_tasks
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own repeated tasks" ON public.repeated_tasks
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own repeated tasks" ON public.repeated_tasks
    FOR DELETE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can view their own non-repeated tasks" ON public.non_repeated_tasks
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own non-repeated tasks" ON public.non_repeated_tasks
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own non-repeated tasks" ON public.non_repeated_tasks
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own non-repeated tasks" ON public.non_repeated_tasks
    FOR DELETE USING (auth.uid()::text = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ideas_user_id ON public.ideas(user_id);
CREATE INDEX IF NOT EXISTS idx_ideas_status ON public.ideas(status);
CREATE INDEX IF NOT EXISTS idx_execution_pipelines_user_id ON public.execution_pipelines(user_id);
CREATE INDEX IF NOT EXISTS idx_execution_pipelines_idea_id ON public.execution_pipelines(idea_id);
CREATE INDEX IF NOT EXISTS idx_repeated_tasks_user_id ON public.repeated_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_repeated_tasks_is_active ON public.repeated_tasks(is_active);
CREATE INDEX IF NOT EXISTS idx_non_repeated_tasks_user_id ON public.non_repeated_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_non_repeated_tasks_status ON public.non_repeated_tasks(status);
CREATE INDEX IF NOT EXISTS idx_non_repeated_tasks_deadline ON public.non_repeated_tasks(deadline);



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


CREATE TABLE IF NOT EXISTS public.books (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text NOT NULL,
    title text NOT NULL,
    author text NOT NULL,
    description text,
    cover_image_url text,
    status text CHECK (status IN ('to-read', 'reading', 'completed', 'abandoned')) NOT NULL DEFAULT 'to-read',
    rating integer CHECK (rating >= 1 AND rating <= 5),
    notes text,
    added_at timestamptz DEFAULT now(),
    started_at timestamptz,
    completed_at timestamptz,
    tags text[] DEFAULT '{}'
);
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for books
CREATE POLICY "Users can view their own books" ON public.books
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own books" ON public.books
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own books" ON public.books
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own books" ON public.books
    FOR DELETE USING (auth.uid()::text = user_id);

-- Create index for books
CREATE INDEX IF NOT EXISTS idx_books_user_id ON public.books(user_id);
CREATE INDEX IF NOT EXISTS idx_books_status ON public.books(status);


-- Fix RLS policies for books table to work with anonymous access
-- Run this in your Supabase SQL editor

-- First, enable RLS on the books table
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own books" ON public.books;
DROP POLICY IF EXISTS "Users can insert their own books" ON public.books;
DROP POLICY IF EXISTS "Users can update their own books" ON public.books;
DROP POLICY IF EXISTS "Users can delete their own books" ON public.books;

-- Create new policies that work with anonymous access
-- For now, allow all operations (you can restrict this later if needed)
CREATE POLICY "Allow all operations on books" ON public.books
    FOR ALL USING (true) WITH CHECK (true);

-- Alternative: If you want to restrict by user_id, use this instead:
-- CREATE POLICY "Allow all operations on books" ON public.books
--     FOR ALL USING (user_id = 'anonymous') WITH CHECK (user_id = 'anonymous');

-- Also fix the storage bucket policies
-- First, create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('book-covers', 'book-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to the book-covers bucket
CREATE POLICY "Allow public access to book-covers" ON storage.objects
    FOR ALL USING (bucket_id = 'book-covers');

-- Allow public uploads to book-covers bucket
CREATE POLICY "Allow public uploads to book-covers" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'book-covers');

-- Allow public updates to book-covers bucket
CREATE POLICY "Allow public updates to book-covers" ON storage.objects
    FOR UPDATE USING (bucket_id = 'book-covers');

-- Allow public deletes from book-covers bucket
CREATE POLICY "Allow public deletes from book-covers" ON storage.objects
    FOR DELETE USING (bucket_id = 'book-covers');



-- People directory tables
CREATE TABLE IF NOT EXISTS public.people (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text NOT NULL,
    name text NOT NULL,
    mobile text,
    email text,
    linkedin_url text,
    facebook_url text,
    whatsapp_url text,
    notes text,
    helpfulness_rating integer CHECK (helpfulness_rating >= 1 AND helpfulness_rating <= 5),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    tags text[] DEFAULT '{}'
);

-- Skills/help areas table
CREATE TABLE IF NOT EXISTS public.people_skills (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    person_id uuid NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
    skill_name text NOT NULL,
    skill_level text CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'expert')) NOT NULL DEFAULT 'intermediate',
    created_at timestamptz DEFAULT now()
);

-- People connections/relationships table
CREATE TABLE IF NOT EXISTS public.people_connections (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text NOT NULL,
    person_a_id uuid NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
    person_b_id uuid NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
    relationship_type text CHECK (relationship_type IN ('colleague', 'friend', 'family', 'business_partner', 'mentor', 'mentee', 'client', 'vendor', 'other')) NOT NULL DEFAULT 'other',
    relationship_notes text,
    created_at timestamptz DEFAULT now(),
    UNIQUE(person_a_id, person_b_id)
);

-- Enable RLS for people tables
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.people_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.people_connections ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for people
CREATE POLICY "Users can view their own people" ON public.people
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own people" ON public.people
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own people" ON public.people
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own people" ON public.people
    FOR DELETE USING (auth.uid()::text = user_id);

-- Create RLS policies for people_skills
CREATE POLICY "Users can view skills for their people" ON public.people_skills
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.people 
            WHERE people.id = people_skills.person_id 
            AND people.user_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can insert skills for their people" ON public.people_skills
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.people 
            WHERE people.id = people_skills.person_id 
            AND people.user_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can update skills for their people" ON public.people_skills
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.people 
            WHERE people.id = people_skills.person_id 
            AND people.user_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can delete skills for their people" ON public.people_skills
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.people 
            WHERE people.id = people_skills.person_id 
            AND people.user_id = auth.uid()::text
        )
    );

-- Create RLS policies for people_connections
CREATE POLICY "Users can view their own people connections" ON public.people_connections
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own people connections" ON public.people_connections
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own people connections" ON public.people_connections
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own people connections" ON public.people_connections
    FOR DELETE USING (auth.uid()::text = user_id);

-- Create indexes for people tables
CREATE INDEX IF NOT EXISTS idx_people_user_id ON public.people(user_id);
CREATE INDEX IF NOT EXISTS idx_people_helpfulness_rating ON public.people(helpfulness_rating);
CREATE INDEX IF NOT EXISTS idx_people_skills_person_id ON public.people_skills(person_id);
CREATE INDEX IF NOT EXISTS idx_people_connections_user_id ON public.people_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_people_connections_person_a ON public.people_connections(person_a_id);
CREATE INDEX IF NOT EXISTS idx_people_connections_person_b ON public.people_connections(person_b_id);

-- 5. Regular tasks table (simple one-time tasks without deadlines)
CREATE TABLE IF NOT EXISTS public.regular_tasks (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    priority text CHECK (priority IN ('low', 'medium', 'high', 'urgent')) NOT NULL DEFAULT 'medium',
    status text CHECK (status IN ('pending', 'in-progress', 'completed')) NOT NULL DEFAULT 'pending',
    created_at timestamptz DEFAULT now(),
    completed_at timestamptz
);


CREATE POLICY "Users can view their own regular tasks" ON public.regular_tasks
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own regular tasks" ON public.regular_tasks
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own regular tasks" ON public.regular_tasks
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own regular tasks" ON public.regular_tasks
    FOR DELETE USING (auth.uid()::text = user_id);


CREATE INDEX IF NOT EXISTS idx_regular_tasks_user_id ON public.regular_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_regular_tasks_status ON public.regular_tasks(status);

