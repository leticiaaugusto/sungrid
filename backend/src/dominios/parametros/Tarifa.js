
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

  calcularValor(kwh) {
    return kwh * this.valorKwh
  }
}
