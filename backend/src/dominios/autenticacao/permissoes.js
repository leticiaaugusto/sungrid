
// Esta constante disponibiliza ACOES para outras partes do projeto.

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

// Esta constante disponibiliza PERMISSOES_POR_PAPEL para outras partes do projeto.

export const PERMISSOES_POR_PAPEL = Object.freeze({
  OPERADOR: permissoesOperador,

  ADMINISTRADOR: [...permissoesOperador, ACOES.GERENCIAR_ATIVOS, ACOES.GERENCIAR_USUARIOS],
})

// Esta constante disponibiliza NOMES_PAPEIS para outras partes do projeto.

export const NOMES_PAPEIS = Object.freeze({
  OPERADOR: 'Operador de Rede',
  ADMINISTRADOR: 'Administrador',
})
