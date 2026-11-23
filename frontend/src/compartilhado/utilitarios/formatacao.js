/**
 * Formatação de números e datas no padrão brasileiro.
 *
 * Aqui não há cálculo de negócio (totais, médias, projeções chegam
 * prontos da API — seção 2.2 do relatório): só a forma de exibir.
 */
const SEM_DADOS = '—'

export function formatarNumero(valor, casas = 1) {
  if (valor === null || valor === undefined) return SEM_DADOS
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: casas }).format(valor)
}

export const formatarKwh = (valor) => (valor === null || valor === undefined ? SEM_DADOS : `${formatarNumero(valor)} kWh`)
export const formatarKw = (valor) => (valor === null || valor === undefined ? SEM_DADOS : `${formatarNumero(valor)} kW`)

export function formatarReais(valor) {
  if (valor === null || valor === undefined) return SEM_DADOS
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
}

/** Variação com sinal: −4,2% / +2,1%. */
export function formatarVariacao(valor) {
  if (valor === null || valor === undefined) return SEM_DADOS
  const sinal = valor > 0 ? '+' : valor < 0 ? '−' : ''
  return `${sinal}${formatarNumero(Math.abs(valor))}%`
}

const formatoDataHora = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function formatarDataHora(valor) {
  return valor ? formatoDataHora.format(new Date(valor)).replace(',', '') : SEM_DADOS
}

/** "Há 5 min", "Há 2 h", "Há 3 dias". */
export function formatarTempoDecorrido(valor, agora = new Date()) {
  const minutos = Math.max(0, Math.round((agora - new Date(valor)) / 60000))
  if (minutos < 1) return 'Agora mesmo'
  if (minutos < 60) return `Há ${minutos} min`
  const horas = Math.round(minutos / 60)
  if (horas < 24) return `Há ${horas} h`
  return `Há ${Math.round(horas / 24)} dia(s)`
}

const DIAS_DA_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

/** "2026-11-23" -> "Seg". A data vem sem hora, então lemos como data local. */
export function diaDaSemana(dataIso) {
  const [ano, mes, dia] = dataIso.split('-').map(Number)
  return DIAS_DA_SEMANA[new Date(ano, mes - 1, dia).getDay()]
}

/** "2026-11" -> "Novembro 2026". */
export function nomeDoMes(mesIso, { comAno = true } = {}) {
  const [ano, mes] = mesIso.split('-').map(Number)
  const nome = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date(ano, mes - 1, 1))
  const capitalizado = nome.charAt(0).toUpperCase() + nome.slice(1)
  return comAno ? `${capitalizado} ${ano}` : capitalizado
}

/** "11:45" -> "11h45". */
export const formatarHorario = (horario) => (horario ? horario.replace(':', 'h') : SEM_DADOS)

/** Data de hoje no formato AAAA-MM-DD (fuso do navegador). */
export function hojeIso() {
  const data = new Date()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${data.getFullYear()}-${mes}-${dia}`
}

/** Mensagem de erro amigável a partir de qualquer erro. */
export const mensagemDeErro = (erro, padrao) => (erro instanceof Error && erro.message ? erro.message : padrao)
