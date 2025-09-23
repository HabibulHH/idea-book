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