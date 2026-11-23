/**
 * Matriz de permissões por papel (RN09 / RN45 / DP01).
 *
 * O relatório define dois papéis: OPERADOR (Operador de Rede) e
 * ADMINISTRADOR, que herda as operações do operador. A matriz completa
 * ainda está pendente (DP01); por decisão do projeto, os DOIS papéis
 * podem reiniciar ativos (RN45). Para mudar uma permissão, basta editar
 * as listas abaixo: o middleware `autorizar` e `Usuario.temPermissao`
 * leem daqui.
 */
export const ACOES = Object.freeze({
  CONSULTAR_MONITORAMENTO: 'CONSULTAR_MONITORAMENTO',
  REINICIAR_ATIVO: 'REINICIAR_ATIVO',
  ABRIR_CHAMADO: 'ABRIR_CHAMADO',
  EXPORTAR_ALERTAS: 'EXPORTAR_ALERTAS',
  RESOLVER_ALERTA: 'RESOLVER_ALERTA',
  GERENCIAR_ATIVOS: 'GERENCIAR_ATIVOS',
  GERENCIAR_USUARIOS: 'GERENCIAR_USUARIOS',
})

const permissoesOperador = [
  ACOES.CONSULTAR_MONITORAMENTO,
  ACOES.REINICIAR_ATIVO,
  ACOES.ABRIR_CHAMADO,
  ACOES.EXPORTAR_ALERTAS,
  ACOES.RESOLVER_ALERTA,
]

export const PERMISSOES_POR_PAPEL = Object.freeze({
  OPERADOR: permissoesOperador,
  // O administrador herda tudo do operador; acrescente aqui ações exclusivas.
  ADMINISTRADOR: [...permissoesOperador, ACOES.GERENCIAR_ATIVOS, ACOES.GERENCIAR_USUARIOS],
})

/** Nome exibido no topo das telas para cada papel. */
export const NOMES_PAPEIS = Object.freeze({
  OPERADOR: 'Operador de Rede',
  ADMINISTRADOR: 'Administrador',
})
