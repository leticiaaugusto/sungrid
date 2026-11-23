/**
 * Entidade TelemetriaAtual (tabela `telemetria_atual`).
 *
 * Guarda os valores MAIS RECENTES de cada ativo (no máximo uma linha por
 * ativo), sobrescritos pelo simulador a cada 10 segundos (RNF07). É
 * diferente da tabela `leitura`, que guarda o histórico a cada 15 min (RN43).
 */

/** Sem atualização há mais que isso, o ativo é considerado offline (RN36 / RF27). */
export const LIMITE_OFFLINE_SEGUNDOS = 60

/** Acima disso o valor não é mais "atual" na tela (RN42 / RNF07: 5 a 10 s). */
export const LIMITE_DESATUALIZADA_SEGUNDOS = 30

export class TelemetriaAtual {
  constructor({
    ativoId,
    atualizadoEm,
    potenciaGeradaKw,
    potenciaConsumidaKw,
    temperaturaC,
    tensaoV,
    correnteA,
    eficienciaPct,
    cargaPct,
  }) {
    this.ativoId = ativoId
    this.atualizadoEm = atualizadoEm
    this.potenciaGeradaKw = potenciaGeradaKw
    this.potenciaConsumidaKw = potenciaConsumidaKw
    this.temperaturaC = temperaturaC
    this.tensaoV = tensaoV
    this.correnteA = correnteA
    this.eficienciaPct = eficienciaPct
    this.cargaPct = cargaPct
  }

  static deLinha(linha) {
    if (!linha) return null
    return new TelemetriaAtual({
      ativoId: linha.ativo_id,
      atualizadoEm: linha.atualizado_em,
      potenciaGeradaKw: linha.potencia_gerada_kw,
      potenciaConsumidaKw: linha.potencia_consumida_kw,
      temperaturaC: linha.temperatura_c,
      tensaoV: linha.tensao_v,
      correnteA: linha.corrente_a,
      eficienciaPct: linha.eficiencia_pct,
      cargaPct: linha.carga_pct,
    })
  }

  /** Há quantos segundos chegou a última atualização (método do diagrama). */
  segundosDesdeAtualizacao(agora = new Date()) {
    return Math.max(0, Math.round((agora - new Date(this.atualizadoEm)) / 1000))
  }

  estaDesatualizada(agora = new Date()) {
    return this.segundosDesdeAtualizacao(agora) > LIMITE_DESATUALIZADA_SEGUNDOS
  }
}
