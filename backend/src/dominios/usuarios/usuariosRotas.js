
import { Router } from 'express'
import { autenticar } from '../../compartilhado/middlewares/autenticar.js'
import { autorizar } from '../../compartilhado/middlewares/autorizar.js'
import { AuthService } from '../autenticacao/AuthService.js'
import { ACOES } from '../autenticacao/permissoes.js'
import { AtivoService } from '../ativos/AtivoService.js'

// Esta constante disponibiliza usuariosRotas para outras partes do projeto.

export const usuariosRotas = Router()
usuariosRotas.use(autenticar)

usuariosRotas.patch('/me', async (req, res) => {
  res.json(await AuthService.atualizarMinhaConta(req.usuario.id, req.body ?? {}, req.ip))
})

usuariosRotas.put('/me/senha', async (req, res) => {
  res.json(await AuthService.trocarMinhaSenha(req.usuario.id, req.body ?? {}, req.ip))
})

usuariosRotas.get('/me/dados', async (req, res) => {
  const dados = await AuthService.exportarDadosPessoais(req.usuario.id, req.ip)
  res.attachment('meus-dados-sungrid.json').json(dados)
})

usuariosRotas.delete('/me', async (req, res) => {
  res.json(await AuthService.excluirConta(req.usuario.id, req.ip))
})

usuariosRotas.get('/', autorizar(ACOES.GERENCIAR_USUARIOS), async (req, res) => {
  res.json(await AuthService.listarUsuarios())
})

usuariosRotas.get('/:id/ativos', autorizar(ACOES.GERENCIAR_USUARIOS), async (req, res) => {
  res.json(await AtivoService.listarAtribuicaoOperador(req.usuario.id, Number(req.params.id)))
})

usuariosRotas.put('/:id/ativos', autorizar(ACOES.GERENCIAR_USUARIOS), async (req, res) => {
  res.json(
    await AtivoService.atribuirAtivosAoOperador(
      req.usuario.id,
      Number(req.params.id),
      req.body?.ativoIds,
      req.ip,
    ),
  )
})

usuariosRotas.patch('/:id/papel', autorizar(ACOES.GERENCIAR_USUARIOS), async (req, res) => {
  res.json(await AuthService.alterarPapel(Number(req.params.id), req.body ?? {}, req.usuario.id, req.ip))
})
