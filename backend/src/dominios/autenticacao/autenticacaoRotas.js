
import { Router } from 'express'
import { autenticar } from '../../compartilhado/middlewares/autenticar.js'
import { limitarLogin } from '../../compartilhado/middlewares/limitarLogin.js'
import { AuthService } from './AuthService.js'

// Esta constante disponibiliza autenticacaoRotas para outras partes do projeto.

export const autenticacaoRotas = Router()

autenticacaoRotas.post('/login', limitarLogin, async (req, res) => {
  res.json(await AuthService.login(req.body ?? {}, req.ip))
})

autenticacaoRotas.post('/cadastro', async (req, res) => {
  const resultado = await AuthService.cadastrar(req.body ?? {})
  res.status(201).json(resultado)
})

autenticacaoRotas.post('/recuperar-senha', async (req, res) => {
  res.json(await AuthService.solicitarRecuperacaoSenha(req.body ?? {}))
})

autenticacaoRotas.post('/redefinir-senha', async (req, res) => {
  res.json(await AuthService.redefinirSenha(req.body ?? {}))
})

autenticacaoRotas.get('/me', autenticar, async (req, res) => {
  res.json(await AuthService.usuarioLogado(req.usuario.id))
})
