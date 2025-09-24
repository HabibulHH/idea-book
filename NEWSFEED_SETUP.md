# Newsfeed Feature Setup Guide

## Overview
The Newsfeed feature is designed to replace social media scrolling habits with a personal knowledge management system. You can save external links, add your own notes, and comment on posts.

## Features
- **Infinite Scroll**: Load posts as you scroll down
- **Link Saving**: Save external URLs with automatic metadata extraction
- **Personal Notes**: Add your own thoughts and comments
- **Commenting System**: Add comments to any post
- **Tagging System**: Categorize posts with tags
- **Archive Posts**: Hide posts you no longer need

## Database Setup

### 1. Run the Schema
Execute the SQL schema in your Supabase database:

```sql
-- Run the contents of newsfeed_schema.sql in your Supabase SQL editor
```

### 2. Tables Created
- `newsfeed_posts`: Main posts table
- `newsfeed_comments`: Comments on posts
- `newsfeed_tags`: Available tags
- `newsfeed_post_tags`: Junction table for post-tag relationships

### 3. Default Tags
The schema includes these default tags:
- Technology (Blue)
- Design (Green)
- Business (Orange)
- Learning (Purple)
- Personal (Red)
- News (Cyan)

## Usage

### Adding Posts
1. Click "Add Post" button
2. Choose post type:
   - **Link**: Save external URLs with metadata
   - **Note**: Personal notes and thoughts
   - **Post**: General posts
3. Add title and description
4. For links, paste the URL
5. Click "Add Post"

### Commenting
1. Scroll to any post
2. Type your comment in the input field
3. Press Enter or click Send
4. Comments appear in chronological order

### Archiving
- Click the archive icon (📦) on any post
- Archived posts are hidden from the feed
- They can be restored later if needed

## Technical Details

### Infinite Scroll
- Loads 10 posts at a time
- Automatically loads more when scrolling to bottom
- Uses Intersection Observer API

### URL Metadata
- Automatically extracts site name
- Can be extended to extract title, description, images
- Currently basic implementation

### Data Flow
1. Posts stored in Supabase
2. Real-time updates via Supabase subscriptions
3. Local state management for UI updates
4. Optimistic updates for better UX

## Customization

### Adding New Post Types
1. Update the `post_type` enum in the schema
2. Add new options to the Select component
3. Update the TypeScript types

### Custom Tags
1. Add tags via the database
2. Update the `getTags()` function
3. Modify the tag selection UI

### Metadata Extraction
The current implementation is basic. For production:
1. Use a proper metadata extraction service
2. Implement Open Graph and Twitter Card parsing
3. Add image previews
4. Cache metadata for performance

## Security Notes
- Currently uses simple user_id ('admin')
- In production, implement proper authentication
- Add RLS policies for multi-user support
- Validate and sanitize all inputs

## Performance Considerations
- Posts are paginated (10 per page)
- Comments are loaded with posts
- Consider implementing comment pagination for large posts
- Add database indexes for better query performance

## Future Enhancements
- Search functionality
- Post filtering by tags
- Export/import posts
- Rich text editing
- Image attachments
- Post sharing
- Analytics and insights
