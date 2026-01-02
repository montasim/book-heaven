import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

// Load env
require('dotenv').config({ path: '.env.local' })
require('dotenv').config({ path: '.env' })

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function updateUserRole() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'mamun@yopmail.com' }
    })

    if (!user) {
      console.log('User not found')
      await prisma.$disconnect()
      process.exit(1)
    }

    console.log('Current user:', { id: user.id, email: user.email, role: user.role })

    const updated = await prisma.user.update({
      where: { email: 'mamun@yopmail.com' },
      data: { role: 'ADMIN' }
    })

    console.log('Updated user:', { id: updated.id, email: updated.email, role: updated.role })
    await prisma.$disconnect()
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

updateUserRole()
