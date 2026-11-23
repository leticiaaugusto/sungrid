import { useEffect, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import Alerta from '../../compartilhado/componentes/Alerta.jsx'
import { obterUsuario } from '../../compartilhado/sessao/sessao.js'
import { formatarKw, mensagemDeErro } from '../../compartilhado/utilitarios/formatacao.js'
import { ativosServico } from './ativosServico.js'

const TIPOS = ['Todos', 'Painel', 'Inversor', 'Medidor', 'Bateria', 'Sensor']
const STATUS = ['OPERANDO', 'ALERTA', 'OFFLINE', 'MANUTENCAO']

const ROTULOS_STATUS = {
  OPERANDO: 'Operando',
  ALERTA: 'Em alerta',
  OFFLINE: 'Offline',
  MANUTENCAO: 'Em manutenção',
}

const ativoInicial = {
  codigo: '',
  nome: '',
  tipo: 'PAINEL',
  fabricante: '',
  status: 'OPERANDO',
  instaladoEm: '',
  proximaManutencaoH: '',
  faixaOperacao: {
    temperaturaMaxC: '',
    tensaoNominalV: '',
    toleranciaTensaoPct: '',
    correnteMaxA: '',
    eficienciaMinPct: '',
  },
}

/** Lista de ativos com polling, filtro por tipo e cadastro exclusivo para administradores. */
function PaginaListaAtivos() {
  const [parametros] = useSearchParams()
  const legado = parametros.get('ativo')
  const [ativos, setAtivos] = useState([])
  const [erro, setErro] = useState('')
  const [tipo, setTipo] = useState('Todos')
  const [atualizadoEm, setAtualizadoEm] = useState(null)
  const [formularioAberto, setFormularioAberto] = useState(false)
  const [editando, setEditando] = useState(null)
  const [formulario, setFormulario] = useState(ativoInicial)
  const usuario = obterUsuario()
  const administrador = usuario?.papel === 'ADMINISTRADOR'

  useEffect(() => {
    let ativo = true
    const atualizar = () =>
      ativosServico
        .listar()
        .then((lista) => {
          if (!ativo) return
          setAtivos(lista)
          setAtualizadoEm(new Date())
          setErro('')
        })
        .catch((falha) => ativo && setErro(mensagemDeErro(falha, 'Não foi possível carregar os ativos.')))
    atualizar()
    const intervalo = window.setInterval(atualizar, 5_000)
    return () => {
      ativo = false
      window.clearInterval(intervalo)
    }
  }, [])

  if (legado) return <Navigate to={`/ativos/${legado}`} replace />

  function abrirNovo() {
    setEditando(null)
    setFormulario(ativoInicial)
    setFormularioAberto(true)
  }

  function abrirEdicao(ativo) {
    setEditando(ativo)
    setFormulario({
      codigo: ativo.codigo,
      nome: ativo.nome,
      tipo: ativo.tipo,
      fabricante: ativo.fabricante ?? '',
      status: ativo.status,
      instaladoEm: ativo.instaladoEm ?? '',
      proximaManutencaoH: ativo.proximaManutencaoH ?? '',
      faixaOperacao: {
        temperaturaMaxC: ativo.faixaOperacao?.temperaturaMaxC ?? '',
        tensaoNominalV: ativo.faixaOperacao?.tensaoNominalV ?? '',
        toleranciaTensaoPct: ativo.faixaOperacao?.toleranciaTensaoPct ?? '',
        correnteMaxA: ativo.faixaOperacao?.correnteMaxA ?? '',
        eficienciaMinPct: ativo.faixaOperacao?.eficienciaMinPct ?? '',
      },
    })
    setFormularioAberto(true)
  }

  function alterar(campo, valor) {
    setFormulario((atual) => ({ ...atual, [campo]: valor }))
  }

  function alterarFaixa(campo, valor) {
    setFormulario((atual) => ({
      ...atual,
      faixaOperacao: { ...atual.faixaOperacao, [campo]: valor },
    }))
  }

  async function salvar(evento) {
    evento.preventDefault()
    setErro('')
    try {
      if (editando) await ativosServico.editar(editando.id, formulario)
      else await ativosServico.criar(formulario)
      setFormularioAberto(false)
      setAtivos(await ativosServico.listar())
      setAtualizadoEm(new Date())
    } catch (falha) {
      setErro(mensagemDeErro(falha, 'Não foi possível salvar o ativo.'))
    }
  }

  const filtrados = tipo === 'Todos'
    ? ativos
    : ativos.filter((ativo) => ativo.tipo === tipo.toUpperCase())

  return (
    <section className="assets-page" aria-label="Lista de ativos">
      <div className="assets-toolbar">
        <p className="demo-data-note">
          Dados simulados (loja de demonstração)
          {atualizadoEm && ` · Atualizado às ${atualizadoEm.toLocaleTimeString('pt-BR')}`}
        </p>
        {administrador && (
          <button className="asset-action-button asset-action-button--primary" type="button" onClick={abrirNovo}>
            Novo ativo
          </button>
        )}
      </div>

      <div className="assets-filter" role="group" aria-label="Filtrar ativos por tipo">
        {TIPOS.map((item) => (
          <button
            className="alerts-filter-button"
            aria-pressed={tipo === item}
            key={item}
            type="button"
            onClick={() => setTipo(item)}
          >
            {item}
          </button>
        ))}
      </div>

      {erro && <Alerta variante="erro">{erro}</Alerta>}
      <div className="alerts-table-card">
        <div className="alerts-table-scroll">
          <table className="assets-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nome</th>
                <th>Tipo</th>
                <th>Fabricante</th>
                <th>Status</th>
                <th>Potência atual</th>
                <th>Há</th>
                {administrador && <th>Ações</th>}
              </tr>
            </thead>
            <tbody>
              {filtrados.map((ativo) => (
                <tr key={ativo.id}>
                  <td><Link to={`/ativos/${ativo.id}`}><strong>{ativo.codigo}</strong></Link></td>
                  <td><Link to={`/ativos/${ativo.id}`}>{ativo.nome}</Link></td>
                  <td>{ativo.tipo}</td>
                  <td>{ativo.fabricante || '—'}</td>
                  <td>
                    <span className={`asset-status asset-status--${ativo.status.toLowerCase()}`}>
                      {ROTULOS_STATUS[ativo.status] ?? ativo.status}
                    </span>
                  </td>
                  <td>{ativo.potenciaAtualKw === null ? '—' : formatarKw(ativo.potenciaAtualKw)}</td>
                  <td>{ativo.segundosDesdeAtualizacao === null ? '—' : `${ativo.segundosDesdeAtualizacao} s`}</td>
                  {administrador && (
                    <td><button className="assets-edit-button" type="button" onClick={() => abrirEdicao(ativo)}>Editar</button></td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtrados.length === 0 && <p className="alerts-feedback">Nenhum ativo encontrado.</p>}
      </div>

      {formularioAberto && (
        <div className="asset-modal" role="dialog" aria-modal="true" aria-label={editando ? 'Editar ativo' : 'Novo ativo'}>
          <form className="asset-modal__card" onSubmit={salvar}>
            <h2>{editando ? 'Editar ativo' : 'Novo ativo'}</h2>
            <div className="asset-form-grid">
              <label>Código<input value={formulario.codigo} onChange={(e) => alterar('codigo', e.target.value)} required /></label>
              <label>Nome<input value={formulario.nome} onChange={(e) => alterar('nome', e.target.value)} required /></label>
              <label>Tipo<select value={formulario.tipo} onChange={(e) => alterar('tipo', e.target.value)}>{['PAINEL','INVERSOR','MEDIDOR','BATERIA','SENSOR'].map((item) => <option key={item}>{item}</option>)}</select></label>
              <label>Fabricante<input value={formulario.fabricante} onChange={(e) => alterar('fabricante', e.target.value)} /></label>
              <label>Status<select value={formulario.status} onChange={(e) => alterar('status', e.target.value)}>{STATUS.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label>Instalado em<input type="date" value={formulario.instaladoEm} onChange={(e) => alterar('instaladoEm', e.target.value)} /></label>
              <label>Próxima manutenção em h<input type="number" value={formulario.proximaManutencaoH} onChange={(e) => alterar('proximaManutencaoH', e.target.value)} /></label>
              <label>Temperatura máx. °C<input type="number" value={formulario.faixaOperacao.temperaturaMaxC} onChange={(e) => alterarFaixa('temperaturaMaxC', e.target.value)} /></label>
              <label>Tensão nominal (V)<input type="number" value={formulario.faixaOperacao.tensaoNominalV} onChange={(e) => alterarFaixa('tensaoNominalV', e.target.value)} /></label>
              <label>Tolerância (%)<input type="number" value={formulario.faixaOperacao.toleranciaTensaoPct} onChange={(e) => alterarFaixa('toleranciaTensaoPct', e.target.value)} /></label>
              <label>Corrente máx. (A)<input type="number" value={formulario.faixaOperacao.correnteMaxA} onChange={(e) => alterarFaixa('correnteMaxA', e.target.value)} /></label>
              <label>Eficiência mín. (%)<input type="number" value={formulario.faixaOperacao.eficienciaMinPct} onChange={(e) => alterarFaixa('eficienciaMinPct', e.target.value)} /></label>
            </div>
            <div className="asset-modal__actions">
              <button className="asset-action-button asset-action-button--secondary" type="button" onClick={() => setFormularioAberto(false)}>Cancelar</button>
              <button className="asset-action-button asset-action-button--primary" type="submit">Salvar</button>
            </div>
          </form>
        </div>
      )}
    </section>
  )
}

export default PaginaListaAtivos
