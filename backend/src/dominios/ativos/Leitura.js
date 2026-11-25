
export class Leitura {
  constructor({
    ativoId,
    dataHora,
    potenciaGeradaKw = null,
    potenciaConsumidaKw = null,
    energiaGeradaKwh = null,
    energiaConsumidaKwh = null,
    temperaturaC = null,
    tensaoV = null,
    correnteA = null,
    eficienciaPct = null,
    cargaPct = null,
  }) {
    this.ativoId = ativoId
    this.dataHora = dataHora
    this.potenciaGeradaKw = potenciaGeradaKw
    this.potenciaConsumidaKw = potenciaConsumidaKw
    this.energiaGeradaKwh = energiaGeradaKwh
    this.energiaConsumidaKwh = energiaConsumidaKwh
    this.temperaturaC = temperaturaC
    this.tensaoV = tensaoV
    this.correnteA = correnteA
    this.eficienciaPct = eficienciaPct
    this.cargaPct = cargaPct
  }
}
