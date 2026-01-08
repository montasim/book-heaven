'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MDXViewer } from '@/components/ui/mdx-viewer'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, Send, Bot, Sparkles, AlertCircle } from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { Book } from '@/hooks/use-book'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

type ExtractionStatus = 'checking' | 'ready' | 'processing' | 'failed'

interface BookChatModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  book: Book
}

/**
 * Chat modal for asking AI questions about a book
 * Displays conversation history and allows follow-up questions
 * Shows user guide when no messages are present
 */
export function BookChatModal({ open, onOpenChange, book }: BookChatModalProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationHistory, setConversationHistory] = useState<any[]>([])
  const [extractionStatus, setExtractionStatus] = useState<ExtractionStatus>('checking')
  const [extractionProgress, setExtractionProgress] = useState<string>('')
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Helper functions defined first to avoid "before initialization" errors
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }, [])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Check extraction status when modal opens
  useEffect(() => {
    if (!open) {
      // Reset state when closing
      setExtractionStatus('checking')
      setExtractionProgress('')
      setMessages([])
      setConversationHistory([])
      return
    }

    // Only proceed for EBOOK and AUDIO types
    if (book.type !== 'EBOOK' && book.type !== 'AUDIO') {
      setExtractionStatus('failed')
      setExtractionProgress('Chat is only available for ebooks and audiobooks.')
      return
    }

    // Check extraction status and fetch reference content
    const checkExtractionStatus = async () => {
      try {
        const response = await fetch(`/api/books/${book.id}/extract-content`)
        const data = await response.json()

        if (data.hasContent) {
          setExtractionStatus('ready')
          setExtractionProgress(`Book content ready (${data.wordCount?.toLocaleString()} words, ${data.pageCount} pages)`)
        } else {
          setExtractionStatus('processing')
          setExtractionProgress('Preparing book content for AI chat...')

          // Poll every 2 seconds until ready
          const pollInterval = setInterval(async () => {
            try {
              const pollResponse = await fetch(`/api/books/${book.id}/extract-content`)
              const pollData = await pollResponse.json()

              if (pollData.hasContent) {
                setExtractionStatus('ready')
                setExtractionProgress(`Book content ready! (${pollData.wordCount?.toLocaleString()} words, ${pollData.pageCount} pages)`)
                clearInterval(pollInterval)
              }
            } catch (error) {
              console.error('Error polling extraction status:', error)
              clearInterval(pollInterval)
              setExtractionStatus('failed')
              setExtractionProgress('Failed to check content status.')
            }
          }, 2000)

          // Cleanup interval on unmount
          return () => clearInterval(pollInterval)
        }
      } catch (error) {
        console.error('Error checking extraction status:', error)
        setExtractionStatus('failed')
        setExtractionProgress('Unable to check book content status.')
      }
    }

    checkExtractionStatus()
  }, [open, book.id, book.type])

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
        <SheetHeader className="px-6 py-4 border-b text-left">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Chat about &quot;{book.name}&quot;
          </SheetTitle>
          <SheetDescription>
            Ask questions about this book. AI answers based on the book&apos;s content.
          </SheetDescription>
        </SheetHeader>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
          <div className="space-y-6">
            {/* Extraction Status Indicator */}
            {extractionStatus !== 'ready' && (
              <div className={cn(
                "flex items-start gap-3 p-4 rounded-lg border",
                extractionStatus === 'processing' && "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800",
                extractionStatus === 'failed' && "bg-destructive/10 border-destructive/20",
                extractionStatus === 'checking' && "bg-muted/50"
              )}>
                {extractionStatus === 'processing' && (
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                )}
                {extractionStatus === 'failed' && (
                  <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                )}
                {extractionStatus === 'checking' && (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1 space-y-1">
                  <p className={cn(
                    "text-sm font-medium",
                    extractionStatus === 'processing' && "text-blue-900 dark:text-blue-100",
                    extractionStatus === 'failed' && "text-destructive"
                  )}>
                    {extractionStatus === 'processing' && "Preparing Book Content"}
                    {extractionStatus === 'failed' && "Content Preparation Failed"}
                    {extractionStatus === 'checking' && "Checking..."}
                  </p>
                  {extractionProgress && (
                    <p className={cn(
                      "text-xs",
                      extractionStatus === 'processing' && "text-blue-700 dark:text-blue-300",
                      extractionStatus === 'failed' && "text-destructive/80"
                    )}>
                      {extractionProgress}
                    </p>
                  )}
                  {extractionStatus === 'processing' && (
                    <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-2">
                      This one-time process may take 30-60 seconds. The book content will be cached for all users.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* User Guide */}
            {messages.length === 0 && extractionStatus === 'ready' && (
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">How to use AI Chat</span>
                </div>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>Ask me anything about this book! Here are some examples:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>What are the main themes of this book?</li>
                    <li>Explain the key concepts from chapter 3</li>
                    <li>Who are the main characters and their relationships?</li>
                    <li>What did the author say about [topic]?</li>
                    <li>Summarize the book's conclusion</li>
                  </ul>
                  <p className="text-xs mt-3">AI answers based on this book&apos;s content only. Responses may not be 100% accurate.</p>
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((message, index) => (
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
                  {message.role === 'assistant' ? (
                    <MDXViewer
                      content={message.content}
                      className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none
                        prose-headings:font-bold prose-headings:mb-2 prose-headings:mt-4
                        prose-h1:text-lg prose-h2:text-base prose-h3:text-sm
                        prose-p:mb-2 prose-p:last:mb-0
                        prose-ul:mb-3 prose-ml-6 prose-list-disc prose-ul:list-outside
                        prose-ol:mb-3 prose-ml-6 prose-list-decimal prose-ol:list-outside
                        prose-li:my-1 prose-li:marker:text-muted-foreground
                        prose-strong:font-semibold
                        prose-em:italic
                        prose-code:bg-muted-foreground/20 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                        prose-pre:bg-muted-foreground/10 prose-pre:p-2 prose-pre:rounded prose-pre:text-sm prose-pre:overflow-x-auto
                        prose-blockquote:border-l-4 prose-blockquote:border-muted-foreground/30 prose-blockquote:pl-3 prose-blockquote:italic
                        prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                      "
                    />
                  ) : (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                  )}
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
                      {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </span>
                  </div>
                )}
              </div>
            ))}

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
              placeholder={
                extractionStatus === 'processing'
                  ? "Please wait while book content is being prepared..."
                  : extractionStatus === 'failed'
                  ? "Content preparation failed. Please try again later."
                  : extractionStatus === 'checking'
                  ? "Checking book content..."
                  : "Ask a question about this book..."
              }
              disabled={isLoading || extractionStatus !== 'ready'}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim() || extractionStatus !== 'ready'}
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
            AI only answers from this book&apos;s content. Responses may not be 100% accurate.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  )
}
