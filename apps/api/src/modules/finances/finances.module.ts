import type { FastifyInstance } from 'fastify'
import type { PrismaClient } from '@prisma/client'

import { PrismaDespesaRepository } from './infra/prisma-despesa.repository.js'
import { PrismaRendimentoRepository } from './infra/prisma-rendimento.repository.js'
import { PrismaInvestimentoRepository } from './infra/prisma-investimento.repository.js'
import { PrismaMovimentacaoInvestimentoRepository } from './infra/prisma-movimentacao-investimento.repository.js'
import { PrismaCartaoRepository } from './infra/prisma-cartao.repository.js'
import { PrismaPessoaRepository } from './infra/prisma-pessoa.repository.js'
import { PrismaAbaRepository } from './infra/prisma-aba.repository.js'
import { PrismaCategoriaRepository } from './infra/prisma-categoria.repository.js'
import { PrismaOrcamentoRepository } from './infra/prisma-orcamento.repository.js'
import { PrismaFaturaRepository } from './infra/prisma-fatura.repository.js'
import { PrismaSnapshotCicloRepository } from './infra/prisma-snapshot-ciclo.repository.js'
import { PrismaDivisaoEntryRepository } from './infra/prisma-divisao-entry.repository.js'
import { PrismaRegraFixaRepository } from './infra/prisma-regra-fixa.repository.js'
import { PrismaCategoryRuleRepository } from './infra/prisma-category-rule.repository.js'
import { PrismaAcertoRepository } from './infra/prisma-acerto.repository.js'

import { ListDespesasUseCase } from './application/use-cases/list-despesas.use-case.js'
import { CreateDespesaUseCase } from './application/use-cases/create-despesa.use-case.js'
import { UpdateDespesaUseCase } from './application/use-cases/update-despesa.use-case.js'
import { DeleteDespesaUseCase } from './application/use-cases/delete-despesa.use-case.js'
import { GetDespesaSplitsUseCase } from './application/use-cases/get-despesa-splits.use-case.js'

import { ListRendimentosUseCase } from './application/use-cases/list-rendimentos.use-case.js'
import { CreateRendimentoUseCase } from './application/use-cases/create-rendimento.use-case.js'
import { UpdateRendimentoUseCase } from './application/use-cases/update-rendimento.use-case.js'
import { DeleteRendimentoUseCase } from './application/use-cases/delete-rendimento.use-case.js'

import { ListPosicoesUseCase } from './application/use-cases/list-posicoes.use-case.js'
import { CreatePosicaoUseCase } from './application/use-cases/create-posicao.use-case.js'
import { UpdatePosicaoUseCase } from './application/use-cases/update-posicao.use-case.js'
import { DeactivatePosicaoUseCase } from './application/use-cases/deactivate-posicao.use-case.js'
import { ListMovimentacoesUseCase } from './application/use-cases/list-movimentacoes.use-case.js'
import { CreateMovimentacaoUseCase } from './application/use-cases/create-movimentacao.use-case.js'
import { UpdateMovimentacaoUseCase } from './application/use-cases/update-movimentacao.use-case.js'
import { DeleteMovimentacaoUseCase } from './application/use-cases/delete-movimentacao.use-case.js'
import { GetEvolucaoUseCase } from './application/use-cases/get-evolucao.use-case.js'

import { ListCartoesUseCase } from './application/use-cases/list-cartoes.use-case.js'
import { CreateCartaoUseCase } from './application/use-cases/create-cartao.use-case.js'
import { UpdateCartaoUseCase } from './application/use-cases/update-cartao.use-case.js'
import { DeleteCartaoUseCase } from './application/use-cases/delete-cartao.use-case.js'

import { ListPessoasUseCase } from './application/use-cases/list-pessoas.use-case.js'
import { CreatePessoaUseCase } from './application/use-cases/create-pessoa.use-case.js'
import { UpdatePessoaUseCase } from './application/use-cases/update-pessoa.use-case.js'
import { DeletePessoaUseCase } from './application/use-cases/delete-pessoa.use-case.js'

