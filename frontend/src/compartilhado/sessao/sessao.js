/**
 * Sessão do usuário no navegador.
 *
 * Depois do login, a API devolve um token JWT e os dados do usuário.
 * Guardamos os dois no localStorage para continuar logado ao recarregar
 * a página. O logout (RF06) apenas descarta o token: não há rota na API.
 */
const CHAVE_TOKEN = 'sungrid.token'
const CHAVE_USUARIO = 'sungrid.usuario'

export function salvarSessao({ token, usuario }) {
  localStorage.setItem(CHAVE_TOKEN, token)
  localStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuario))
}

export function obterToken() {
  return localStorage.getItem(CHAVE_TOKEN)
}

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
