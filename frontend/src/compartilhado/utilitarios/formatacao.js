
const SEM_DADOS = '—'
// Esta função prepara ou formata o valor para exibição.

export function formatarNumero(valor, casas = 1) {
  if (valor === null || valor === undefined) return SEM_DADOS
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: casas }).format(valor)
}

// Esta constante disponibiliza formatarKwh para outras partes do projeto.

export const formatarKwh = (valor) => (valor === null || valor === undefined ? SEM_DADOS : `${formatarNumero(valor)} kWh`)
// Esta constante disponibiliza formatarKw para outras partes do projeto.
export const formatarKw = (valor) => (valor === null || valor === undefined ? SEM_DADOS : `${formatarNumero(valor)} kW`)
// Esta função prepara ou formata o valor para exibição.

export function formatarReais(valor) {
  if (valor === null || valor === undefined) return SEM_DADOS
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
}
// Esta função prepara ou formata o valor para exibição.

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
// Esta função prepara ou formata o valor para exibição.

export function formatarDataHora(valor) {
  return valor ? formatoDataHora.format(new Date(valor)).replace(',', '') : SEM_DADOS
}
// Esta função prepara ou formata o valor para exibição.

export function formatarTempoDecorrido(valor, agora = new Date()) {
  const minutos = Math.max(0, Math.round((agora - new Date(valor)) / 60000))
  if (minutos < 1) return 'Agora mesmo'
  if (minutos < 60) return `Há ${minutos} min`
  const horas = Math.round(minutos / 60)
  if (horas < 24) return `Há ${horas} h`
  return `Há ${Math.round(horas / 24)} dia(s)`
}

const DIAS_DA_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function diaDaSemana(dataIso) {
  const [ano, mes, dia] = dataIso.split('-').map(Number)
  return DIAS_DA_SEMANA[new Date(ano, mes - 1, dia).getDay()]
}

export function nomeDoMes(mesIso, { comAno = true } = {}) {
  const [ano, mes] = mesIso.split('-').map(Number)
  const nome = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date(ano, mes - 1, 1))
  const capitalizado = nome.charAt(0).toUpperCase() + nome.slice(1)
  return comAno ? `${capitalizado} ${ano}` : capitalizado
}

// Esta constante disponibiliza formatarHorario para outras partes do projeto.

export const formatarHorario = (horario) => (horario ? horario.replace(':', 'h') : SEM_DADOS)

export function hojeIso() {
  const data = new Date()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${data.getFullYear()}-${mes}-${dia}`
}

// Esta constante disponibiliza mensagemDeErro para outras partes do projeto.

export const mensagemDeErro = (erro, padrao) => (erro instanceof Error && erro.message ? erro.message : padrao)
