import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import type { NewsfeedTag } from '@/types'
import { NewsfeedService } from '@/lib/newsfeedService'
import { 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Tag, 
  Save,
  X,
  Palette
} from 'lucide-react'
import { useLoading } from '@/hooks/useLoading'

interface ConfigModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ConfigModal({ isOpen, onClose }: ConfigModalProps) {
  const [tags, setTags] = useState<NewsfeedTag[]>([])
  const [editingTag, setEditingTag] = useState<NewsfeedTag | null>(null)
  const [newTag, setNewTag] = useState({ name: '', color: '#3B82F6' })
  const { isLoadingKey, withLoading } = useLoading()

  // Predefined colors for easy selection
  const colorOptions = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Orange
    '#8B5CF6', // Purple
    '#EF4444', // Red
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#F97316', // Orange
    '#EC4899', // Pink
    '#6366F1', // Indigo
    '#14B8A6', // Teal
    '#F59E0B', // Amber
  ]

  useEffect(() => {
    if (isOpen) {
      loadTags()
    }
  }, [isOpen])

  const loadTags = async () => {
    const fetchedTags = await NewsfeedService.getTags()
    setTags(fetchedTags)
  }

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newTag.name.trim()) return

    await withLoading(async () => {
      const createdTag = await NewsfeedService.createTag(newTag.name, newTag.color)
      if (createdTag) {
        setTags(prev => [...prev, createdTag])
        setNewTag({ name: '', color: '#3B82F6' })
      }
    }, 'create-tag')
  }

  const handleUpdateTag = async (tag: NewsfeedTag) => {
    await withLoading(async () => {
      const success = await NewsfeedService.updateTag(tag.id, tag.name, tag.color)
      if (success) {
        setTags(prev => prev.map(t => t.id === tag.id ? tag : t))
        setEditingTag(null)
      }
    }, `update-tag-${tag.id}`)
  }

  const handleDeleteTag = async (tagId: string) => {
    if (!confirm('Are you sure you want to delete this tag? This will remove it from all posts.')) {
      return
    }

    await withLoading(async () => {
      const success = await NewsfeedService.deleteTag(tagId)
      if (success) {
        setTags(prev => prev.filter(t => t.id !== tagId))
      }
    }, `delete-tag-${tagId}`)
  }

  const startEditing = (tag: NewsfeedTag) => {
    setEditingTag(tag)
  }

  const cancelEditing = () => {
    setEditingTag(null)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            <CardTitle className="text-lg">Configuration</CardTitle>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Create New Tag */}
          <div>
            <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
              Create New Tag
            </h3>
            <form onSubmit={handleCreateTag} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tag-name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tag Name
                  </Label>
                  <Input
                    id="tag-name"
                    placeholder="e.g., Programming"
                    value={newTag.name}
                    onChange={(e) => setNewTag(prev => ({ ...prev, name: e.target.value }))}
                    className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    required
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Color
                  </Label>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                      style={{ backgroundColor: newTag.color }}
                      onClick={() => {
                        const color = prompt('Enter hex color (e.g., #3B82F6):', newTag.color)
                        if (color) setNewTag(prev => ({ ...prev, color }))
                      }}
                    />
                    <Input
                      value={newTag.color}
                      onChange={(e) => setNewTag(prev => ({ ...prev, color: e.target.value }))}
                      className="flex-1 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      placeholder="#3B82F6"
                    />
                  </div>
                </div>
              </div>

              {/* Color Palette */}
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Quick Color Selection
                </Label>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded border-2 ${
                        newTag.color === color ? 'border-gray-900 dark:border-white' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewTag(prev => ({ ...prev, color }))}
                    />
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                loading={isLoadingKey('create-tag')}
                disabled={!newTag.name.trim()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Tag
              </Button>
            </form>
          </div>

          {/* Existing Tags */}
          <div>
            <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
              Manage Tags ({tags.length})
            </h3>
            <div className="space-y-3">
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700"
                >
                  {editingTag?.id === tag.id ? (
                    <div className="flex items-center gap-3 flex-1">
                      <Input
                        value={editingTag.name}
                        onChange={(e) => setEditingTag(prev => prev ? { ...prev, name: e.target.value } : null)}
                        className="flex-1 dark:bg-gray-600 dark:text-white dark:border-gray-500"
                      />
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded border border-gray-300 dark:border-gray-500 cursor-pointer"
                          style={{ backgroundColor: editingTag.color }}
                          onClick={() => {
                            const color = prompt('Enter hex color:', editingTag.color)
                            if (color) setEditingTag(prev => prev ? { ...prev, color } : null)
                          }}
                        />
                        <Button
                          size="sm"
                          onClick={() => handleUpdateTag(editingTag)}
                          loading={isLoadingKey(`update-tag-${tag.id}`)}
                        >
                          <Save className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={cancelEditing}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-6 h-6 rounded"
                          style={{ backgroundColor: tag.color }}
                        />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{tag.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Created {new Date(tag.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEditing(tag)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteTag(tag.id)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          loading={isLoadingKey(`delete-tag-${tag.id}`)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}

              {tags.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No tags created yet</p>
                  <p className="text-sm">Create your first tag above</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
