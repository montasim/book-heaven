/**
 * Support Tickets Repository
 *
 * Handles all database operations for support tickets and FAQs
 */

import { prisma } from '@/lib/prisma'
import { TicketPriority, TicketStatus, Prisma } from '@prisma/client'

// ============================================================================
// TYPES
// ============================================================================

export interface CreateTicketData {
  userId: string
  userEmail: string
  userName: string
  subject: string
  description: string
  category: string
  priority: TicketPriority
}

export interface CreateResponseData {
  ticketId: string
  senderId: string
  senderRole: string
  message: string
  isFromAdmin: boolean
  attachments?: string[]
}

export interface UpdateTicketData {
  status?: TicketStatus
  assignedToId?: string | null
  resolution?: string | null
}

export interface GetTicketsOptions {
  status?: TicketStatus
  userId?: string
  assignedToId?: string
  limit?: number
  offset?: number
}

// ============================================================================
// FAQ FUNCTIONS
// ============================================================================

/**
 * Get all active FAQs, optionally filtered by category
 */
export async function getFaqs(category?: string) {
  const where: Prisma.FAQWhereInput = {
    isActive: true,
  }

  if (category && category !== 'all') {
    where.category = category
  }

  return prisma.fAQ.findMany({
    where,
    orderBy: [
      { category: 'asc' },
      { order: 'asc' },
    ],
  })
}

/**
 * Increment FAQ view count
 */
export async function incrementFaqViews(faqId: string) {
  return prisma.fAQ.update({
    where: { id: faqId },
    data: {
      views: {
        increment: 1,
      },
    },
  })
}

/**
 * Submit FAQ feedback
 */
export async function submitFaqFeedback(faqId: string, helpful: boolean) {
  return prisma.fAQ.update({
    where: { id: faqId },
    data: helpful
      ? {
          helpfulCount: {
            increment: 1,
          },
        }
      : {
          notHelpfulCount: {
            increment: 1,
          },
        },
  })
}

// ============================================================================
// SUPPORT TICKET FUNCTIONS
// ============================================================================

/**
 * Get tickets with optional filters
 */
export async function getTickets(options: GetTicketsOptions = {}) {
  const where: Prisma.SupportTicketWhereInput = {}

  if (options.status) {
    where.status = options.status
  }

  if (options.userId) {
    where.userId = options.userId
  }

  if (options.assignedToId) {
    where.assignedToId = options.assignedToId
  }

  const [tickets, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        responses: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        _count: {
          select: {
            responses: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' },
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
      take: options.limit || 50,
      skip: options.offset || 0,
    }),
    prisma.supportTicket.count({ where }),
  ])

  return { tickets, total }
}

/**
 * Get a single ticket by ID
 */
export async function getTicketById(ticketId: string) {
  return prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
        },
      },
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      responses: {
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  })
}

/**
 * Create a new support ticket
 */
export async function createTicket(data: CreateTicketData) {
  return prisma.supportTicket.create({
    data: {
      userId: data.userId,
      userEmail: data.userEmail,
      userName: data.userName,
      subject: data.subject,
      description: data.description,
      category: data.category,
      priority: data.priority,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })
}

/**
 * Update a ticket
 */
export async function updateTicket(ticketId: string, data: UpdateTicketData) {
  const updateData: any = {}

  if (data.status) {
    updateData.status = data.status
    if (data.status === 'RESOLVED') {
      updateData.resolvedAt = new Date()
    }
    if (data.status === 'CLOSED') {
      updateData.closedAt = new Date()
    }
  }

  if (data.assignedToId !== undefined) {
    updateData.assignedToId = data.assignedToId
  }

  if (data.resolution !== undefined) {
    updateData.resolution = data.resolution
  }

  return prisma.supportTicket.update({
    where: { id: ticketId },
    data: updateData,
  })
}

/**
 * Add a response to a ticket
 */
export async function addResponse(data: CreateResponseData) {
  const response = await prisma.ticketResponse.create({
    data: {
      ticketId: data.ticketId,
      senderId: data.senderId,
      senderRole: data.senderRole as any,
      isFromAdmin: data.isFromAdmin,
      message: data.message,
      attachments: data.attachments || [],
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  })

  // Update ticket status based on who is responding
  if (data.isFromAdmin) {
    await prisma.supportTicket.update({
      where: { id: data.ticketId },
      data: { status: 'WAITING_FOR_USER' },
    })
  } else {
    await prisma.supportTicket.update({
      where: { id: data.ticketId },
      data: { status: 'IN_PROGRESS' },
    })
  }

  return response
}

/**
 * Get ticket statistics
 */
export async function getTicketStats() {
  const [
    total,
    open,
    inProgress,
    waitingForUser,
    resolved,
    closed,
    byPriority,
    byCategory,
  ] = await Promise.all([
    prisma.supportTicket.count(),
    prisma.supportTicket.count({ where: { status: 'OPEN' } }),
    prisma.supportTicket.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.supportTicket.count({ where: { status: 'WAITING_FOR_USER' } }),
    prisma.supportTicket.count({ where: { status: 'RESOLVED' } }),
    prisma.supportTicket.count({ where: { status: 'CLOSED' } }),
    prisma.supportTicket.groupBy({
      by: ['priority'],
      _count: true,
    }),
    prisma.supportTicket.groupBy({
      by: ['category'],
      _count: true,
    }),
  ])

  return {
    total,
    open,
    inProgress,
    waitingForUser,
    resolved,
    closed,
    byPriority,
    byCategory,
  }
}
