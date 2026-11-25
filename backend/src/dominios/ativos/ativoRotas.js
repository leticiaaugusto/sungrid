
import { Router } from 'express'
import { autenticar } from '../../compartilhado/middlewares/autenticar.js'
import { autorizar } from '../../compartilhado/middlewares/autorizar.js'
import { ACOES } from '../autenticacao/permissoes.js'
import { ChamadoService } from '../chamados/ChamadoService.js'
import { AtivoService } from './AtivoService.js'

// Esta constante disponibiliza ativoRotas para outras partes do projeto.

export const ativoRotas = Router()
ativoRotas.use(autenticar)

ativoRotas.get('/', autorizar(ACOES.CONSULTAR_MONITORAMENTO), async (req, res) => {
  res.json(await AtivoService.buscar(req.query.busca, req.usuario))
})

ativoRotas.post('/', autorizar(ACOES.GERENCIAR_ATIVOS), async (req, res) => {
  res.status(201).json(await AtivoService.criar(req.body ?? {}, req.usuario.id, req.ip))
})

ativoRotas.get('/:id', autorizar(ACOES.CONSULTAR_MONITORAMENTO), async (req, res) => {
  res.json(await AtivoService.detalhar(req.params.id, req.usuario))
})

ativoRotas.get('/:id/telemetria', autorizar(ACOES.CONSULTAR_MONITORAMENTO), async (req, res) => {
  res.json(await AtivoService.telemetria(req.params.id, req.usuario))
})

ativoRotas.get('/:id/historico', autorizar(ACOES.CONSULTAR_MONITORAMENTO), async (req, res) => {
  res.json(await AtivoService.historico(req.params.id, req.query.dias ?? 7, req.usuario))
})

ativoRotas.put('/:id', autorizar(ACOES.GERENCIAR_ATIVOS), async (req, res) => {
  res.json(await AtivoService.editar(req.params.id, req.body ?? {}, req.usuario.id, req.ip))
})

ativoRotas.post('/:id/reiniciar', autorizar(ACOES.REINICIAR_ATIVO), async (req, res) => {
  res.json(await AtivoService.reiniciar(req.params.id, req.usuario, req.ip))
})

ativoRotas.post('/:id/chamados', autorizar(ACOES.ABRIR_CHAMADO), async (req, res) => {
  const resultado = await ChamadoService.abrir(Number(req.params.id), req.usuario, req.body ?? {}, req.ip)
  res.status(201).json(resultado)
})
