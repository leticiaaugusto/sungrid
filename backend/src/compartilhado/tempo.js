
import { FUSO_HORARIO } from '../config/ambiente.js'
import { erros } from './erros.js'

const formatoDia = new Intl.DateTimeFormat('en-CA', {
  timeZone: FUSO_HORARIO,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export function hoje() {
  // Esta função retorna a data atual no fuso horário da aplicação.
  return formatoDia.format(new Date())
}

export function mesAtual() {
  // Esta função retorna o mês atual no formato AAAA-MM.
  return hoje().slice(0, 7)
}

export function somarDias(data, dias) {
  // Esta função soma uma quantidade de dias a uma data.
  const [ano, mes, dia] = data.split('-').map(Number)
  const resultado = new Date(Date.UTC(ano, mes - 1, dia + dias))
  return resultado.toISOString().slice(0, 10)
}

export function mesAnterior(mes) {
  // Esta função calcula o mês anterior a partir de uma data mensal.
  const [ano, numeroMes] = mes.split('-').map(Number)
  const resultado = new Date(Date.UTC(ano, numeroMes - 2, 1))
  return resultado.toISOString().slice(0, 7)
}

export function diasNoMes(mes) {
  // Esta função informa quantos dias existem em determinado mês.
  const [ano, numeroMes] = mes.split('-').map(Number)
  return new Date(Date.UTC(ano, numeroMes, 0)).getUTCDate()
}

export function validarData(valor, campo = 'data') {
  // Esta função verifica se o valor recebido é uma data válida.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor ?? '') || Number.isNaN(Date.parse(valor))) {
    throw erros.requisicaoInvalida(`Informe ${campo} no formato AAAA-MM-DD.`, campo)
  }
  return valor
}

export function validarMes(valor, campo = 'mes') {
  // Esta função verifica se o valor recebido é um mês válido.
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(valor ?? '')) {
    throw erros.requisicaoInvalida(`Informe ${campo} no formato AAAA-MM.`, campo)
  }
  return valor
}

export function arredondar(valor, casas = 1) {
  // Esta função limita um número à quantidade de casas decimais informada.
  if (valor === null || valor === undefined || Number.isNaN(valor)) return null
  const fator = 10 ** casas
  return Math.round(valor * fator) / fator
}

export function variacaoPercentual(atual, anterior) {
  // Esta função calcula a diferença percentual entre dois valores.
  if (!anterior) return null
  return arredondar(((atual - anterior) / anterior) * 100, 1)
}
