/**
 * Rotas da tela Acompanhamento de Ativo e da busca global de ativos.
 */
import { Router } from 'express'
import { autenticar } from '../../compartilhado/middlewares/autenticar.js'
import { autorizar } from '../../compartilhado/middlewares/autorizar.js'
import { ACOES } from '../autenticacao/permissoes.js'
import { ChamadoService } from '../chamados/ChamadoService.js'
import { AtivoService } from './AtivoService.js'

export const ativoRotas = Router()
ativoRotas.use(autenticar)

// GET /api/v1/ativos?busca= — lista ativos por nome ou código (RF09)
ativoRotas.get('/', async (req, res) => {
  res.json(await AtivoService.buscar(req.query.busca))
})

// POST /api/v1/ativos — cria ativo (somente administrador).
ativoRotas.post('/', autorizar(ACOES.GERENCIAR_ATIVOS), async (req, res) => {
  res.status(201).json(await AtivoService.criar(req.body ?? {}, req.usuario.id, req.ip))
})

// GET /api/v1/ativos/:id — dados cadastrais e status (RF28 / RF30)
ativoRotas.get('/:id', async (req, res) => {
  res.json(await AtivoService.detalhar(req.params.id))
})

// GET /api/v1/ativos/:id/telemetria — última leitura do ativo (RF29)
ativoRotas.get('/:id/telemetria', async (req, res) => {
  res.json(await AtivoService.telemetria(req.params.id))
})

// GET /api/v1/ativos/:id/historico?dias=7 — histórico diário de potência (RF31)
ativoRotas.get('/:id/historico', async (req, res) => {
  res.json(await AtivoService.historico(req.params.id, req.query.dias ?? 7))
})

// PUT /api/v1/ativos/:id — edita ativo (somente administrador).
ativoRotas.put('/:id', autorizar(ACOES.GERENCIAR_ATIVOS), async (req, res) => {
  res.json(await AtivoService.editar(req.params.id, req.body ?? {}, req.usuario.id, req.ip))
})

// POST /api/v1/ativos/:id/reiniciar — reinicia o ativo e registra na auditoria (RF32)
ativoRotas.post('/:id/reiniciar', autorizar(ACOES.REINICIAR_ATIVO), async (req, res) => {
  res.json(await AtivoService.reiniciar(req.params.id, req.usuario.id, req.ip))
})

// POST /api/v1/ativos/:id/chamados — abre um chamado para o ativo (RF33)
ativoRotas.post('/:id/chamados', autorizar(ACOES.ABRIR_CHAMADO), async (req, res) => {
  const resultado = await ChamadoService.abrir(Number(req.params.id), req.usuario.id, req.body ?? {}, req.ip)
  res.status(201).json(resultado)
})