import { ListAbasUseCase } from './application/use-cases/list-abas.use-case.js'
import { CreateAbaUseCase } from './application/use-cases/create-aba.use-case.js'
import { UpdateAbaUseCase } from './application/use-cases/update-aba.use-case.js'
import { DeleteAbaUseCase } from './application/use-cases/delete-aba.use-case.js'

import { ListCategoriasUseCase } from './application/use-cases/list-categorias.use-case.js'
import { CreateCategoriaUseCase } from './application/use-cases/create-categoria.use-case.js'
import { UpdateCategoriaUseCase } from './application/use-cases/update-categoria.use-case.js'
import { DeleteCategoriaUseCase } from './application/use-cases/delete-categoria.use-case.js'

import { ListOrcamentosUseCase } from './application/use-cases/list-orcamentos.use-case.js'
import { UpsertOrcamentoUseCase } from './application/use-cases/upsert-orcamento.use-case.js'
import { DeleteOrcamentoUseCase } from './application/use-cases/delete-orcamento.use-case.js'

import { GetDashboardUseCase } from './application/use-cases/get-dashboard.use-case.js'

import { ListFaturasUseCase } from './application/use-cases/list-faturas.use-case.js'
import { GetFaturaUseCase } from './application/use-cases/get-fatura.use-case.js'
import { DeleteFaturaUseCase } from './application/use-cases/delete-fatura.use-case.js'
import { ListTransacoesUseCase } from './application/use-cases/list-transacoes.use-case.js'
import { UpdateTransacaoUseCase } from './application/use-cases/update-transacao.use-case.js'
import { DeleteTransacaoUseCase } from './application/use-cases/delete-transacao.use-case.js'

import { ListSnapshotsUseCase } from './application/use-cases/list-snapshots.use-case.js'
import { CreateSnapshotUseCase } from './application/use-cases/create-snapshot.use-case.js'
import { DeleteSnapshotUseCase } from './application/use-cases/delete-snapshot.use-case.js'

import { ListDivisoesUseCase } from './application/use-cases/list-divisoes.use-case.js'
import { CreateDivisaoUseCase } from './application/use-cases/create-divisao.use-case.js'
import { QuitarDivisaoUseCase } from './application/use-cases/quitar-divisao.use-case.js'

import { ListRegrasFixasUseCase } from './application/use-cases/list-regras-fixas.use-case.js'
import { CreateRegraFixaUseCase } from './application/use-cases/create-regra-fixa.use-case.js'
import { UpdateRegraFixaUseCase } from './application/use-cases/update-regra-fixa.use-case.js'
import { DeleteRegraFixaUseCase } from './application/use-cases/delete-regra-fixa.use-case.js'

import { ListCategoryRulesUseCase } from './application/use-cases/list-category-rules.use-case.js'
import { CreateCategoryRuleUseCase } from './application/use-cases/create-category-rule.use-case.js'
import { UpdateCategoryRuleUseCase } from './application/use-cases/update-category-rule.use-case.js'
import { DeleteCategoryRuleUseCase } from './application/use-cases/delete-category-rule.use-case.js'

import { ExportLancamentosUseCase } from './application/use-cases/export-lancamentos.use-case.js'
import { ExportFaturasUseCase } from './application/use-cases/export-faturas.use-case.js'

import { CalcularAcertoUseCase } from './application/use-cases/calcular-acerto.use-case.js'
import { RegistrarAcertoUseCase } from './application/use-cases/registrar-acerto.use-case.js'
import { DeleteAcertoUseCase } from './application/use-cases/delete-acerto.use-case.js'
import { ListarHistoricoAcertoUseCase } from './application/use-cases/listar-historico-acerto.use-case.js'

import { despesasRoutes } from './http/despesas.routes.js'
import { rendimentosRoutes } from './http/rendimentos.routes.js'
import { investimentosRoutes } from './http/investimentos.routes.js'
import { cartoesRoutes } from './http/cartoes.routes.js'
import { pessoasRoutes } from './http/pessoas.routes.js'
import { abasRoutes } from './http/abas.routes.js'
import { categoriasRoutes } from './http/categorias.routes.js'
import { orcamentosRoutes } from './http/orcamentos.routes.js'
import { dashboardRoutes } from './http/dashboard.routes.js'
import { faturasRoutes } from './http/faturas.routes.js'
import { snapshotsRoutes } from './http/snapshots.routes.js'
import { splitsRoutes } from './http/splits.routes.js'
import { regrasFixasRoutes } from './http/regras-fixas.routes.js'
import { categoryRulesRoutes } from './http/category-rules.routes.js'
import { acertoRoutes } from './http/acerto.routes.js'
import { exportRoutes } from './http/export.routes.js'

