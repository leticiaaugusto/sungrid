import { baixarArquivoApi, requisicaoApi } from '../../compartilhado/api/clienteApi.js'

// Esta constante disponibiliza usuariosServico para outras partes do projeto.

export const usuariosServico = {
  usuarioAtual() {
    return requisicaoApi('/auth/me')
  },
  atualizarPerfil(dados) {
    return requisicaoApi('/usuarios/me', { metodo: 'PATCH', corpo: dados })
  },
  trocarSenha(dados) {
    return requisicaoApi('/usuarios/me/senha', { metodo: 'PUT', corpo: dados })
  },
  baixarDados() {
    return baixarArquivoApi('/usuarios/me/dados', 'meus-dados-sungrid.json')
  },
  excluirConta() {
    return requisicaoApi('/usuarios/me', { metodo: 'DELETE' })
  },
  listar() {
    return requisicaoApi('/usuarios')
  },
  alterarPapel(id, papel) {
    return requisicaoApi(`/usuarios/${encodeURIComponent(id)}/papel`, { metodo: 'PATCH', corpo: { papel } })
  },
  listarAtivosDoOperador(id) {
    return requisicaoApi(`/usuarios/${encodeURIComponent(id)}/ativos`)
  },
  atribuirAtivosAoOperador(id, ativoIds) {
    return requisicaoApi(`/usuarios/${encodeURIComponent(id)}/ativos`, { metodo: 'PUT', corpo: { ativoIds } })
  },
}
