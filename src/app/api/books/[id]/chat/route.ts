import { NextRequest, NextResponse } from 'next/server';
import { chatWithUnifiedProvider } from '@/lib/ai/unified-chat';
import { generatePreFilledQuery } from '@/lib/ai/query-generator';
import { saveChatMessage, getNextMessageIndex } from '@/lib/lms/repositories/book-chat.repository';
import { getSession } from '@/lib/auth/session';
import { findUserById } from '@/lib/user/repositories/user.repository';
import { randomBytes } from 'node:crypto';
import { chatMessageSchema, validateRequest } from '@/lib/validation';
import { prisma } from '@/lib/prisma';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

interface BookWithDetails {
  id: string;
  name: string;
  type: string;
  fileUrl: string | null;
  directFileUrl: string | null;
  isPublic: boolean;
  requiresPremium: boolean;
  authors: Array<{ author: { name: string } }>;
  categories: Array<{ category: { name: string } }>;
}

interface UserAccess {
  canAccess: boolean;
  reason?: string;
}

/**
 * Helper function to fetch book and check user access
 */
async function fetchBookWithAccess(bookId: string, userId: string): Promise<{
  book: BookWithDetails | null;
  userAccess: UserAccess;
}> {
  // Fetch book with relations
  const book = await prisma.book.findUnique({
    where: { id: bookId },
    select: {
      id: true,
      name: true,
      type: true,
      fileUrl: true,
      directFileUrl: true,
      isPublic: true,
      requiresPremium: true,
      authors: {
        select: {
          author: {
            select: { name: true }
          }
        }
      },
      categories: {
        select: {
          category: {
            select: { name: true }
          }
        }
      }
    }
  });

  if (!book) {
    return { book: null, userAccess: { canAccess: false, reason: 'Book not found' } };
  }

  // Check user access
  let canAccess = false;
  let reason = '';

  // Check if user is admin
  const user = await findUserById(userId);
  const isPremium = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  if (book.isPublic) {
    canAccess = true;
  } else if (book.requiresPremium && isPremium) {
    canAccess = true;
  } else if (book.requiresPremium && !isPremium) {
    canAccess = false;
    reason = 'This book requires premium access';
  } else if (!book.isPublic) {
    canAccess = isPremium;
    reason = isPremium ? '' : 'This book requires premium access';
  } else {
    canAccess = true;
  }

  return { book, userAccess: { canAccess, reason } };
}

