import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import MDEditor from '@uiw/react-md-editor'
import type { NewsfeedTag } from '@/types'
import { Tag, X, Link, FileText, MessageSquare } from 'lucide-react'

interface AddPostModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (postData: {
    title: string
    content: string
    url: string
    post_type: 'link' | 'note' | 'post'
    selectedTags: string[]
  }) => void
  tags: NewsfeedTag[]
  isLoading?: boolean
}

export function AddPostModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  tags, 
  isLoading = false 
}: AddPostModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    url: '',
    post_type: 'link' as 'link' | 'note' | 'post',
    selectedTags: [] as string[]
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) return
    
    onSubmit(formData)
    // Reset form
    setFormData({
      title: '',
      content: '',
      url: '',
      post_type: 'link',
      selectedTags: []
    })
  }

  const handleTagToggle = (tagId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tagId)
        ? prev.selectedTags.filter(id => id !== tagId)
        : [...prev.selectedTags, tagId]
    }))
  }

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case 'link': return <Link className="h-4 w-4" />
      case 'note': return <FileText className="h-4 w-4" />
      case 'post': return <MessageSquare className="h-4 w-4" />
      default: return <Link className="h-4 w-4" />
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-semibold">Create New Post</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="overflow-y-auto max-h-[calc(90vh-80px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Post Type Selection */}
            <div className="flex gap-2">
              {[
                { value: 'link', label: 'Link', icon: <Link className="h-4 w-4" /> },
                { value: 'note', label: 'Note', icon: <FileText className="h-4 w-4" /> },
                { value: 'post', label: 'Post', icon: <MessageSquare className="h-4 w-4" /> }
              ].map((type) => (
                <Button
                  key={type.value}
                  type="button"
                  variant={formData.post_type === type.value ? "default" : "outline"}
                  onClick={() => setFormData(prev => ({ ...prev, post_type: type.value as any }))}
                  className="flex items-center gap-2"
                >
                  {type.icon}
                  {type.label}
                </Button>
              ))}
            </div>

            {/* Title */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Title *
              </label>
              <Input
                placeholder="Enter post title..."
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="bg-white text-gray-900 border-gray-300"
                required
              />
            </div>

            {/* URL (for links only) */}
            {formData.post_type === 'link' && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  URL
                </label>
                <Input
                  placeholder="https://example.com"
                  value={formData.url}
                  onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                  className="bg-white text-gray-900 border-gray-300"
                  type="url"
                />
              </div>
            )}

            {/* Content with Rich Text Editor */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Content
              </label>
              <div className="border border-gray-300 rounded-md overflow-hidden">
                <MDEditor
                  value={formData.content}
                  onChange={(value) => setFormData(prev => ({ ...prev, content: value || '' }))}
                  height={300}
                  data-color-mode="light"
                />
              </div>
            </div>

            {/* Tags */}
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
                    onClick={() => handleTagToggle(tag.id)}
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

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!formData.title.trim() || isLoading}
                loading={isLoading}
              >
                {isLoading ? 'Creating...' : 'Create Post'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
