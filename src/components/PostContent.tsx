import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff } from 'lucide-react'

interface PostContentProps {
  content: string
  className?: string
}

export function PostContent({ content, className = '' }: PostContentProps) {
  const [showRaw, setShowRaw] = useState(false)

  if (!content) return null

  // Check if content contains HTML tags
  const isHtml = /<[^>]*>/g.test(content)

  if (!isHtml) {
    // Plain text content
    return (
      <div className={`text-gray-600 whitespace-pre-wrap ${className}`}>
        {content}
      </div>
    )
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Toggle between HTML and raw view */}
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowRaw(!showRaw)}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          {showRaw ? (
            <>
              <Eye className="h-3 w-3 mr-1" />
              Show Formatted
            </>
          ) : (
            <>
              <EyeOff className="h-3 w-3 mr-1" />
              Show Raw
            </>
          )}
        </Button>
      </div>

      {/* Content Display */}
      <div className="prose prose-sm max-w-none">
        {showRaw ? (
          <pre className="text-xs text-gray-500 bg-gray-50 p-2 rounded overflow-x-auto">
            {content}
          </pre>
        ) : (
          <div 
            className="text-gray-600"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        )}
      </div>
    </div>
  )
}
