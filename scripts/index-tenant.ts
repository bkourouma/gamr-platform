import { PrismaClient } from '@prisma/client'
import { RAGService } from '../src/lib/rag/ragService'

async function main() {
  const prisma = new PrismaClient()
  const rag = new RAGService()

  const arg = process.argv[2]
  let tenantId = arg

  if (!tenantId) {
    const tenant = await prisma.tenant.findFirst()
    if (!tenant) throw new Error('No tenants found in database. Seed first.')
    tenantId = tenant.id
    console.log(`No tenantId provided. Using first tenant: ${tenant.name} (${tenantId})`)
  }

  console.log(`Starting indexing for tenantId=${tenantId}...`)
  const statsBefore = await (rag as any).chromaService?.getCollectionStats?.(tenantId).catch(() => null)
  if (statsBefore) console.log(`Before: ${statsBefore.documentCount} docs`)
  const result = await rag.indexTenantData(tenantId)
  console.log('Indexing result:', result)
  const statsAfter = await (rag as any).chromaService?.getCollectionStats?.(tenantId).catch(() => null)
  if (statsAfter) console.log(`After: ${statsAfter.documentCount} docs`)

  await prisma.$disconnect()
}

main().catch(async (err) => {
  console.error('Indexing failed:', err)
  process.exit(1)
})




