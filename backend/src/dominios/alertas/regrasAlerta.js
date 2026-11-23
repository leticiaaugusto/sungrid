/**
 * Catálogo das categorias de alerta automático (RN33, RN34, RN37).
 *
 * Para cada tipo: prioridade e se pode ser resolvido automaticamente
 * quando a condição volta ao normal. Os valores marcados como DECISÃO
 * ainda precisam ser validados pela equipe (DP08 e DP09) — basta
 * alterar aqui.
 */
import { PRIORIDADES } from './Alerta.js'

/** DECISÃO (DP08): carga de bateria abaixo disso gera alerta. */
export const LIMITE_BATERIA_BAIXA_PCT = 20

export const TIPOS_ALERTA = Object.freeze({
  CONSUMO_ACIMA_LIMITE: {
    descricao: 'Consumo acima do limite operacional',
    prioridade: PRIORIDADES.ALTA,
    resolucaoAutomatica: true,
  },
  TEMPERATURA_ELEVADA: {
    descricao: 'Temperatura acima do máximo',
    prioridade: PRIORIDADES.ALTA,
    resolucaoAutomatica: true,
  },
  // DECISÃO (DP09): pico de tensão exige conferência do operador.
  PICO_TENSAO: {
    descricao: 'Tensão fora da tolerância',
    prioridade: PRIORIDADES.ALTA,
    resolucaoAutomatica: false,
  },
  BATERIA_BAIXA: {
    descricao: 'Bateria abaixo do mínimo',
    prioridade: PRIORIDADES.MEDIA,
    resolucaoAutomatica: true,
  },
  FALHA_COMUNICACAO: {
    descricao: 'Falha de comunicação (sem telemetria)',
    prioridade: PRIORIDADES.MEDIA,
    resolucaoAutomatica: true,
  },
  SENSOR_OFFLINE: {
    descricao: 'Sensor offline',
    prioridade: PRIORIDADES.BAIXA,
    resolucaoAutomatica: true,
  },
})

/** Formata número no padrão brasileiro com 1 casa (ex.: 78,4). */
const numero = (valor) => valor.toLocaleString('pt-BR', { maximumFractionDigits: 1 })

/**
 * Verifica as condições de alerta de UMA telemetria.
 * Devolve um mapa { TIPO: descrição } apenas com as condições violadas.
 *
 * @param {import('../ativos/Ativo.js').Ativo} ativo
 * @param {import('../ativos/TelemetriaAtual.js').TelemetriaAtual} telemetria
 */
export function condicoesVioladas(ativo, telemetria) {
  const { faixa } = ativo
  const violadas = {}

  if (!faixa.temperaturaNormal(telemetria.temperaturaC)) {
    violadas.TEMPERATURA_ELEVADA =
      `Temperatura de ${numero(telemetria.temperaturaC)} °C no ${ativo.codigo} ` +
      `acima do máximo de ${numero(faixa.temperaturaMaxC)} °C`
  }

  if (!faixa.tensaoDentroDaTolerancia(telemetria.tensaoV)) {
    violadas.PICO_TENSAO =
      `Tensão de ${numero(telemetria.tensaoV)} V no ${ativo.codigo} ` +
      `fora da tolerância de ±${numero(faixa.toleranciaTensaoPct)}% (nominal ${numero(faixa.tensaoNominalV)} V)`
  }

  if (ativo.tipo === 'BATERIA' && telemetria.cargaPct !== null && telemetria.cargaPct < LIMITE_BATERIA_BAIXA_PCT) {
    violadas.BATERIA_BAIXA =
      `Bateria ${ativo.codigo} com ${numero(telemetria.cargaPct)}% de carga ` +
      `(mínimo ${LIMITE_BATERIA_BAIXA_PCT}%)`
  }

  return violadas
}

/** Tipo de alerta usado quando o ativo para de enviar telemetria. */
export function tipoAlertaOffline(ativo) {
  return ativo.tipo === 'SENSOR' ? 'SENSOR_OFFLINE' : 'FALHA_COMUNICACAO'
}
