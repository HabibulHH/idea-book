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
