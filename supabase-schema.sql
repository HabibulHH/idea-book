-- Create custom types
CREATE TYPE idea_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE idea_status AS ENUM ('parking', 'in-pipeline', 'completed', 'archived');
CREATE TYPE task_frequency AS ENUM ('daily', 'weekly', 'monthly');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE task_status AS ENUM ('pending', 'in-progress', 'completed', 'overdue');

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create ideas table
CREATE TABLE public.ideas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    priority idea_priority DEFAULT 'medium',
    tags TEXT[] DEFAULT '{}',
    status idea_status DEFAULT 'parking'
);

-- Create execution_pipelines table
CREATE TABLE public.execution_pipelines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    idea_id UUID REFERENCES public.ideas(id) ON DELETE CASCADE,
    current_stage INTEGER DEFAULT 1,
    stages JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT DEFAULT ''
);

-- Create repeated_tasks table
CREATE TABLE public.repeated_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    frequency task_frequency DEFAULT 'daily',
    is_active BOOLEAN DEFAULT true,
    last_completed DATE,
    streak INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create non_repeated_tasks table
CREATE TABLE public.non_repeated_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    deadline DATE,
    priority task_priority DEFAULT 'medium',
    status task_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.execution_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repeated_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.non_repeated_tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for ideas
CREATE POLICY "Users can view own ideas" ON public.ideas
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ideas" ON public.ideas
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ideas" ON public.ideas
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ideas" ON public.ideas
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for execution_pipelines
CREATE POLICY "Users can view own pipelines" ON public.execution_pipelines
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pipelines" ON public.execution_pipelines
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pipelines" ON public.execution_pipelines
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own pipelines" ON public.execution_pipelines
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for repeated_tasks
CREATE POLICY "Users can view own repeated tasks" ON public.repeated_tasks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own repeated tasks" ON public.repeated_tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own repeated tasks" ON public.repeated_tasks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own repeated tasks" ON public.repeated_tasks
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for non_repeated_tasks
CREATE POLICY "Users can view own non-repeated tasks" ON public.non_repeated_tasks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own non-repeated tasks" ON public.non_repeated_tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own non-repeated tasks" ON public.non_repeated_tasks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own non-repeated tasks" ON public.non_repeated_tasks
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at for execution_pipelines
CREATE TRIGGER update_execution_pipelines_updated_at
    BEFORE UPDATE ON public.execution_pipelines
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_ideas_user_id ON public.ideas(user_id);
CREATE INDEX idx_ideas_status ON public.ideas(status);
CREATE INDEX idx_execution_pipelines_user_id ON public.execution_pipelines(user_id);
CREATE INDEX idx_execution_pipelines_idea_id ON public.execution_pipelines(idea_id);
CREATE INDEX idx_repeated_tasks_user_id ON public.repeated_tasks(user_id);
CREATE INDEX idx_repeated_tasks_is_active ON public.repeated_tasks(is_active);
CREATE INDEX idx_non_repeated_tasks_user_id ON public.non_repeated_tasks(user_id);
CREATE INDEX idx_non_repeated_tasks_deadline ON public.non_repeated_tasks(deadline);
CREATE INDEX idx_non_repeated_tasks_status ON public.non_repeated_tasks(status);