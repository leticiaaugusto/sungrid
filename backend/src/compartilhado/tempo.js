/**
 * Funções de data usadas por várias telas.
 *
 * As datas trafegam no formato ISO 8601 (seção 5 do relatório):
 * dias como "AAAA-MM-DD" e meses como "AAAA-MM".
 */
import { FUSO_HORARIO } from '../config/ambiente.js'
import { erros } from './erros.js'

const formatoDia = new Intl.DateTimeFormat('en-CA', {
  timeZone: FUSO_HORARIO,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** Data de hoje no fuso oficial, no formato AAAA-MM-DD. */
export function hoje() {
  return formatoDia.format(new Date())
}

/** Mês atual no fuso oficial, no formato AAAA-MM. */
export function mesAtual() {
  return hoje().slice(0, 7)
}

/** Soma (ou subtrai) dias de uma data AAAA-MM-DD. */
export function somarDias(data, dias) {
  const [ano, mes, dia] = data.split('-').map(Number)
  const resultado = new Date(Date.UTC(ano, mes - 1, dia + dias))
  return resultado.toISOString().slice(0, 10)
}

/** Mês anterior a um mês AAAA-MM. */
export function mesAnterior(mes) {
  const [ano, numeroMes] = mes.split('-').map(Number)
  const resultado = new Date(Date.UTC(ano, numeroMes - 2, 1))
  return resultado.toISOString().slice(0, 7)
}

/** Quantidade de dias de um mês AAAA-MM. */
export function diasNoMes(mes) {
  const [ano, numeroMes] = mes.split('-').map(Number)
  return new Date(Date.UTC(ano, numeroMes, 0)).getUTCDate()
}

/** Valida e devolve uma data AAAA-MM-DD; lança erro 400 se inválida. */
export function validarData(valor, campo = 'data') {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor ?? '') || Number.isNaN(Date.parse(valor))) {
    throw erros.requisicaoInvalida(`Informe ${campo} no formato AAAA-MM-DD.`, campo)
  }
  return valor
}

/** Valida e devolve um mês AAAA-MM; lança erro 400 se inválido. */
export function validarMes(valor, campo = 'mes') {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(valor ?? '')) {
    throw erros.requisicaoInvalida(`Informe ${campo} no formato AAAA-MM.`, campo)
  }
  return valor
}

/** Arredonda um número para N casas decimais (null continua null). */
export function arredondar(valor, casas = 1) {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return null
  const fator = 10 ** casas
  return Math.round(valor * fator) / fator
}

/** Variação percentual entre dois valores; null quando não há base de comparação. */
export function variacaoPercentual(atual, anterior) {
  if (!anterior) return null
  return arredondar(((atual - anterior) / anterior) * 100, 1)
}
