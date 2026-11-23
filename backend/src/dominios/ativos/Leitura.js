/**
 * Entidade Leitura (tabela `leitura`).
 *
 * Registro histórico de um ativo a cada 15 minutos. Não tem métodos
 * (diagrama de classes): apenas guarda a medição.
 *
 * RN15 — unidades:
 *  - potencia_*_kw  = potência INSTANTÂNEA no momento da leitura (kW);
 *  - energia_*_kwh  = energia ACUMULADA nos 15 min do intervalo (kWh).
 * Os totais diários e mensais somam os campos de ENERGIA, nunca os de potência.
 */
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
