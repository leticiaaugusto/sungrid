
import { PRIORIDADES } from './Alerta.js'

// Esta constante disponibiliza LIMITE_BATERIA_BAIXA_PCT para outras partes do projeto.

export const LIMITE_BATERIA_BAIXA_PCT = 20

// Esta constante reúne as opções usadas pela tela.

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

const numero = (valor) => valor.toLocaleString('pt-BR', { maximumFractionDigits: 1 })

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

export function tipoAlertaOffline(ativo) {
  return ativo.tipo === 'SENSOR' ? 'SENSOR_OFFLINE' : 'FALHA_COMUNICACAO'
}