export async function buildFinancesModule(app: FastifyInstance, prisma: PrismaClient) {
  const despesaRepo = new PrismaDespesaRepository(prisma)
  const rendimentoRepo = new PrismaRendimentoRepository(prisma)
  const investimentoRepo = new PrismaInvestimentoRepository(prisma)
  const movimentacaoRepo = new PrismaMovimentacaoInvestimentoRepository(prisma)
  const cartaoRepo = new PrismaCartaoRepository(prisma)
  const pessoaRepo = new PrismaPessoaRepository(prisma)
  const abaRepo = new PrismaAbaRepository(prisma)
  const categoriaRepo = new PrismaCategoriaRepository(prisma)
  const orcamentoRepo = new PrismaOrcamentoRepository(prisma)
  const faturaRepo = new PrismaFaturaRepository(prisma)
  const snapshotRepo = new PrismaSnapshotCicloRepository(prisma)
  const divisaoRepo = new PrismaDivisaoEntryRepository(prisma)
  const regraFixaRepo = new PrismaRegraFixaRepository(prisma)
  const categoryRuleRepo = new PrismaCategoryRuleRepository(prisma)
  const acertoRepo = new PrismaAcertoRepository(prisma)

  await app.register(
    async (api) => {
      await api.register(despesasRoutes, {
        listDespesas: new ListDespesasUseCase(despesaRepo),
        createDespesa: new CreateDespesaUseCase(despesaRepo),
        updateDespesa: new UpdateDespesaUseCase(despesaRepo),
        deleteDespesa: new DeleteDespesaUseCase(despesaRepo, acertoRepo),
        getDespesaSplits: new GetDespesaSplitsUseCase(despesaRepo),
      })

      await api.register(rendimentosRoutes, {
        listRendimentos: new ListRendimentosUseCase(rendimentoRepo),
        createRendimento: new CreateRendimentoUseCase(rendimentoRepo),
        updateRendimento: new UpdateRendimentoUseCase(rendimentoRepo),
        deleteRendimento: new DeleteRendimentoUseCase(rendimentoRepo),
      })

      await api.register(investimentosRoutes, {
        listPosicoes: new ListPosicoesUseCase(investimentoRepo),
        createPosicao: new CreatePosicaoUseCase(investimentoRepo),
        updatePosicao: new UpdatePosicaoUseCase(investimentoRepo),
        deactivatePosicao: new DeactivatePosicaoUseCase(investimentoRepo),
        listMovimentacoes: new ListMovimentacoesUseCase(movimentacaoRepo),
        createMovimentacao: new CreateMovimentacaoUseCase(movimentacaoRepo, investimentoRepo),
        updateMovimentacao: new UpdateMovimentacaoUseCase(movimentacaoRepo),
        deleteMovimentacao: new DeleteMovimentacaoUseCase(movimentacaoRepo),
        getEvolucao: new GetEvolucaoUseCase(movimentacaoRepo),
      })

      await api.register(cartoesRoutes, {
        listCartoes: new ListCartoesUseCase(cartaoRepo),
        createCartao: new CreateCartaoUseCase(cartaoRepo),
        updateCartao: new UpdateCartaoUseCase(cartaoRepo),
        deleteCartao: new DeleteCartaoUseCase(cartaoRepo),
      })

      await api.register(pessoasRoutes, {
        listPessoas: new ListPessoasUseCase(pessoaRepo),
        createPessoa: new CreatePessoaUseCase(pessoaRepo),
        updatePessoa: new UpdatePessoaUseCase(pessoaRepo),
        deletePessoa: new DeletePessoaUseCase(pessoaRepo, despesaRepo),
      })

      await api.register(abasRoutes, {
        listAbas: new ListAbasUseCase(abaRepo),
        createAba: new CreateAbaUseCase(abaRepo),
        updateAba: new UpdateAbaUseCase(abaRepo),
        deleteAba: new DeleteAbaUseCase(abaRepo),
      })

      await api.register(categoriasRoutes, {
        listCategorias: new ListCategoriasUseCase(categoriaRepo),
        createCategoria: new CreateCategoriaUseCase(categoriaRepo),
        updateCategoria: new UpdateCategoriaUseCase(categoriaRepo),
        deleteCategoria: new DeleteCategoriaUseCase(categoriaRepo),
      })

      await api.register(orcamentosRoutes, {
        listOrcamentos: new ListOrcamentosUseCase(orcamentoRepo),
        upsertOrcamento: new UpsertOrcamentoUseCase(orcamentoRepo),
        deleteOrcamento: new DeleteOrcamentoUseCase(orcamentoRepo),
      })

      await api.register(dashboardRoutes, {
        getDashboard: new GetDashboardUseCase(
          despesaRepo, rendimentoRepo, investimentoRepo,
          abaRepo, orcamentoRepo, divisaoRepo, pessoaRepo, acertoRepo,
        ),
      })

      await api.register(faturasRoutes, {
        listFaturas: new ListFaturasUseCase(faturaRepo),
        getFatura: new GetFaturaUseCase(faturaRepo),
        deleteFatura: new DeleteFaturaUseCase(faturaRepo, despesaRepo, acertoRepo),
        listTransacoes: new ListTransacoesUseCase(faturaRepo),
        updateTransacao: new UpdateTransacaoUseCase(faturaRepo, categoryRuleRepo, cartaoRepo, despesaRepo),
        deleteTransacao: new DeleteTransacaoUseCase(faturaRepo, cartaoRepo, despesaRepo),
      })

      await api.register(snapshotsRoutes, {
        listSnapshots: new ListSnapshotsUseCase(snapshotRepo),
        createSnapshot: new CreateSnapshotUseCase(snapshotRepo),
        deleteSnapshot: new DeleteSnapshotUseCase(snapshotRepo),
      })

      const listDivisoesUC = new ListDivisoesUseCase(divisaoRepo)
      const createDivisaoUC = new CreateDivisaoUseCase(divisaoRepo)
      const quitarDivisaoUC = new QuitarDivisaoUseCase(divisaoRepo)
      await api.register(splitsRoutes, {
        listDivisoes: listDivisoesUC,
        createDivisao: createDivisaoUC,
        quitarDivisao: quitarDivisaoUC,
      })

      await api.register(regrasFixasRoutes, {
        listRegrasFixas: new ListRegrasFixasUseCase(regraFixaRepo),
        createRegraFixa: new CreateRegraFixaUseCase(regraFixaRepo),
        updateRegraFixa: new UpdateRegraFixaUseCase(regraFixaRepo),
        deleteRegraFixa: new DeleteRegraFixaUseCase(regraFixaRepo),
      })

      await api.register(categoryRulesRoutes, {
        listCategoryRules: new ListCategoryRulesUseCase(categoryRuleRepo),
        createCategoryRule: new CreateCategoryRuleUseCase(categoryRuleRepo),
        updateCategoryRule: new UpdateCategoryRuleUseCase(categoryRuleRepo),
        deleteCategoryRule: new DeleteCategoryRuleUseCase(categoryRuleRepo),
      })

      await api.register(acertoRoutes, {
        calcularAcerto: new CalcularAcertoUseCase(acertoRepo),
        registrarAcerto: new RegistrarAcertoUseCase(acertoRepo),
        deleteAcerto: new DeleteAcertoUseCase(acertoRepo),
        historicoAcerto: new ListarHistoricoAcertoUseCase(acertoRepo),
      })

      await api.register(exportRoutes, {
        exportLancamentos: new ExportLancamentosUseCase(
          despesaRepo, rendimentoRepo, investimentoRepo, movimentacaoRepo,
          abaRepo, pessoaRepo, cartaoRepo,
        ),
        exportFaturas: new ExportFaturasUseCase(faturaRepo, cartaoRepo),
      })
    },
    { prefix: '/api' },
  )
}
