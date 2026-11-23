/**
 * FaixaOperacao — «objeto de valor» do diagrama de classes.
 *
 * Não tem tabela própria: seus atributos são colunas da tabela `ativo`
 * (temperatura_max_c, tensao_nominal_v, ...). Agrupa as verificações que
 * classificam as medições de um ativo e é usada em dois lugares:
 *  1. nos cards da tela Acompanhamento de Ativo (textos de situação);
 *  2. nas regras de alerta (AlertaService).
 */
export class FaixaOperacao {
  constructor({ temperaturaMaxC, tensaoNominalV, toleranciaTensaoPct, correnteMaxA, eficienciaMinPct }) {
    this.temperaturaMaxC = temperaturaMaxC
    this.tensaoNominalV = tensaoNominalV
    this.toleranciaTensaoPct = toleranciaTensaoPct
    this.correnteMaxA = correnteMaxA
    this.eficienciaMinPct = eficienciaMinPct
  }

  /** Temperatura dentro do máximo? (sem limite cadastrado = considera normal) */
  temperaturaNormal(temperaturaC) {
    if (temperaturaC === null || this.temperaturaMaxC === null) return true
    return temperaturaC <= this.temperaturaMaxC
  }

  /** Quanto a tensão medida se afasta da nominal, em % (positivo ou negativo). */
  variacaoTensaoPct(tensaoV) {
    if (tensaoV === null || !this.tensaoNominalV) return null
    return ((tensaoV - this.tensaoNominalV) / this.tensaoNominalV) * 100
  }

  /** Tensão dentro da tolerância (ex.: ±5% da nominal)? */
  tensaoDentroDaTolerancia(tensaoV) {
    const variacao = this.variacaoTensaoPct(tensaoV)
    if (variacao === null || this.toleranciaTensaoPct === null) return true
    return Math.abs(variacao) <= this.toleranciaTensaoPct
  }

  /** Corrente até o máximo permitido? */
  correnteConforme(correnteA) {
    if (correnteA === null || this.correnteMaxA === null) return true
    return correnteA <= this.correnteMaxA
  }

  /** Eficiência acima do mínimo? */
  eficienciaAdequada(eficienciaPct) {
    if (eficienciaPct === null || this.eficienciaMinPct === null) return true
    return eficienciaPct >= this.eficienciaMinPct
  }

  /**
   * Classifica uma telemetria e produz os textos dos cards.
   * Cada item: { situacao: 'normal' | 'atencao', texto }.
   */
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
