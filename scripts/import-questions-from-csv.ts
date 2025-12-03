import { PrismaClient, QuestionType } from '@prisma/client'
import fs from 'fs'
import path from 'path'

// Minimal CSV parser that supports quotes and commas inside quotes
function parseCsv(content: string): string[][] {
  const rows: string[][] = []
  let current: string[] = []
  let field = ''
  let inQuotes = false
  let i = 0

  while (i < content.length) {
    const char = content[i]
    const next = content[i + 1]

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"'
        i += 2
        continue
      }
      if (char === '"') {
        inQuotes = false
        i += 1
        continue
      }
      field += char
      i += 1
      continue
    } else {
      if (char === '"') {
        inQuotes = true
        i += 1
        continue
      }
      if (char === ',') {
        current.push(field)
        field = ''
        i += 1
        continue
      }
      if (char === '\n' || char === '\r') {
        // Handle CRLF and LF
        if (char === '\r' && next === '\n') i += 1
        // push row only if something collected
        if (field.length || current.length) {
          current.push(field)
          rows.push(current)
        }
        current = []
        field = ''
        i += 1
        continue
      }
      field += char
      i += 1
      continue
    }
  }
  // flush last
  if (field.length || current.length) {
    current.push(field)
    rows.push(current)
  }
  return rows
}

function clean(value: string | undefined): string {
  if (!value) return ''
  return value
    .replace(/^\uFEFF/, '') // BOM
    .replace(/^[\s;]+|[\s;]+$/g, '')
    .replace(/[\u201C\u201D]/g, '"') // curly quotes to straight
    .replace(/"/g, '') // remove quotes
    .replace(/[\t\r\n]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

async function main() {
  const prisma = new PrismaClient()
  const tenantName = process.env.TENANT_NAME || 'TechCorp Solutions'
  const csvPath = path.resolve(process.cwd(), 'docs', 'GAMRDIGITALE_questions_full.csv')

  console.log(`Using tenant: ${tenantName}`)
  console.log(`Reading CSV: ${csvPath}`)

  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV file not found at ${csvPath}`)
  }

  const raw = fs.readFileSync(csvPath, 'utf8')
  const rows = parseCsv(raw)
  if (!rows.length) throw new Error('CSV appears empty')

  // Determine header and filter data rows
  const dataRows = rows.filter((r) => r.length >= 3)
  const cleaned = dataRows
    .map((cols) => {
      const [ligneDefenseRaw, objectifRaw, questionRaw] = cols
      const ligneDefense = clean(ligneDefenseRaw)
      const objectif = clean(objectifRaw)
      const question = clean(questionRaw)
      return { ligneDefense, objectif, question }
    })
    .filter((r) => r.ligneDefense && r.objectif && r.question)
    .filter((r) => !/^ligne\s*defense/i.test(r.ligneDefense))

  console.log(`Parsed ${cleaned.length} questions`)

  // Find tenant
  const tenant = await prisma.tenant.findFirst({ where: { name: tenantName } })
  if (!tenant) {
    throw new Error(`Tenant not found: ${tenantName}`)
  }

  // Delete existing templates for this tenant
  const existing = await prisma.evaluationTemplate.findMany({ where: { tenantId: tenant.id } })
  if (existing.length) {
    console.log(`Deleting ${existing.length} existing template(s) for tenant ${tenantName}...`)
    await prisma.evaluationTemplate.deleteMany({ where: { tenantId: tenant.id } })
  }

  // Build hierarchy: group by ligneDefense, then by objectif
  const groupsMap = new Map<string, Map<string, string[]>>()
  for (const row of cleaned) {
    if (!groupsMap.has(row.ligneDefense)) groupsMap.set(row.ligneDefense, new Map())
    const objMap = groupsMap.get(row.ligneDefense)!
    if (!objMap.has(row.objectif)) objMap.set(row.objectif, [])
    objMap.get(row.objectif)!.push(row.question)
  }

  const now = new Date()
  const templateName = `GAMRDIGITALE Questionnaire (Imported ${now.toISOString().slice(0, 10)})`

  console.log(`Creating template: ${templateName}`)

  const questionGroupsData = Array.from(groupsMap.entries()).map(([groupTitle, objMap], groupIndex) => ({
    title: groupTitle,
    description: null as string | null,
    orderIndex: groupIndex + 1,
    objectives: {
      create: Array.from(objMap.entries()).map(([objectiveTitle, questions], objectiveIndex) => ({
        title: objectiveTitle,
        description: null as string | null,
        orderIndex: objectiveIndex + 1,
        weight: 1.0,
        questions: {
          create: questions.map((q, qIndex) => ({
            text: q,
            // default to YES_NO; adjust manually later if needed
            type: QuestionType.YES_NO,
            orderIndex: qIndex + 1,
            isRequired: true,
          }))
        }
      }))
    }
  }))

  await prisma.evaluationTemplate.create({
    data: {
      name: templateName,
      description: 'Imported from GAMRDIGITALE_questions_full.csv',
      version: '1.0',
      isActive: true,
      isDefault: true,
      tenantId: tenant.id,
      questionGroups: {
        create: questionGroupsData
      }
    }
  })

  console.log('✅ Import completed successfully')
  await prisma.$disconnect()
}

main().catch(async (err) => {
  console.error('❌ Import failed:', err)
  process.exitCode = 1
})




