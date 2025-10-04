import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { NewsfeedPost, NewsfeedTag } from '@/types'
import { NewsfeedService } from '@/lib/newsfeedService'
import { 
  Link, 
  MessageCircle, 
  Plus, 
  ExternalLink, 
  Tag, 
  Archive,
  Send,
  Calendar,
  User,
  Globe,
  Search,
  Filter,
  X
} from 'lucide-react'
import { useLoading } from '@/hooks/useLoading'

interface NewsFeedProps {
  data: { newsfeedPosts: NewsfeedPost[] }
  setData: (data: any) => void
  user: any
}

export function NewsFeed({ user }: NewsFeedProps) {
  const [posts, setPosts] = useState<NewsfeedPost[]>([])
  const [tags, setTags] = useState<NewsfeedTag[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedPostType, setSelectedPostType] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)
  const { isLoadingKey, withLoading } = useLoading()
  const observerRef = useRef<HTMLDivElement>(null)

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    url: '',
    post_type: 'link' as 'link' | 'note' | 'post',
    selectedTags: [] as string[]
  })

  // Load initial posts and tags
  useEffect(() => {
    if (user?.id) {
      loadPosts()
      loadTags()
    }
  }, [user?.id])

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMorePosts()
        }
      },
      { threshold: 0.1 }
    )

    if (observerRef.current) {
      observer.observe(observerRef.current)
    }

    return () => observer.disconnect()
  }, [hasMore, loading])

  const loadPosts = async (reset = true) => {
    // Prevent multiple simultaneous calls
    if (loading) return
    
    setLoading(true)
    
    try {
      const filters = {
        search: searchQuery,
        tags: selectedTags,
        post_type: selectedPostType || undefined
      }
      
      const fetchedPosts = await NewsfeedService.getPosts(user?.id, reset ? 0 : page, 10, filters)
    
    if (reset) {
      // Ensure unique posts even on reset
      const uniquePosts = fetchedPosts.filter((post, index, self) => 
        index === self.findIndex(p => p.id === post.id)
      )
      setPosts(uniquePosts)
      setPage(0)
    } else {
      setPosts(prev => {
        // Create a map to track existing post IDs
        const existingIds = new Set(prev.map(post => post.id))
        // Only add posts that don't already exist
        const newPosts = fetchedPosts.filter(post => !existingIds.has(post.id))
        return [...prev, ...newPosts]
      })
      setPage(prev => prev + 1)
    }
    setHasMore(fetchedPosts.length === 10)
    } catch (error) {
      console.error('Error loading posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMorePosts = async () => {
    if (loading) return
    await loadPosts(false)
  }

  const loadTags = async () => {
    const fetchedTags = await NewsfeedService.getTags()
    setTags(fetchedTags)
  }

  // Filter change handlers
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    // Debounce search
    setTimeout(() => {
      loadPosts(true)
    }, 500)
  }

  const handleTagToggle = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    )
  }

  const handlePostTypeChange = (postType: string) => {
    setSelectedPostType(postType === 'all' ? '' : postType)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedTags([])
    setSelectedPostType('')
    setShowFilters(false)
  }

  // Reload posts when filters change
  useEffect(() => {
    loadPosts(true)
  }, [selectedTags, selectedPostType])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user?.id) return
    
    await withLoading(async () => {
      let urlMetadata = {}
      if (formData.url && formData.post_type === 'link') {
        urlMetadata = await NewsfeedService.extractUrlMetadata(formData.url)
      }

      const newPost = await NewsfeedService.createPost(user?.id, {
        title: formData.title,
        content: formData.content,
        url: formData.url || undefined,
        url_metadata: Object.keys(urlMetadata).length > 0 ? urlMetadata : undefined,
        post_type: formData.post_type,
        user_id: user?.id,
        is_archived: false
      }, formData.selectedTags)

      if (newPost) {
        setPosts(prev => [newPost, ...prev])
        setFormData({ title: '', content: '', url: '', post_type: 'link', selectedTags: [] })
        setShowAddForm(false)
      }
    }, 'create-post')
  }

  const handleAddComment = async (postId: string) => {
    if (!newComment.trim() || !user?.id) return

    await withLoading(async () => {
      const comment = await NewsfeedService.addComment(user?.id, postId, newComment)
      if (comment) {
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, comments: [...(post.comments || []), comment] }
            : post
        ))
        setNewComment('')
      }
    }, `comment-${postId}`)
  }

  const handleArchivePost = async (postId: string) => {
    if (!user?.id) return
    
    await withLoading(async () => {
      const success = await NewsfeedService.archivePost(user?.id, postId)
      if (success) {
        setPosts(prev => prev.filter(post => post.id !== postId))
      }
    }, `archive-${postId}`)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="flex flex-col h-full max-h-full">
      {/* Sticky Header */}
      <div className="flex-shrink-0 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Newsfeed</h2>
            <p className="text-gray-600">Your personal knowledge feed</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
            </Button>
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Post
            </Button>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto scrollbar-hide min-h-0">
          {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 bg-white text-gray-900 border-gray-300"
          />
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <Card className="bg-white border-gray-200">
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900">Filters</h3>
                <div className="flex gap-2">
                  <Button
                    onClick={clearFilters}
                    variant="outline"
                    size="sm"
                    className="text-gray-600"
                  >
                    Clear All
                  </Button>
                  <Button
                    onClick={() => setShowFilters(false)}
                    variant="ghost"
                    size="sm"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {/* Post Type Filter */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Post Type
                  </label>
                  <Select value={selectedPostType || 'all'} onValueChange={handlePostTypeChange}>
                    <SelectTrigger className="w-full bg-white border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="link">Links</SelectItem>
                      <SelectItem value="note">Notes</SelectItem>
                      <SelectItem value="post">Posts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Tags Filter */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Button
                        key={tag.id}
                        variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleTagToggle(tag.id)}
                        className="flex items-center gap-1"
                        style={{
                          backgroundColor: selectedTags.includes(tag.id) ? tag.color : undefined,
                          borderColor: tag.color
                        }}
                      >
                        <Tag className="h-3 w-3" />
                        {tag.name}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Post Form */}
      {showAddForm && (
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg">Add New Post</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-2">
                <Select
                  value={formData.post_type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, post_type: value as any }))}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="link">Link</SelectItem>
                    <SelectItem value="note">Note</SelectItem>
                    <SelectItem value="post">Post</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Input
                placeholder="Title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="bg-white text-gray-900 border-gray-300"
                required
              />

              {formData.post_type === 'link' && (
                <Input
                  placeholder="URL"
                  value={formData.url}
                  onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                  className="bg-white text-gray-900 border-gray-300"
                  type="url"
                />
              )}

              <Textarea
                placeholder="Your notes or description"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                rows={3}
                className="bg-white text-gray-900 border-gray-300"
              />

              {/* Tag Selection */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Button
                      key={tag.id}
                      type="button"
                      variant={formData.selectedTags.includes(tag.id) ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          selectedTags: prev.selectedTags.includes(tag.id)
                            ? prev.selectedTags.filter(id => id !== tag.id)
                            : [...prev.selectedTags, tag.id]
                        }))
                      }}
                      className="flex items-center gap-1"
                      style={{
                        backgroundColor: formData.selectedTags.includes(tag.id) ? tag.color : undefined,
                        borderColor: tag.color
                      }}
                    >
                      <Tag className="h-3 w-3" />
                      {tag.name}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={isLoadingKey('create-post')}
                  disabled={!formData.title.trim()}
                >
                  Add Post
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Posts Feed */}
      <div className="space-y-4">
        {posts.map((post) => (
          <Card key={post.id} className="bg-white border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {post.title}
                    </h3>
                    {post.post_type === 'link' && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Link className="h-3 w-3" />
                        Link
                      </Badge>
                    )}
                  </div>
                  
                  {post.content && (
                    <p className="text-gray-600 mb-3">
                      {post.content}
                    </p>
                  )}

                  {post.url && (
                    <div className="flex items-center gap-2 mb-3">
                      <Globe className="h-4 w-4 text-gray-400" />
                      <a
                        href={post.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        {post.url_metadata?.site_name || post.url}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}

                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {post.tags.map((tag) => (
                        <Badge
                          key={tag.id}
                          variant="outline"
                          className="flex items-center gap-1"
                          style={{ borderColor: tag.color, color: tag.color }}
                        >
                          <Tag className="h-3 w-3" />
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(post.created_at)}
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {post.user_id}
                    </div>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleArchivePost(post.id)}
                  className="text-gray-400 hover:text-gray-600"
                  loading={isLoadingKey(`archive-${post.id}`)}
                >
                  <Archive className="h-4 w-4" />
                </Button>
              </div>

              {/* Comments Section */}
              <div className="border-t border-gray-200 pt-4">
                <div className="space-y-3">
                  {post.comments?.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-sm text-gray-800">
                            {comment.content}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(comment.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}

                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="flex-1 flex gap-2">
                      <Input
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="flex-1 bg-white text-gray-900 border-gray-300"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleAddComment(post.id)
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={() => handleAddComment(post.id)}
                        disabled={!newComment.trim()}
                        loading={isLoadingKey(`comment-${post.id}`)}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
          </div>
        )}

        {/* Infinite scroll trigger */}
        <div ref={observerRef} className="h-4" />

        {!hasMore && posts.length > 0 && (
          <div className="text-center py-4 text-gray-500">
            No more posts to load
          </div>
        )}

        {posts.length === 0 && !loading && (
          <Card className="bg-white border-gray-200">
            <CardContent className="p-8 text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500 mb-2">No posts yet</p>
              <p className="text-sm text-gray-400">Add your first post to get started!</p>
            </CardContent>
          </Card>
        )}
          </div>
        </div>
      </div>
    </div>
  )
}
