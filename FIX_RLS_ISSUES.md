# Fix RLS Issues for Books Section

The error you're seeing is due to Row Level Security (RLS) policies that require authentication, but your app is using anonymous access. Here's how to fix it:

## Step 1: Fix Database RLS Policies

Run this SQL in your Supabase SQL editor:

```sql
-- Fix RLS policies for books table to work with anonymous access
-- First, enable RLS on the books table
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own books" ON public.books;
DROP POLICY IF EXISTS "Users can insert their own books" ON public.books;
DROP POLICY IF EXISTS "Users can update their own books" ON public.books;
DROP POLICY IF EXISTS "Users can delete their own books" ON public.books;

-- Create new policies that work with anonymous access
CREATE POLICY "Allow all operations on books" ON public.books
    FOR ALL USING (true) WITH CHECK (true);
```

## Step 2: Fix Storage Bucket Policies

Run this SQL to fix the storage bucket policies:

```sql
-- Create the book-covers bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('book-covers', 'book-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Allow public access to book-covers" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads to book-covers" ON storage.objects;
DROP POLICY IF EXISTS "Allow public updates to book-covers" ON storage.objects;
DROP POLICY IF EXISTS "Allow public deletes from book-covers" ON storage.objects;

-- Create new storage policies
CREATE POLICY "Allow public access to book-covers" ON storage.objects
    FOR ALL USING (bucket_id = 'book-covers');
```

## Step 3: Alternative - Disable RLS (Quick Fix)

If you want a quick fix and don't need user isolation, you can disable RLS:

```sql
-- Disable RLS on books table (less secure but works immediately)
ALTER TABLE public.books DISABLE ROW LEVEL SECURITY;
```

## Step 4: Verify Storage Bucket Setup

1. Go to your Supabase dashboard
2. Navigate to "Storage" → "Buckets"
3. Make sure you have a bucket called `book-covers`
4. If not, create it with these settings:
   - **Name**: `book-covers`
   - **Public**: ✅ Yes
   - **File size limit**: 10MB
   - **Allowed file types**: image/*

## Step 5: Test the Fix

1. Try adding a book with an image
2. Check the browser console for any remaining errors
3. Verify the image uploads successfully

## Security Considerations

### Option A: Anonymous Access (Current Setup)
- ✅ Simple to implement
- ✅ No authentication required
- ❌ All users share the same data
- ❌ Less secure for multi-user scenarios

### Option B: User Authentication (Recommended for Production)
If you want proper user isolation, you'll need to:

1. **Enable Authentication**:
   ```sql
   -- Enable RLS with proper user policies
   ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
   
   -- Drop the permissive policy
   DROP POLICY IF EXISTS "Allow all operations on books" ON public.books;
   
   -- Create user-specific policies
   CREATE POLICY "Users can view their own books" ON public.books
       FOR SELECT USING (auth.uid()::text = user_id);
   
   CREATE POLICY "Users can insert their own books" ON public.books
       FOR INSERT WITH CHECK (auth.uid()::text = user_id);
   
   CREATE POLICY "Users can update their own books" ON public.books
       FOR UPDATE USING (auth.uid()::text = user_id);
   
   CREATE POLICY "Users can delete their own books" ON public.books
       FOR DELETE USING (auth.uid()::text = user_id);
   ```

2. **Update your app to handle authentication**:
   - Add login/signup functionality
   - Update the `getCurrentUserId` function to use real user IDs
   - Handle authentication state in your app

## Troubleshooting

### If you still get RLS errors:

1. **Check RLS Status**:
   ```sql
   SELECT schemaname, tablename, rowsecurity 
   FROM pg_tables 
   WHERE tablename = 'books';
   ```

2. **Check Policies**:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'books';
   ```

3. **Check Storage Policies**:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'objects';
   ```

### If images still don't upload:

1. **Verify bucket exists and is public**
2. **Check storage policies are correct**
3. **Try uploading a small test image first**
4. **Check browser network tab for specific error details**

## Quick Test

After applying the fixes, try this in your browser console:

```javascript
// Test if storage is working
const testFile = new File(['test'], 'test.txt', { type: 'text/plain' });
supabase.storage.from('book-covers').upload('test/test.txt', testFile)
  .then(console.log)
  .catch(console.error);
```

This should help resolve the RLS issues and get your books section working properly!
