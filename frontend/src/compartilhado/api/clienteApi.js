/**
 * Cliente HTTP da API do SunGrid.
 *
 * Todas as telas falam com a API por aqui. Responsabilidades:
 *  - montar a URL com o prefixo /api/v1;
 *  - enviar o token JWT no cabeçalho Authorization;
 *  - transformar as respostas de erro { mensagem, campo } em ErroApi;
 *  - se a sessão expirar (401), sair e voltar para o login.
 */
import { encerrarSessao, obterToken } from '../sessao/sessao.js'

const urlBase = (import.meta.env.VITE_API_URL || '/api/v1').replace(/\/+$/, '')

/** Erro vindo da API, com o campo do formulário relacionado (quando houver). */
export class ErroApi extends Error {
  constructor(mensagem, { status, campo } = {}) {
    super(mensagem)
    this.name = 'ErroApi'
    this.status = status
    this.campo = campo
  }
}

function montarCabecalhos(temCorpo, cabecalhosExtras = {}) {
  const token = obterToken()
  return {
    ...(temCorpo ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...cabecalhosExtras,
  }
}

async function tratarErro(resposta, caminho) {
  let dados = null
  try {
    dados = await resposta.json()
  } catch {
    // resposta sem JSON
  }

  // Sessão expirada em uma tela interna: limpa e volta ao login.
  // (Na própria tela de login, 401 é só "senha errada".)
  if (resposta.status === 401 && obterToken() && !caminho.startsWith('/auth/login')) {
    encerrarSessao()
    window.location.replace('/login?sessao=expirada')
  }

  throw new ErroApi(dados?.mensagem || `A solicitação falhou (HTTP ${resposta.status}).`, {
    status: resposta.status,
    campo: dados?.campo,
  })
}

async function enviar(caminho, opcoes) {
  try {
    return await fetch(`${urlBase}${caminho}`, opcoes)
  } catch {
    throw new ErroApi('Não foi possível conectar à API. Verifique se o backend está rodando.')
  }
}

/**
 * Faz uma requisição e devolve o JSON da resposta.
 * @param {string} caminho ex.: '/alertas?status=ativo'
 * @param {{ metodo?: string, corpo?: object }} [opcoes]
 */
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

/**
 * Baixa um arquivo gerado pela API (ex.: relatório de alertas) e salva no computador.
 */
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
