// Delete all actions using Prisma
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

;(async () => {
  try {
    const { count } = await prisma.action.deleteMany({})
    console.log(`Deleted ${count} actions`)
  } catch (err) {
    console.error('Error deleting actions:', err)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
})()