/**
 * POST /api/books/[id]/chat
 * Chat with AI about a specific book
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { id: bookId } = await params;
    console.log('[Chat API] Received request for book:', bookId);

    const body = await request.json();

    // Validate and sanitize input
    const validationResult = await validateRequest(chatMessageSchema, body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error },
        { status: 400 }
      );
    }

    const {
      message,
      conversationHistory = [],
      sessionId
    } = validationResult.data;

    const generatePrefilled = body.generatePrefilled === true;

    console.log('[Chat API] Request body:', { message, generatePrefilled, historyLength: (conversationHistory as any[]).length });

    // Get user from session (required for chat)
    const session = await getSession();
    const user = session ? await findUserById(session.userId) : null;
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required for chat' },
        { status: 401 }
      );
    }

    // Generate or retrieve session ID for grouping messages
    let finalSessionId = sessionId;
    if (!finalSessionId) {
      // Check if there's a recent session (within 30 minutes or today)
      const history = conversationHistory as any[];
      const lastChat = history.length > 0 ? history[0] : null;
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // If no recent session, create new one
      finalSessionId = randomBytes(16).toString('hex');
    }

    // Fetch book details and check access directly from database
    console.log('[Chat API] Fetching book from database:', bookId);
    const { book, userAccess } = await fetchBookWithAccess(bookId, user.id);

    if (!book) {
      console.error('[Chat API] Book not found');
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    console.log('[Chat API] Book found:', book.name, 'Type:', book.type);

    // Verify it's an ebook or audiobook
    if (book.type !== 'EBOOK' && book.type !== 'AUDIO') {
      return NextResponse.json(
        { error: 'Chat is only available for ebooks and audiobooks' },
        { status: 400 }
      );
    }

    // Check if user has access
    if (!userAccess.canAccess) {
      return NextResponse.json(
        { error: userAccess.reason || 'You do not have access to this book. Premium access may be required.' },
        { status: 403 }
      );
    }

    // Check if file URL exists
    if (!book.fileUrl && !book.directFileUrl) {
      return NextResponse.json(
        { error: 'Book file is not available for chat' },
        { status: 400 }
      );
    }

    // Prepare messages
    const history = conversationHistory as any[];
    let messages = history.map((m: any) => ({
      role: m.role,
      content: m.content
    }));

    let userMessage = '';

    // Always use the user's actual message (no more pre-filled overview question)
    if (message) {
      userMessage = message;
      messages.push({ role: 'user', content: userMessage });
    }

    // Save user message to database
    try {
      const messageIndex = await getNextMessageIndex(bookId, finalSessionId);
      await saveChatMessage({
        bookId,
        userId: user.id,
        sessionId: finalSessionId,
        role: 'user',
        content: userMessage,
        messageIndex,
      });
    } catch (error) {
      console.error('[Chat API] Failed to save user message:', error);
      // Continue anyway - don't block chat for logging errors
    }

    // Call unified chat with automatic provider fallback
    console.log('[Chat API] Calling unified chat service (z.ai primary, Gemini fallback)...');

    // Safely extract authors and categories
    const authorNames = book.authors && Array.isArray(book.authors)
      ? book.authors.map((a) => a.author.name)
      : [];

    const categoryNames = book.categories && Array.isArray(book.categories)
      ? book.categories.map((c) => c.category.name)
      : [];

    const result = await chatWithUnifiedProvider({
      bookId: book.id,
      bookName: book.name,
      bookType: book.type,
      pdfUrl: book.fileUrl || book.directFileUrl || '',
      pdfDirectUrl: book.directFileUrl || book.fileUrl || '',
      authors: authorNames,
      categories: categoryNames,
      messages
    });

    console.log('[Chat API] Chat response received, provider:', result.provider, 'model:', result.model, 'method:', result.method);

    // Add assistant response to history
    messages.push({ role: 'assistant', content: result.response });

    // Save assistant response to database
    try {
      const messageIndex = await getNextMessageIndex(bookId, finalSessionId);
      await saveChatMessage({
        bookId,
        userId: user.id,
        sessionId: finalSessionId,
        role: 'assistant',
        content: result.response,
        messageIndex,
      });
    } catch (error) {
      console.error('[Chat API] Failed to save assistant message:', error);
      // Continue anyway - don't block chat for logging errors
    }

    return NextResponse.json({
      response: result.response,
      conversationHistory: messages,
      sessionId: finalSessionId,
      usage: result.usage,
      provider: result.provider,
      model: result.model,
      method: result.method
    });

  } catch (error: any) {
    console.error('[Chat API] Error:', error);
    console.error('[Chat API] Error stack:', error.stack);
    return NextResponse.json(
      {
        error: error.message || 'Failed to process chat request',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/books/[id]/chat
 * Returns chat availability info
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { id: bookId } = await params;

    // Get user session
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { available: false, reason: 'Authentication required' },
        { status: 401 }
      );
    }

    // Fetch book details from database
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      select: {
        id: true,
        name: true,
        type: true,
        fileUrl: true,
        directFileUrl: true,
        isPublic: true,
        requiresPremium: true,
      }
    });

    if (!book) {
      return NextResponse.json(
        { available: false, reason: 'Book not found' }
      );
    }

    // Check user access
    const user = await findUserById(session.userId);
    const isPremium = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
    const hasAccess = book.isPublic || (book.requiresPremium && isPremium);

    // Check availability
    const isEbookOrAudio = book.type === 'EBOOK' || book.type === 'AUDIO';
    const hasFile = !!(book.fileUrl || book.directFileUrl);

    return NextResponse.json({
      available: isEbookOrAudio && hasFile && hasAccess,
      bookType: book.type,
      hasFile,
      hasAccess,
      reason: !isEbookOrAudio ? 'Chat is only available for ebooks and audiobooks' :
              !hasFile ? 'Book file is not available' :
              !hasAccess ? 'You do not have access to this book' :
              null
    });

  } catch (error: any) {
    console.error('Chat availability check error:', error);
    return NextResponse.json(
      { available: false, reason: 'Failed to check availability' },
      { status: 500 }
    );
  }
}
