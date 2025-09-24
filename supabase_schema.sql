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

-- Add this to your existing schema

-- Books table
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

-- Enable Row Level Security (RLS) for all tables
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.execution_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repeated_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.non_repeated_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

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

-- Create RLS policies for books
CREATE POLICY "Users can view their own books" ON public.books
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own books" ON public.books
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own books" ON public.books
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own books" ON public.books
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

-- Create index for books
CREATE INDEX IF NOT EXISTS idx_books_user_id ON public.books(user_id);
CREATE INDEX IF NOT EXISTS idx_books_status ON public.books(status);

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