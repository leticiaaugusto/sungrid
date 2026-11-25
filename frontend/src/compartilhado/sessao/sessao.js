
const CHAVE_TOKEN = 'sungrid.token'
const CHAVE_USUARIO = 'sungrid.usuario'
// Esta função grava ou atualiza os dados.

export function salvarSessao({ token, usuario }) {
  localStorage.setItem(CHAVE_TOKEN, token)
  localStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuario))
}
// Esta função busca os dados necessários.

export function obterToken() {
  return localStorage.getItem(CHAVE_TOKEN)
}
// Esta função busca os dados necessários.

export function obterUsuario() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_USUARIO))
  } catch {
    return null
  }
}

export function estaLogado() {
  return Boolean(obterToken())
}

export function encerrarSessao() {
  localStorage.removeItem(CHAVE_TOKEN)
  localStorage.removeItem(CHAVE_USUARIO)
}
