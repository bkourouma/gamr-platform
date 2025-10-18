// Delete all actions using Prisma (CommonJS)
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

;(async () => {
  try {
    const result = await prisma.action.deleteMany({})
    console.log(`Deleted ${result.count || 0} actions`)
  } catch (err) {
    console.error('Error deleting actions:', err)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
})()



