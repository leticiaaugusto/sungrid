import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Alerta from '../../compartilhado/componentes/Alerta.jsx'
import { formatarDataHora, mensagemDeErro } from '../../compartilhado/utilitarios/formatacao.js'
import { alertasServico } from './alertasServico.js'

const FILTROS_STATUS = [
  { valor: 'todos', rotulo: 'Todos' },
  { valor: 'ativo', rotulo: 'Ativos' },
  { valor: 'resolvido', rotulo: 'Resolvidos' },
]

const FILTROS_PRIORIDADE = [
  { valor: 'todas', rotulo: 'Todas Prioridades' },
  { valor: 'alta', rotulo: 'Alta' },
  { valor: 'media', rotulo: 'Média' },
  { valor: 'baixa', rotulo: 'Baixa' },
]

const FORMATOS_EXPORTACAO = [
  { valor: 'csv', rotulo: 'CSV' },
  { valor: 'xlsx', rotulo: 'Excel (XLSX)' },
  { valor: 'pdf', rotulo: 'PDF' },
]

const ROTULOS_STATUS = { ATIVO: 'Ativo', RESOLVIDO: 'Resolvido' }
const ROTULOS_PRIORIDADE = { ALTA: 'Alta', MEDIA: 'Média', BAIXA: 'Baixa' }
// Esta tela monta a página Alertas.

function PaginaAlertas() {
  const [status, setStatus] = useState('todos')
  const [prioridade, setPrioridade] = useState('todas')
  const [formato, setFormato] = useState('csv')
  const [exportando, setExportando] = useState(false)
  const [erroExportacao, setErroExportacao] = useState('')
  const [resultado, setResultado] = useState({ chaveFiltro: '', alertas: [], erro: '' })
  const [atualizadoEm, setAtualizadoEm] = useState(null)
  const chaveFiltro = `${status}:${prioridade}`

  // Este efeito atualiza a tela quando necessário.

  useEffect(() => {
    let ativo = true
    const atualizar = () => {
      alertasServico
        .listar({ status, prioridade })
        .then((alertas) => {
          if (!ativo) return
          setResultado({ chaveFiltro, alertas, erro: '' })
          setAtualizadoEm(new Date())
        })
        .catch(
          (falha) =>
            ativo &&
            setResultado({ chaveFiltro, alertas: [], erro: mensagemDeErro(falha, 'Não foi possível carregar os alertas.') }),
        )
    }
    atualizar()
    const intervalo = window.setInterval(atualizar, 15_000)
    return () => {
      ativo = false
      window.clearInterval(intervalo)
    }
  }, [chaveFiltro, prioridade, status])

  const carregando = resultado.chaveFiltro !== chaveFiltro
  const alertas = carregando ? [] : resultado.alertas
  const erro = carregando ? '' : resultado.erro

  async function exportar() {
    setExportando(true)
    setErroExportacao('')
    try {
      await alertasServico.exportar({ status, prioridade, formato })
    } catch (falha) {
      setErroExportacao(mensagemDeErro(falha, 'Não foi possível exportar o relatório.'))
    } finally {
      setExportando(false)
    }
  }

  return (
    <section className="alerts-page" aria-label="Gerenciamento de alertas">
      <p className="demo-data-note">
        Dados simulados (loja de demonstração)
        {atualizadoEm && ` · Atualizado às ${atualizadoEm.toLocaleTimeString('pt-BR')}`}
      </p>
      <div className="alerts-toolbar">
        <span className="alerts-toolbar__label">Filtrar por:</span>
        <div className="alerts-filter-group" role="group" aria-label="Status">
          {FILTROS_STATUS.map((filtro) => (
            <button
              aria-pressed={status === filtro.valor}
              className="alerts-filter-button"
              key={filtro.valor}
              onClick={() => setStatus(filtro.valor)}
              type="button"
            >
              {filtro.rotulo}
            </button>
          ))}
        </div>
        <div className="alerts-filter-group alerts-filter-group--priority" role="group" aria-label="Prioridade">
          {FILTROS_PRIORIDADE.map((filtro) => (
            <button
              aria-pressed={prioridade === filtro.valor}
              className="alerts-filter-button"
              key={filtro.valor}
              onClick={() => setPrioridade(filtro.valor)}
              type="button"
            >
              {filtro.rotulo}
            </button>
          ))}
        </div>
        <select
          aria-label="Formato do relatório"
          className="alerts-export-button"
          value={formato}
          onChange={(evento) => setFormato(evento.target.value)}
        >
          {FORMATOS_EXPORTACAO.map((opcao) => (
            <option key={opcao.valor} value={opcao.valor}>
              {opcao.rotulo}
            </option>
          ))}
        </select>
        <button
          className="alerts-export-button"
          disabled={carregando || exportando || alertas.length === 0}
          onClick={exportar}
          style={{ marginLeft: 0 }}
          type="button"
        >
          {exportando ? 'Exportando...' : 'Exportar Relatório'}
        </button>
      </div>

      {erroExportacao && <Alerta variante="erro">{erroExportacao}</Alerta>}
      {erro && <Alerta variante="erro">{erro}</Alerta>}

      {!erro && (
        <div className="alerts-table-card">
          {carregando ? (
            <p className="alerts-feedback" role="status">
              Carregando alertas...
            </p>
          ) : alertas.length === 0 ? (

            <p className="alerts-feedback" role="status">
              Nenhum alerta encontrado para os filtros selecionados.
            </p>
          ) : (
            <>
              <div className="alerts-table-scroll">
                <table className="alerts-table">
                  <thead>
                    <tr>
                      <th scope="col">Status</th>
                      <th scope="col">Data / Hora</th>
                      <th scope="col">Ativo</th>
                      <th scope="col">Descrição</th>
                      <th scope="col">Prioridade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alertas.map((alerta) => (
                      <tr key={alerta.id}>
                        <td>
                          <span className={`alert-badge alert-badge--${alerta.status.toLowerCase()}`}>
                            {ROTULOS_STATUS[alerta.status] ?? alerta.status}
                          </span>
                        </td>
                        <td className="alerts-table__date">{formatarDataHora(alerta.criadoEm)}</td>
                        <td className="alerts-table__asset">
                          {alerta.ativo ? (
                            <>
                              <strong>
                                <Link to={`/ativos/${alerta.ativo.id}`}>{alerta.ativo.codigo}</Link>
                              </strong>
                              <span>
                                <Link to={`/ativos/${alerta.ativo.id}`}>{alerta.ativo.nome}</Link>
                              </span>
                            </>
                          ) : (
                            <strong>Instalação</strong>
                          )}
                        </td>
                        <td className="alerts-table__description">{alerta.descricao}</td>
                        <td>
                          <span className={`alert-badge alert-badge--${alerta.prioridade.toLowerCase()}`}>
                            {ROTULOS_PRIORIDADE[alerta.prioridade] ?? alerta.prioridade}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="alerts-result-count" aria-live="polite">
                {alertas.length} {alertas.length === 1 ? 'alerta encontrado' : 'alertas encontrados'}
              </p>
            </>
          )}
        </div>
      )}
    </section>
  )
}

export default PaginaAlertas
