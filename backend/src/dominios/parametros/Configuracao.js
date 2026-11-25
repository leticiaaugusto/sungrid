
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

  calcularCo2Evitado(kwhGerados) {
    return kwhGerados * (this.fatorEmissaoKgco2Kwh ?? 0)
  }
}
