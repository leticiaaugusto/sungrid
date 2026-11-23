/**
 * Rotas da tela Gerenciamento de Alertas.
 */
import { Router } from 'express'
import { autenticar } from '../../compartilhado/middlewares/autenticar.js'
import { autorizar } from '../../compartilhado/middlewares/autorizar.js'
import { ACOES } from '../autenticacao/permissoes.js'
import { AlertaService } from './AlertaService.js'

export const alertaRotas = Router()
alertaRotas.use(autenticar)

// GET /api/v1/alertas?status=&prioridade= — lista filtrada (RF21–RF25)
alertaRotas.get('/', async (req, res) => {
  res.json(await AlertaService.listar(req.query))
})

// GET /api/v1/alertas/exportar?status=&prioridade=&formato= — relatório CSV, PDF ou XLSX (RF26)
alertaRotas.get('/exportar', autorizar(ACOES.EXPORTAR_ALERTAS), async (req, res) => {
  const arquivo = await AlertaService.exportar(req.query, req.usuario.id, req.ip)
  res.attachment(arquivo.nomeArquivo).type(arquivo.tipoMime).send(arquivo.conteudo)
})

// PATCH /api/v1/alertas/:id/resolver — resolução manual (RN37 / RN38; método Alerta.resolver)
alertaRotas.patch('/:id/resolver', autorizar(ACOES.RESOLVER_ALERTA), async (req, res) => {
  res.json(await AlertaService.resolverManualmente(Number(req.params.id), req.usuario.id, req.ip))
})
