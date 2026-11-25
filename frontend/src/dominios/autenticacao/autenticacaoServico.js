
import { requisicaoApi } from '../../compartilhado/api/clienteApi.js'

// Esta constante disponibiliza autenticacaoServico para outras partes do projeto.

export const autenticacaoServico = {

  entrar({ email, senha }) {
    return requisicaoApi('/auth/login', { metodo: 'POST', corpo: { email, senha } })
  },

  cadastrar({ nome, email, senha, confirmacaoSenha, perfil }) {
    return requisicaoApi('/auth/cadastro', { metodo: 'POST', corpo: { nome, email, senha, confirmacaoSenha, perfil } })
  },

  solicitarRecuperacao(email) {
    return requisicaoApi('/auth/recuperar-senha', { metodo: 'POST', corpo: { email } })
  },

  redefinirSenha({ token, senha, confirmacaoSenha }) {
    return requisicaoApi('/auth/redefinir-senha', { metodo: 'POST', corpo: { token, senha, confirmacaoSenha } })
  },
}
