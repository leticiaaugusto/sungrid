
// Esta constante disponibiliza LIMITE_OFFLINE_SEGUNDOS para outras partes do projeto.

export const LIMITE_OFFLINE_SEGUNDOS = 60

// Esta constante disponibiliza LIMITE_DESATUALIZADA_SEGUNDOS para outras partes do projeto.

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

  segundosDesdeAtualizacao(agora = new Date()) {
    return Math.max(0, Math.round((agora - new Date(this.atualizadoEm)) / 1000))
  }

  estaDesatualizada(agora = new Date()) {
    return this.segundosDesdeAtualizacao(agora) > LIMITE_DESATUALIZADA_SEGUNDOS
  }
}
