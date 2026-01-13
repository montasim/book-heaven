import { z } from 'zod'

export const loanSchema = z.object({
  id: z.string(),
  bookId: z.string(),
  userId: z.string(),
  lentById: z.string(),
  loanDate: z.string(),
  dueDate: z.string(),
  returnDate: z.string().nullable(),
  status: z.enum(['ACTIVE', 'RETURNED', 'OVERDUE', 'CANCELLED']),
  notes: z.string().nullable(),
  reminderSent: z.boolean(),
  bookName: z.string(),
  bookImage: z.string().nullable(),
  bookType: z.string(),
  userName: z.string(),
  userEmail: z.string(),
  lentByName: z.string(),
  daysRemaining: z.number(),
  isOverdue: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

// Types
export type Loan = z.infer<typeof loanSchema>

// Column configuration for data table
export const loanColumns = [
  {
    key: 'bookName',
    label: 'Book',
    sortable: true,
  },
  {
    key: 'userName',
    label: 'Borrower',
    sortable: true,
  },
  {
    key: 'loanDate',
    label: 'Loan Date',
    sortable: true,
  },
  {
    key: 'dueDate',
    label: 'Due Date',
    sortable: true,
  },
  {
    key: 'returnDate',
    label: 'Return Date',
    sortable: true,
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
  },
  {
    key: 'daysRemaining',
    label: 'Days Left',
    sortable: true,
  },
]
