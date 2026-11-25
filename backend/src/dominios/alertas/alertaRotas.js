
import { Router } from 'express'
import { autenticar } from '../../compartilhado/middlewares/autenticar.js'
import { autorizar } from '../../compartilhado/middlewares/autorizar.js'
import { somenteAdministrador } from '../../compartilhado/middlewares/somenteAdministrador.js'
import { ACOES } from '../autenticacao/permissoes.js'
import { AlertaService } from './AlertaService.js'

// Esta constante disponibiliza alertaRotas para outras partes do projeto.

export const alertaRotas = Router()
alertaRotas.use(autenticar)
alertaRotas.use(somenteAdministrador)

alertaRotas.get('/', async (req, res) => {
  res.json(await AlertaService.listar(req.query, req.usuario.id))
})

alertaRotas.get('/exportar', autorizar(ACOES.EXPORTAR_ALERTAS), async (req, res) => {
  const arquivo = await AlertaService.exportar(req.query, req.usuario.id, req.ip)
  res.attachment(arquivo.nomeArquivo).type(arquivo.tipoMime).send(arquivo.conteudo)
})

alertaRotas.patch('/:id/resolver', autorizar(ACOES.RESOLVER_ALERTA), async (req, res) => {
  res.json(await AlertaService.resolverManualmente(Number(req.params.id), req.usuario.id, req.ip))
})
