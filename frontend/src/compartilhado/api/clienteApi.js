
import { encerrarSessao, obterToken } from '../sessao/sessao.js'

const urlBase = (import.meta.env.VITE_API_URL || '/api/v1').replace(/\/+$/, '')

export class ErroApi extends Error {
  constructor(mensagem, { status, campo } = {}) {
    super(mensagem)
    this.name = 'ErroApi'
    this.status = status
    this.campo = campo
  }
}
// Esta função organiza os dados antes de enviá-los ou exibí-los.

function montarCabecalhos(temCorpo, cabecalhosExtras = {}) {
  const token = obterToken()
  return {
    ...(temCorpo ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...cabecalhosExtras,
  }
}
// Esta função prepara ou formata o valor para exibição.

async function tratarErro(resposta, caminho) {
  let dados = null
  try {
    dados = await resposta.json()
  } catch {

  }

  if (resposta.status === 401 && obterToken() && !caminho.startsWith('/auth/login')) {
    encerrarSessao()
    window.location.replace('/login?sessao=expirada')
  }

  throw new ErroApi(dados?.mensagem || `A solicitação falhou (HTTP ${resposta.status}).`, {
    status: resposta.status,
    campo: dados?.campo,
  })
}
// Esta função envia ou recebe dados da API.

async function enviar(caminho, opcoes) {
  try {
    return await fetch(`${urlBase}${caminho}`, opcoes)
  } catch {
    throw new ErroApi('Não foi possível conectar à API. Verifique se o backend está rodando.')
  }
}

// Esta função envia chamadas à API e trata a resposta.
// Esta função envia ou recebe dados da API.
export async function requisicaoApi(caminho, { metodo = 'GET', corpo } = {}) {
  const resposta = await enviar(caminho, {
    method: metodo,
    headers: montarCabecalhos(corpo !== undefined),
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  })

  if (!resposta.ok) await tratarErro(resposta, caminho)
  const texto = await resposta.text()
  return texto ? JSON.parse(texto) : null
}
// Esta função envia ou recebe dados da API.

export async function baixarArquivoApi(caminho, nomePadrao = 'arquivo') {
  const resposta = await enviar(caminho, { headers: montarCabecalhos(false) })
  if (!resposta.ok) await tratarErro(resposta, caminho)

  const disposicao = resposta.headers.get('Content-Disposition') ?? ''
  const nomeArquivo = disposicao.match(/filename="?([^";]+)"?/)?.[1] ?? nomePadrao
  const url = URL.createObjectURL(await resposta.blob())

  const link = document.createElement('a')
  link.href = url
  link.download = nomeArquivo
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}
