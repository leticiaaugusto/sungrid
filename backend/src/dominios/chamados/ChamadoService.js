
import { erros } from '../../compartilhado/erros.js'
import { STATUS_ALERTA } from '../alertas/Alerta.js'
import { alertaRepositorio } from '../alertas/alertaRepositorio.js'
import { ativoRepositorio } from '../ativos/ativoRepositorio.js'
import { ACOES_AUDITADAS } from '../auditoria/Auditoria.js'
import { AuditoriaService } from '../auditoria/AuditoriaService.js'
import { STATUS_CHAMADO } from './Chamado.js'
import { chamadoRepositorio } from './chamadoRepositorio.js'

const TAMANHO_MAXIMO_DESCRICAO = 500

// Esta constante disponibiliza ChamadoService para outras partes do projeto.

export const ChamadoService = {

  async abrir(ativoId, usuario, { descricao, alertaId } = {}, ip) {
    const ativo = await ativoRepositorio.buscarPorIdComAcesso(ativoId, usuario)
    if (!ativo) throw erros.naoEncontrado('Ativo não encontrado.')

    let alerta = null
    if (alertaId) {
      alerta = await alertaRepositorio.buscarPorId(alertaId)
      if (!alerta || alerta.ativoId !== ativo.id) {
        throw erros.requisicaoInvalida('O alerta informado não pertence a este ativo.', 'alertaId')
      }
    } else {
      const [maisRecente] = (await alertaRepositorio.listar({ status: STATUS_ALERTA.ATIVO })).filter(
        (item) => item.ativoId === ativo.id,
      )
      alerta = maisRecente ?? null
    }

    const texto =
      (typeof descricao === 'string' && descricao.trim()) ||
      (alerta
        ? `Atendimento do alerta #${alerta.id}: ${alerta.descricao}`
        : `Verificação técnica solicitada para ${ativo.codigo} (${ativo.nome})`)

    if (texto.length > TAMANHO_MAXIMO_DESCRICAO) {
      throw erros.requisicaoInvalida(`A descrição deve ter até ${TAMANHO_MAXIMO_DESCRICAO} caracteres.`, 'descricao')
    }

    const chamado = await chamadoRepositorio.inserir(ativo.abrirChamado(usuario.id, texto, alerta?.id ?? null))

    await AuditoriaService.registrar({
      usuarioId: usuario.id,
      acao: ACOES_AUDITADAS.CHAMADO_ABERTO,
      alvo: { entidade: 'chamado', id: chamado.id },
      ip,
      detalhes: { ativo: ativo.codigo, alertaId: chamado.alertaId },
    })

    return { mensagem: `Chamado #${chamado.id} aberto para ${ativo.codigo}.`, chamado }
  },

  async listar({ status } = {}) {
    let filtro = null
    if (status && !['todos', 'all'].includes(String(status).toLowerCase())) {
      filtro = String(status).toUpperCase()
      if (!Object.values(STATUS_CHAMADO).includes(filtro)) {
        throw erros.requisicaoInvalida('Status de chamado inválido.', 'status')
      }
    }
    return chamadoRepositorio.listar({ status: filtro })
  },
}
