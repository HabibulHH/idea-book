import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Send, Bot, User, Sparkles } from 'lucide-react'
import type { AppData } from '@/types'
import { callClaudeAPI } from '@/lib/claudeService'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
}

interface ChatInterfaceProps {
  data: AppData
}

export function ChatInterface({ data }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      content: inputValue.trim(),
      role: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      // Call Claude service
      const claudeResponse = await callClaudeAPI({
        message: userMessage.content,
        context: {
          tasks: data,
          currentDate: new Date().toISOString().split('T')[0]
        }
      })

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        content: claudeResponse,
        role: 'assistant',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error calling Claude service:', error)
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        content: 'Sorry, I encountered an error. Please try again.',
        role: 'assistant',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full fade-in">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {messages.length === 0 && (
          <div className="text-center py-8 fade-in">
            <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4 transition-transform duration-200 hover:scale-110" />
            <p className="text-gray-500 text-sm">Start a conversation about your tasks and productivity</p>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={message.id}
            className={`flex gap-3 fade-in ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {message.role === 'assistant' && (
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-200 hover:scale-110">
                <Bot className="h-4 w-4 text-blue-600" />
              </div>
            )}
            
            <Card className={`max-w-[80%] p-3 hover-lift transition-all duration-200 ${
              message.role === 'user' 
                ? 'bg-green-50 border-green-200' 
                : 'bg-gray-50 border-gray-200'
            }`}>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">
                {message.content}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </Card>

            {message.role === 'user' && (
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-200 hover:scale-110">
                <User className="h-4 w-4 text-green-600" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 justify-start fade-in">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-200 hover:scale-110">
              <Bot className="h-4 w-4 text-blue-600" />
            </div>
            <Card className="bg-gray-50 border-gray-200 p-3 hover-lift transition-all duration-200">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <p className="text-sm text-gray-600">Thinking...</p>
              </div>
            </Card>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 py-8 bg-white border-t border-gray-200 slide-in-up">
        <div className="flex items-center gap-2 w-full">
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your tasks, ideas, or productivity..."
            className="flex-1 min-h-[100px] max-h-24 resize-none border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm placeholder-gray-500 scrollbar-hide bg-white transition-all duration-200 hover:border-green-400"
            disabled={isLoading}
            rows={1}
          />
        </div>
        <div className="flex gap-2 mt-2">
          <Button
            onClick={() => {
              // TODO: Implement summarize functionality
              alert('Summarize feature coming soon!')
            }}
            disabled={isLoading}
            size="sm"
            className="flex-1 h-11 p-0 rounded-lg bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 hover-bounce"
          >
            <Sparkles className="h-4 w-4 text-white mr-2 transition-transform duration-200 hover:scale-110" />
            Summarize
          </Button>
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            size="sm"
            className="flex-1 h-11 p-0 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 hover-bounce"
          >
            <Send className="h-4 w-4 text-white mr-2 transition-transform duration-200 hover:scale-110" />
            Send
          </Button>
        </div>
      </div>
    </div>
  )
}
