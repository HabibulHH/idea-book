# Books Section Setup Guide

This guide will help you set up the Books section with image storage using Supabase.

## Prerequisites

1. Supabase project set up (see `SUPABASE_SETUP.md`)
2. Supabase Storage enabled

## Step 1: Enable Supabase Storage

1. Go to your Supabase project dashboard
2. Navigate to "Storage" in the left sidebar
3. Create a new bucket called `book-covers`
4. Set the bucket to "Public" for direct image access
5. Configure the bucket settings:
   - **File size limit**: 10MB (adjust as needed)
   - **Allowed file types**: image/*

## Step 2: Update Database Schema

Run the updated SQL schema in your Supabase SQL editor. The schema now includes:

```sql
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

-- Enable RLS for books table
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
```

## Step 3: Features

### Book Management
- **Add Books**: Click "Add Book" to add new books with cover images
- **Image Upload**: Upload book cover images (stored in Supabase Storage)
- **Status Tracking**: Track reading progress (To Read, Reading, Completed, Abandoned)
- **Rating System**: Rate books from 1-5 stars
- **Search & Filter**: Search by title/author and filter by status
- **Tags**: Add custom tags to organize books

### Responsive Design
- **Desktop**: Right sidebar shows book details when selected
- **Mobile**: Modal popup for book details
- **Grid Layout**: Responsive grid that adapts to screen size

### Image Storage
- **Supabase Storage**: Images stored in `book-covers` bucket
- **Automatic Cleanup**: Images deleted when books are removed
- **Public URLs**: Direct access to cover images
- **File Size Limit**: 10MB per image (configurable)

## Step 4: Usage

1. **Adding Books**:
   - Click "Add Book" button
   - Fill in title, author, description
   - Upload cover image (optional)
   - Click "Add Book" to save

2. **Managing Books**:
   - Click on any book to view details
   - Change status using the dropdown
   - Rate books by clicking stars
   - Add notes and tags
   - Delete books when no longer needed

3. **Searching & Filtering**:
   - Use search bar to find books by title/author
   - Filter by status (All, To Read, Reading, etc.)
   - Books are automatically sorted by date added

## Storage Limits

- **Free Tier**: 1GB storage, 2GB bandwidth/month
- **Pro Tier**: 100GB storage, 250GB bandwidth/month
- **File Size**: 10MB per image (configurable in bucket settings)

## Troubleshooting

### Common Issues

1. **Images not uploading**:
   - Check bucket permissions
   - Verify file size is under limit
   - Ensure bucket is public or RLS policies allow access

2. **Books not saving**:
   - Check database connection
   - Verify RLS policies are set up correctly
   - Check browser console for errors

3. **Images not displaying**:
   - Verify bucket is public
   - Check image URLs in database
   - Ensure CORS is configured correctly

### Debugging

1. Check browser console for errors
2. Monitor Supabase logs in dashboard
3. Verify storage bucket settings
4. Test image uploads manually in Supabase dashboard

## Security

- **Row Level Security**: Users can only access their own books
- **Image Access**: Public bucket allows direct image access
- **Authentication**: Requires user authentication to access books

## Performance

- **CDN**: Images served via Supabase CDN for fast loading
- **Optimization**: Images are cached for better performance
- **Lazy Loading**: Images load as needed to save bandwidth

## Backup

- **Automatic**: Supabase automatically backs up your database
- **Export**: Use the app's export feature to backup book data
- **Images**: Images are stored redundantly in Supabase Storage

## Cost Optimization

- **Image Compression**: Consider compressing images before upload
- **Cleanup**: Regularly remove unused images
- **Monitoring**: Monitor storage usage in Supabase dashboard
