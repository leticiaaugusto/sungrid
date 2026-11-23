/**
 * Entidade Tarifa (tabela `tarifa`) — RN27.
 *
 * Valor do kWh com data de início de vigência. A tarifa aplicada a um
 * período é a de maior `vigenteDesde` que não seja posterior ao período.
 */
export class Tarifa {
  constructor({ id, valorKwh, vigenteDesde }) {
    this.id = id
    this.valorKwh = valorKwh
    this.vigenteDesde = vigenteDesde
  }

  static deLinha(linha) {
    if (!linha) return null
    return new Tarifa({ id: linha.id, valorKwh: linha.valor_kwh, vigenteDesde: linha.vigente_desde })
  }

  /** Converte kWh em reais (método do diagrama de classes). */
  calcularValor(kwh) {
    return kwh * this.valorKwh
  }
}
