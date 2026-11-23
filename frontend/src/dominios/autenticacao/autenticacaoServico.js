/**
 * Chamadas à API das telas de autenticação.
 */
import { requisicaoApi } from '../../compartilhado/api/clienteApi.js'

export const autenticacaoServico = {
  /** POST /auth/login — devolve { token, usuario } (RF01). */
  entrar({ email, senha }) {
    return requisicaoApi('/auth/login', { metodo: 'POST', corpo: { email, senha } })
  },

  /** POST /auth/cadastro (RF02 / RF03). */
  cadastrar({ nome, email, senha, confirmacaoSenha, perfil }) {
    return requisicaoApi('/auth/cadastro', { metodo: 'POST', corpo: { nome, email, senha, confirmacaoSenha, perfil } })
  },

  /** POST /auth/recuperar-senha — envia o link por e-mail (RF04 / RF05). */
  solicitarRecuperacao(email) {
    return requisicaoApi('/auth/recuperar-senha', { metodo: 'POST', corpo: { email } })
  },

  /** POST /auth/redefinir-senha — grava a nova senha usando o token do link. */
  redefinirSenha({ token, senha, confirmacaoSenha }) {
    return requisicaoApi('/auth/redefinir-senha', { metodo: 'POST', corpo: { token, senha, confirmacaoSenha } })
  },
}
