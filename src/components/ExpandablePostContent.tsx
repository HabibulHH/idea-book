import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { PostContent } from './PostContent'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface ExpandablePostContentProps {
  content: string
  maxLength?: number
  className?: string
}

export function ExpandablePostContent({ 
  content, 
  maxLength = 200, 
  className = '' 
}: ExpandablePostContentProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!content) return null

  // Check if content is longer than maxLength
  const shouldTruncate = content.length > maxLength
  const displayContent = isExpanded || !shouldTruncate 
    ? content 
    : content.substring(0, maxLength) + '...'

  return (
    <div className={`space-y-2 ${className}`}>
      <PostContent content={displayContent} />
      
      {shouldTruncate && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-600 hover:text-blue-800 p-0 h-auto font-normal"
        >
          {isExpanded ? (
            <>
              Show less
              <ChevronUp className="h-3 w-3 ml-1" />
            </>
          ) : (
            <>
              Show more
              <ChevronDown className="h-3 w-3 ml-1" />
            </>
          )}
        </Button>
      )}
    </div>
  )
}
