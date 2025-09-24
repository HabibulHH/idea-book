import { supabase } from './supabase'
import type { NewsfeedPost, NewsfeedComment, NewsfeedTag } from '@/types'

const USER_ID = 'admin' // In a real app, this would come from authentication

export class NewsfeedService {
  // Get posts with pagination, filtering, and search
  static async getPosts(
    page = 0, 
    limit = 10, 
    filters: {
      tags?: string[];
      search?: string;
      post_type?: string;
    } = {}
  ): Promise<NewsfeedPost[]> {
    let query = supabase
      .from('newsfeed_posts')
      .select(`
        *,
        newsfeed_comments(*),
        newsfeed_post_tags(
          newsfeed_tags(*)
        )
      `)
      .eq('user_id', USER_ID)
      .eq('is_archived', false)

    // Apply search filter
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`)
    }

    // Apply post type filter
    if (filters.post_type) {
      query = query.eq('post_type', filters.post_type)
    }

    // Apply tag filter
    if (filters.tags && filters.tags.length > 0) {
      query = query.in('id', 
        supabase
          .from('newsfeed_post_tags')
          .select('post_id')
          .in('tag_id', filters.tags)
      )
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1)

    if (error) {
      console.error('Error fetching posts:', error)
      return []
    }

    return data?.map(post => ({
      ...post,
      comments: post.newsfeed_comments || [],
      tags: post.newsfeed_post_tags?.map(pt => pt.newsfeed_tags) || []
    })) || []
  }

  // Create a new post with tags
  static async createPost(
    post: Omit<NewsfeedPost, 'id' | 'created_at' | 'updated_at' | 'comments' | 'tags'>,
    tagIds: string[] = []
  ): Promise<NewsfeedPost | null> {
    const { data, error } = await supabase
      .from('newsfeed_posts')
      .insert([{
        ...post,
        user_id: USER_ID
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating post:', error)
      return null
    }

    // Add tags if provided
    if (tagIds.length > 0) {
      await this.addTagsToPost(data.id, tagIds)
    }

    return {
      ...data,
      comments: [],
      tags: []
    }
  }

  // Add a comment to a post
  static async addComment(postId: string, content: string): Promise<NewsfeedComment | null> {
    const { data, error } = await supabase
      .from('newsfeed_comments')
      .insert([{
        post_id: postId,
        user_id: USER_ID,
        content
      }])
      .select()
      .single()

    if (error) {
      console.error('Error adding comment:', error)
      return null
    }

    return data
  }

  // Get all tags
  static async getTags(): Promise<NewsfeedTag[]> {
    const { data, error } = await supabase
      .from('newsfeed_tags')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching tags:', error)
      return []
    }

    return data || []
  }

  // Create a new tag
  static async createTag(name: string, color: string): Promise<NewsfeedTag | null> {
    const { data, error } = await supabase
      .from('newsfeed_tags')
      .insert([{ name, color }])
      .select()
      .single()

    if (error) {
      console.error('Error creating tag:', error)
      return null
    }

    return data
  }

  // Update a tag
  static async updateTag(tagId: string, name: string, color: string): Promise<boolean> {
    const { error } = await supabase
      .from('newsfeed_tags')
      .update({ name, color })
      .eq('id', tagId)

    if (error) {
      console.error('Error updating tag:', error)
      return false
    }

    return true
  }

  // Delete a tag
  static async deleteTag(tagId: string): Promise<boolean> {
    const { error } = await supabase
      .from('newsfeed_tags')
      .delete()
      .eq('id', tagId)

    if (error) {
      console.error('Error deleting tag:', error)
      return false
    }

    return true
  }

  // Add tags to a post
  static async addTagsToPost(postId: string, tagIds: string[]): Promise<boolean> {
    const { error } = await supabase
      .from('newsfeed_post_tags')
      .insert(tagIds.map(tagId => ({ post_id: postId, tag_id: tagId })))

    if (error) {
      console.error('Error adding tags to post:', error)
      return false
    }

    return true
  }

  // Archive a post
  static async archivePost(postId: string): Promise<boolean> {
    const { error } = await supabase
      .from('newsfeed_posts')
      .update({ is_archived: true })
      .eq('id', postId)
      .eq('user_id', USER_ID)

    if (error) {
      console.error('Error archiving post:', error)
      return false
    }

    return true
  }

  // Extract metadata from URL
  static async extractUrlMetadata(url: string): Promise<{
    title?: string;
    description?: string;
    image?: string;
    site_name?: string;
  }> {
    try {
      // This is a simplified version - in production, you'd want to use a proper metadata extraction service
      // For now, we'll return basic info
      const urlObj = new URL(url)
      return {
        site_name: urlObj.hostname,
        title: urlObj.hostname,
        description: `Link to ${urlObj.hostname}`
      }
    } catch (error) {
      console.error('Error extracting URL metadata:', error)
      return {}
    }
  }
}
