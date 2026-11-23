/**
 * Rotas da conta do usuário (LGPD — RNF14).
 */
import { Router } from 'express'
import { autenticar } from '../../compartilhado/middlewares/autenticar.js'
import { autorizar } from '../../compartilhado/middlewares/autorizar.js'
import { AuthService } from '../autenticacao/AuthService.js'
import { ACOES } from '../autenticacao/permissoes.js'

export const usuariosRotas = Router()
usuariosRotas.use(autenticar)

// PATCH /api/v1/usuarios/me — atualiza perfil da própria conta.
usuariosRotas.patch('/me', async (req, res) => {
  res.json(await AuthService.atualizarMinhaConta(req.usuario.id, req.body ?? {}, req.ip))
})

// PUT /api/v1/usuarios/me/senha — troca a senha da própria conta.
usuariosRotas.put('/me/senha', async (req, res) => {
  res.json(await AuthService.trocarMinhaSenha(req.usuario.id, req.body ?? {}, req.ip))
})

// GET /api/v1/usuarios/me/dados — exporta os dados pessoais do usuário
usuariosRotas.get('/me/dados', async (req, res) => {
  const dados = await AuthService.exportarDadosPessoais(req.usuario.id, req.ip)
  res.attachment('meus-dados-sungrid.json').json(dados)
})

// DELETE /api/v1/usuarios/me — exclui a conta e os dados pessoais
usuariosRotas.delete('/me', async (req, res) => {
  res.json(await AuthService.excluirConta(req.usuario.id, req.ip))
})

// GET /api/v1/usuarios — lista usuários (somente administrador).
usuariosRotas.get('/', autorizar(ACOES.GERENCIAR_USUARIOS), async (req, res) => {
  res.json(await AuthService.listarUsuarios())
})

// PATCH /api/v1/usuarios/:id/papel — altera perfil ou resolve pedido pendente.
usuariosRotas.patch('/:id/papel', autorizar(ACOES.GERENCIAR_USUARIOS), async (req, res) => {
  res.json(await AuthService.alterarPapel(Number(req.params.id), req.body ?? {}, req.usuario.id, req.ip))
})
