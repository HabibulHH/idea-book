# Supabase Setup Guide for Self Manager

This guide will help you set up Supabase integration for persistent data storage.

## Prerequisites

1. A Supabase account (sign up at [supabase.com](https://supabase.com))
2. A new Supabase project

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Enter a project name (e.g., "self-manager")
5. Enter a secure database password
6. Choose a region close to your users
7. Click "Create new project"

## Step 2: Set Up Database Schema

1. Go to your Supabase project dashboard
2. Navigate to "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy and paste the contents of `supabase-schema.sql` into the editor
5. Click "Run" to execute the SQL commands

This will create:
- All necessary tables with proper structure
- Row Level Security (RLS) policies
- Indexes for performance
- Custom types and constraints

## Step 3: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. In your Supabase project dashboard, go to "Settings" > "API"

3. Copy the following values to your `.env` file:
   - **Project URL**: Copy the "Project URL"
   - **Anon Key**: Copy the "anon public" key

4. Update your `.env` file:
   ```env
   # Replace with your actual Supabase values
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here

   # Enable Supabase storage
   VITE_USE_SUPABASE=true
   ```

## Step 4: Enable Authentication (Optional)

If you want user authentication:

1. Go to "Authentication" > "Settings" in your Supabase dashboard
2. Configure your preferred auth providers
3. Set up email templates if using email auth

## Step 5: Test the Integration

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Open the application and try:
   - Creating a new idea
   - Adding daily tasks
   - Creating office tasks
   - Moving ideas to pipeline

3. Check your Supabase dashboard under "Table Editor" to verify data is being saved

## Data Migration

### From localStorage to Supabase

If you already have data in localStorage:

1. Export your current data using the "Export Data" button
2. Set up Supabase as described above
3. Import your data using the "Import Data" button

### From Supabase to localStorage

1. Export your data from the app
2. Set `VITE_USE_SUPABASE=false` in your `.env` file
3. Import the data back

## Database Structure

The schema includes these main tables:

### `ideas`
- Stores idea parking lot items
- Includes title, description, priority, tags, status
- Links to execution pipelines

### `execution_pipelines`
- Tracks ideas through the 6-stage execution process
- Links to ideas table
- Stores current stage and notes

### `repeated_tasks`
- Daily/weekly/monthly recurring tasks
- Tracks completion streaks
- Can be activated/deactivated

### `non_repeated_tasks`
- One-time tasks with deadlines
- Priority levels and status tracking
- Due date management

## Security

- Row Level Security (RLS) is enabled on all tables
- Users can only access their own data
- Authentication is handled by Supabase Auth
- API keys are safely managed through environment variables

## Troubleshooting

### Common Issues

1. **"Invalid API key" error**
   - Check that your `VITE_SUPABASE_ANON_KEY` is correct
   - Ensure you're using the "anon public" key, not the "service role" key

2. **"Permission denied" errors**
   - Verify that RLS policies are correctly set up
   - Check that the SQL schema was executed successfully

3. **Data not appearing**
   - Ensure `VITE_USE_SUPABASE=true` in your `.env` file
   - Check browser console for error messages
   - Verify database connection in Supabase dashboard

4. **Environment variables not loading**
   - Restart your development server after changing `.env`
   - Ensure `.env` file is in the project root
   - Check that variable names start with `VITE_`

### Debugging

1. Check browser console for error messages
2. Monitor the "Logs" section in your Supabase dashboard
3. Use the "Table Editor" to verify data is being stored
4. Test API connections in the "API" section

## Performance Optimization

- Indexes are automatically created for common queries
- RLS policies are optimized for user-specific data access
- Connection pooling is handled by Supabase

## Backup and Recovery

- Supabase automatically backs up your database
- You can also export data using the app's export feature
- Consider setting up additional backup strategies for production use

## Cost Considerations

- Supabase has a generous free tier
- Monitor usage in the Supabase dashboard
- Consider upgrading for production applications

## Support

- Supabase documentation: [supabase.com/docs](https://supabase.com/docs)
- Community support: [supabase.com/discord](https://supabase.com/discord)
- GitHub issues for this project: Create an issue if you encounter problems