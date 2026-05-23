import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const CATEGORIAS_PADRAO = [
  { nome: 'Alimentação',  icon: '🍽️', padrao: true, permanente: true },
  { nome: 'Transporte',   icon: '🚗', padrao: true, permanente: true },
  { nome: 'Saúde',        icon: '🏥', padrao: true, permanente: true },
  { nome: 'Educação',     icon: '📚', padrao: true, permanente: true },
  { nome: 'Lazer',        icon: '🎬', padrao: true, permanente: true },
  { nome: 'Casa',         icon: '🏠', padrao: true, permanente: true },
  { nome: 'Vestuário',    icon: '👕', padrao: true, permanente: true },
  { nome: 'Assinaturas',  icon: '📱', padrao: true, permanente: true },
  { nome: 'Pets',         icon: '🐾', padrao: true, permanente: true },
  { nome: 'Viagem',       icon: '✈️', padrao: true, permanente: true },
  { nome: 'Presente',     icon: '🎁', padrao: true, permanente: true },
  { nome: 'Cartão',       icon: '💳', padrao: true, permanente: true },
  { nome: 'Outros',       icon: '📌', padrao: true, permanente: true },
]

const ABAS_PADRAO = [
  { nome: 'Pessoal',  icon: '👤', cor: '#10F5A3', ordem: 0, splitDestinoCategoria: null },
  { nome: 'Familiar', icon: '🏠', cor: '#6FA9D6', ordem: 1, splitDestinoCategoria: 'Casa' },
]

async function main() {
  console.log('Seeding pessoa padrão...')
  const existing = await prisma.pessoa.findFirst({ where: { nome: 'Eu' } })
  if (!existing) {
    await prisma.pessoa.create({ data: { nome: 'Eu', cor: '#B07AFF', familiar: true } })
  }

  console.log('Seeding categorias...')
  for (const cat of CATEGORIAS_PADRAO) {
    await prisma.categoria.upsert({
      where: { nome: cat.nome },
      update: { padrao: cat.padrao, permanente: cat.permanente },
      create: cat,
    })
  }

  console.log('Seeding aba Familiar...')
  const familiarSeed = ABAS_PADRAO[1]
  const existingFamiliar = await prisma.abaDespesa.findFirst({
    where: { nome: 'Familiar', pessoaId: null },
  })
  if (!existingFamiliar) {
    await prisma.abaDespesa.create({ data: { ...familiarSeed, pessoaId: null } })
  }

  console.log('Backfill abas próprias por pessoa...')
  const pessoas = await prisma.pessoa.findMany({ where: { ativo: true } })
  for (const p of pessoas) {
    const own = await prisma.abaDespesa.findFirst({ where: { pessoaId: p.id } })
    if (!own) {
      await prisma.abaDespesa.create({
        data: { nome: p.nome, icon: '👤', cor: p.cor, pessoaId: p.id, ordem: 0 },
      })
    }
  }

  // Cartão sentinela id=1 — cobertura para faturas sem cartão atribuído
  console.log('Seeding cartão sentinela...')
  await prisma.cartao.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      nome: 'Sem cartão',
      cor: '#5A6273',
      ativo: false,
      diaFechamento: 5,
    },
  })

  console.log('Seed completo.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
