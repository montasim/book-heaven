'use client'

import { useState, useEffect, useRef } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, Send, MessageSquare, Bot, Sparkles } from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { Book } from '@/hooks/use-book'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface BookChatModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  book: Book
}

/**
 * Chat modal for asking AI questions about a book
 * Displays conversation history and allows follow-up questions
 */
export function BookChatModal({ open, onOpenChange, book }: BookChatModalProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationHistory, setConversationHistory] = useState<any[]>([])
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!open) {
      // Reset when closing (optional - remove if you want to persist)
      // setMessages([])
      // setInputValue('')
      // setConversationHistory([])
    }
  }, [open])

  // Generate pre-filled query on first open
  useEffect(() => {
    if (open && messages.length === 0 && user) {
      handleInitialChat()
    }
  }, [open])

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const handleInitialChat = async () => {
    if (!user) return

    setIsLoading(true)

    try {
      const response = await fetch(`/api/books/${book.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generatePrefilled: true
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to start chat')
      }

      const data = await response.json()

      // Get the actual user query that was generated
      const userQuery = data.conversationHistory[0]?.content || 'Tell me about this book...'

      setMessages([
        {
          role: 'user',
          content: userQuery,
          timestamp: new Date()
        },
        {
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        }
      ])

      setConversationHistory(data.conversationHistory)
      scrollToBottom()
    } catch (error: any) {
      console.error('Error starting chat:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to start chat. Please try again.',
        variant: 'destructive'
      })
      setMessages([
        {
          role: 'assistant',
          content: 'Sorry, I couldn\'t start the chat. Please make sure you have access to this book and try again.',
          timestamp: new Date()
        }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    const previousMessages = [...messages, userMessage]
    setInputValue('')
    setIsLoading(true)

    try {
      const response = await fetch(`/api/books/${book.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send message')
      }

      const data = await response.json()

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      }])

      setConversationHistory(data.conversationHistory)
      scrollToBottom()
    } catch (error: any) {
      console.error('Error sending message:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to send message. Please try again.',
        variant: 'destructive'
      })
      // Restore previous messages on error
      setMessages(previousMessages)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!user) {
    return null
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full sm:max-w-2xl flex-col p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Chat about "{book.name}"
          </SheetTitle>
          <SheetDescription>
            Ask questions about this book. AI answers based on the book's content.
          </SheetDescription>
        </SheetHeader>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
          <div className="space-y-6">
            {messages.length === 0 && isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-4">
                  <div className="relative">
                    <Bot className="h-12 w-12 text-muted-foreground mx-auto" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles className="h-6 w-6 text-primary animate-pulse" />
                    </div>
                  </div>
                  <p className="text-muted-foreground">AI is analyzing the book...</p>
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex gap-3",
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.role === 'assistant' && (
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "rounded-lg px-4 py-3 max-w-[80%]",
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                    <p className={cn(
                      "text-xs mt-1 opacity-70",
                      message.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    )}>
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  {message.role === 'user' && (
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-primary-foreground">
                        {user.firstName?.charAt(0) || user.email?.charAt(0) || 'U'}
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
            {isLoading && messages.length > 0 && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about this book..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim()}
              size="icon"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            AI only answers from this book's content. Responses may not be 100% accurate.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  )
}
