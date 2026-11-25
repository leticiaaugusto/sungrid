
export class FaixaOperacao {
  constructor({ temperaturaMaxC, tensaoNominalV, toleranciaTensaoPct, correnteMaxA, eficienciaMinPct }) {
    this.temperaturaMaxC = temperaturaMaxC
    this.tensaoNominalV = tensaoNominalV
    this.toleranciaTensaoPct = toleranciaTensaoPct
    this.correnteMaxA = correnteMaxA
    this.eficienciaMinPct = eficienciaMinPct
  }

  temperaturaNormal(temperaturaC) {
    if (temperaturaC === null || this.temperaturaMaxC === null) return true
    return temperaturaC <= this.temperaturaMaxC
  }

  variacaoTensaoPct(tensaoV) {
    if (tensaoV === null || !this.tensaoNominalV) return null
    return ((tensaoV - this.tensaoNominalV) / this.tensaoNominalV) * 100
  }

  tensaoDentroDaTolerancia(tensaoV) {
    const variacao = this.variacaoTensaoPct(tensaoV)
    if (variacao === null || this.toleranciaTensaoPct === null) return true
    return Math.abs(variacao) <= this.toleranciaTensaoPct
  }

  correnteConforme(correnteA) {
    if (correnteA === null || this.correnteMaxA === null) return true
    return correnteA <= this.correnteMaxA
  }

  eficienciaAdequada(eficienciaPct) {
    if (eficienciaPct === null || this.eficienciaMinPct === null) return true
    return eficienciaPct >= this.eficienciaMinPct
  }

  avaliar(telemetria) {
    const variacaoBruta = this.variacaoTensaoPct(telemetria.tensaoV)
    const variacao = variacaoBruta === null ? null : Math.round(variacaoBruta * 10) / 10
    const sinal = variacao !== null && variacao >= 0 ? '+' : '−'
    const variacaoTexto = variacao === null ? '' : `${sinal}${Math.abs(variacao).toFixed(1).replace('.', ',')}%`

    return {
      temperatura: this.temperaturaNormal(telemetria.temperaturaC)
        ? { situacao: 'normal', texto: 'Temperatura normal de operação' }
        : { situacao: 'atencao', texto: `Acima do máximo de ${this.temperaturaMaxC} °C` },
      tensao: this.tensaoDentroDaTolerancia(telemetria.tensaoV)
        ? { situacao: 'normal', texto: `Variação de ${variacaoTexto} da nominal`, variacaoPct: variacao }
        : { situacao: 'atencao', texto: `Fora da tolerância (${variacaoTexto})`, variacaoPct: variacao },
      corrente: this.correnteConforme(telemetria.correnteA)
        ? { situacao: 'normal', texto: 'Carga em conformidade' }
        : { situacao: 'atencao', texto: `Acima do máximo de ${this.correnteMaxA} A` },
      eficiencia: this.eficienciaAdequada(telemetria.eficienciaPct)
        ? { situacao: 'normal', texto: 'Eficiência adequada' }
        : { situacao: 'atencao', texto: `Abaixo do mínimo de ${this.eficienciaMinPct}%` },
    }
  }
}
