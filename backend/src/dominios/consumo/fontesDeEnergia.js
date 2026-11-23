/**
 * De quais ativos vêm os números de geração e de consumo da instalação.
 *
 * Por que isso existe: painéis e inversores registram a MESMA energia
 * (o painel gera em corrente contínua e o inversor converte para a
 * rede da loja). Somar os dois contaria a geração em dobro. Por isso:
 *
 *  - GERAÇÃO da instalação = energia gerada pelos INVERSORES
 *    (é a energia dos painéis que de fato chega à loja);
 *  - CONSUMO da instalação = energia consumida no MEDIDOR da loja.
 *
 * As leituras dos painéis, da bateria e do sensor continuam no banco e
 * aparecem na tela de Acompanhamento de Ativo de cada equipamento.
 */
export const TIPO_ATIVO_GERACAO = 'INVERSOR'
export const TIPO_ATIVO_CONSUMO = 'MEDIDOR'
