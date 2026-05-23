import { prisma } from '../src/shared/prisma.js'

async function run() {
  const t = await prisma.transacao.deleteMany()
  const f = await prisma.fatura.deleteMany()
  const d = await prisma.despesa.deleteMany({ where: { tipo: 'cartao_ciclo' } })
  console.log(`Deletados: ${t.count} transações | ${f.count} faturas | ${d.count} despesas cartao_ciclo`)
  await prisma.$disconnect()
}

run().catch((e) => { console.error(e); process.exit(1) })
