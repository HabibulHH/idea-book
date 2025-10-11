import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AddPostModal } from '@/components/AddPostModal'
import { ExpandablePostContent } from '@/components/ExpandablePostContent'
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
  const [showAddModal, setShowAddModal] = useState(false)
  const [newComments, setNewComments] = useState<Record<string, string>>({})
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedPostType, setSelectedPostType] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)
  const { isLoadingKey, withLoading } = useLoading()
  const observerRef = useRef<HTMLDivElement>(null)


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

  const handleSubmitPost = async (postData: {
    title: string
    content: string
    url: string
    post_type: 'link' | 'note' | 'post'
    selectedTags: string[]
  }) => {
    if (!user?.id) return

    await withLoading(async () => {
      let urlMetadata = {}
      if (postData.url && postData.post_type === 'link') {
        urlMetadata = await NewsfeedService.extractUrlMetadata(postData.url)
      }

      const newPost = await NewsfeedService.createPost(user?.id, {
        title: postData.title,
        content: postData.content,
        url: postData.url || undefined,
        url_metadata: Object.keys(urlMetadata).length > 0 ? urlMetadata : undefined,
        post_type: postData.post_type,
        user_id: user?.id,
        is_archived: false
      }, postData.selectedTags)

      if (newPost) {
        setPosts(prev => [newPost, ...prev])
        setShowAddModal(false)
      }
    }, 'create-post')
  }

  const handleAddComment = async (postId: string) => {
    const commentText = newComments[postId]
    if (!commentText?.trim() || !user?.id) return

    await withLoading(async () => {
      const comment = await NewsfeedService.addComment(user?.id, postId, commentText)
      if (comment) {
        setPosts(prev => prev.map(post =>
          post.id === postId
            ? { ...post, comments: [...(post.comments || []), comment] }
            : post
        ))
        setNewComments(prev => ({ ...prev, [postId]: '' }))
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


        {/* Search Bar and Buttons in One Row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Newsfeed</h2>
              <p className="text-gray-600">Your personal knowledge feed</p>
            </div>
          </div>
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 bg-white text-gray-900 border-gray-300"
            />
          </div>

          {/* Buttons */}
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
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Post
            </Button>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      {showFilters && (
        <div className="flex-shrink-0 mb-4">
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
        </div>
      )}

      {/* Scrollable Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto scrollbar-hide min-h-0 bg-gray-50/30">


          {/* Posts Feed */}
          <div className="space-y-0">
            {posts.length > 0 && (
              <Card className="bg-white border-0 border-b border-gray-100 shadow-none rounded-none">
                <CardContent className="p-4">

                </CardContent>
              </Card>
            )}

            {posts.map((post) => (
              <Card key={post.id} className="bg-white border-0 border-b border-gray-100 hover:bg-gray-50/50 transition-colors duration-200 shadow-none rounded-none">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-base font-semibold text-gray-900 leading-tight">
                          {post.title}
                        </h3>
                        {post.post_type === 'link' && (
                          <Badge variant="outline" className="flex items-center gap-1 text-xs px-2 py-1">
                            <Link className="h-3 w-3" />
                            Link
                          </Badge>
                        )}
                      </div>

                      {post.content && (
                        <div className="mb-3">
                          <ExpandablePostContent content={post.content} />
                        </div>
                      )}

                      {post.url && (
                        <div className="flex items-center gap-2 mb-3">
                          <Globe className="h-4 w-4 text-gray-400" />
                          <a
                            href={post.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-1 text-sm"
                          >
                            {post.url_metadata?.site_name || post.url}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}

                      {/* Tags */}
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {post.tags.map((tag) => (
                            <Badge
                              key={tag.id}
                              variant="outline"
                              className="flex items-center gap-1 text-xs px-2 py-1"
                              style={{ borderColor: tag.color, color: tag.color }}
                            >
                              <Tag className="h-3 w-3" />
                              {tag.name}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(post.created_at)}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {post.user_id}
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleArchivePost(post.id)}
                      className="text-gray-400 hover:text-gray-600 p-1 h-8 w-8"
                      loading={isLoadingKey(`archive-${post.id}`)}
                    >
                      <Archive className="h-4 w-4" />
                    </Button>
                  </div>

                   {/* Comments Section - Twitter/Meta Style */}
                   <div className="border-t border-gray-100 pt-3 mt-3">
                     {/* Comments List */}
                     {post.comments && post.comments.length > 0 && (
                       <div className="space-y-3 mb-3">
                         {post.comments.map((comment) => (
                           <div key={comment.id} className="flex gap-3">
                             <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                               <User className="h-4 w-4 text-gray-600" />
                             </div>
                             <div className="flex-1 min-w-0">
                               <div className="flex items-center gap-2 mb-1">
                                 <span className="text-sm font-semibold text-gray-900">You</span>
                                 <span className="text-xs text-gray-500">•</span>
                                 <span className="text-xs text-gray-500">{formatDate(comment.created_at)}</span>
                               </div>
                               <p className="text-sm text-gray-800 leading-relaxed">
                                 {comment.content}
                               </p>
                             </div>
                           </div>
                         ))}
                       </div>
                     )}

                     {/* Comment Input - Twitter/Meta Style */}
                     <div className="flex gap-3">
                       <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                         <User className="h-4 w-4 text-gray-600" />
                       </div>
                       <div className="flex-1">
                         <div className="relative">
                           <Input
                             placeholder="Add a comment..."
                             value={newComments[post.id] || ''}
                             onChange={(e) => setNewComments(prev => ({ ...prev, [post.id]: e.target.value }))}
                             className="w-full bg-gray-50 border-gray-200 rounded-full px-4 py-2 text-sm focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                             onKeyPress={(e) => {
                               if (e.key === 'Enter') {
                                 handleAddComment(post.id)
                               }
                             }}
                           />
                           {newComments[post.id]?.trim() && (
                             <Button
                               size="sm"
                               onClick={() => handleAddComment(post.id)}
                               loading={isLoadingKey(`comment-${post.id}`)}
                               className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 px-3 text-xs bg-blue-600 hover:bg-blue-700 rounded-full"
                             >
                               Reply
                             </Button>
                           )}
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

      {/* Add Post Modal */}
      <AddPostModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleSubmitPost}
        tags={tags}
        isLoading={isLoadingKey('create-post')}
      />
    </div>
  )
}
