/**
 * Entidade Configuracao (tabela `configuracao`, linha única).
 *
 * Guarda as metas e limites usados nos cálculos (RN19, RN20, RN25):
 *  - metaConsumoDiarioKwh: linha de meta do gráfico semanal
 *  - limiteContratualMesKwh: comparado com a projeção mensal
 *  - limiteOperacionalKw: potência consumida que dispara alerta
 *  - fatorEmissaoKgco2Kwh: converte energia gerada em CO₂ evitado
 */
export class Configuracao {
  constructor({ metaConsumoDiarioKwh, limiteContratualMesKwh, limiteOperacionalKw, fatorEmissaoKgco2Kwh }) {
    this.metaConsumoDiarioKwh = metaConsumoDiarioKwh
    this.limiteContratualMesKwh = limiteContratualMesKwh
    this.limiteOperacionalKw = limiteOperacionalKw
    this.fatorEmissaoKgco2Kwh = fatorEmissaoKgco2Kwh
  }

  static deLinha(linha) {
    return new Configuracao({
      metaConsumoDiarioKwh: linha?.meta_consumo_diario_kwh ?? null,
      limiteContratualMesKwh: linha?.limite_contratual_mes_kwh ?? null,
      limiteOperacionalKw: linha?.limite_operacional_kw ?? null,
      fatorEmissaoKgco2Kwh: linha?.fator_emissao_kgco2_kwh ?? null,
    })
  }

  /** RN20: energia gerada (kWh) x fator de emissão = kg de CO₂ evitados. */
  calcularCo2Evitado(kwhGerados) {
    return kwhGerados * (this.fatorEmissaoKgco2Kwh ?? 0)
  }
}
