/**
 * Rotas de autenticação — telas Login, Cadastro, Esqueceu a senha,
 * Redefinir senha e o topo das telas (usuário logado).
 *
 * Camada de rotas: recebe a requisição, chama o serviço e devolve JSON.
 * Nenhuma regra de negócio fica aqui.
 */
import { Router } from 'express'
import { autenticar } from '../../compartilhado/middlewares/autenticar.js'
import { limitarLogin } from '../../compartilhado/middlewares/limitarLogin.js'
import { AuthService } from './AuthService.js'

export const autenticacaoRotas = Router()

// POST /api/v1/auth/login — RF01
autenticacaoRotas.post('/login', limitarLogin, async (req, res) => {
  res.json(await AuthService.login(req.body ?? {}, req.ip))
})

// POST /api/v1/auth/cadastro — RF02 / RF03
autenticacaoRotas.post('/cadastro', async (req, res) => {
  const resultado = await AuthService.cadastrar(req.body ?? {})
  res.status(201).json(resultado)
})

// POST /api/v1/auth/recuperar-senha — RF04 / RF05
autenticacaoRotas.post('/recuperar-senha', async (req, res) => {
  res.json(await AuthService.solicitarRecuperacaoSenha(req.body ?? {}))
})

// POST /api/v1/auth/redefinir-senha — RF04
autenticacaoRotas.post('/redefinir-senha', async (req, res) => {
  res.json(await AuthService.redefinirSenha(req.body ?? {}))
})

// GET /api/v1/auth/me — RF07 (nome, cargo e foto no topo das telas)
autenticacaoRotas.get('/me', autenticar, async (req, res) => {
  res.json(await AuthService.usuarioLogado(req.usuario.id))
})
