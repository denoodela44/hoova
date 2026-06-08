/**
 * Run once to create admin accounts:
 *   node prisma/create-admin.js
 */
require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

const ADMINS = [
  { name: 'HOOVA Admin',   email: 'admin@hoova.com.gh',   password: 'HoovaAdmin2024!' },
  { name: 'Lali Dev',     email: 'lali@hoova.com.gh',    password: 'HoovaDev2024!'   },
]

async function main() {
  for (const a of ADMINS) {
    const password_hash = await bcrypt.hash(a.password, 12)
    const user = await prisma.user.upsert({
      where: { email: a.email },
      update: { subscription_tier: 'admin', password_hash },
      create: {
        name: a.name,
        email: a.email,
        password_hash,
        subscription_tier: 'admin',
        email_verified: true,
        id_verified: true,
      },
    })
    console.log(`✓  ${a.email}  (id: ${user.id})`)
  }
  console.log('\nAdmin accounts ready. Login with the credentials above.')
}

main().catch(console.error).finally(() => prisma.$disconnect())
