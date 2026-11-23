/**
 * Ícones SVG usados no painel. Uso: <Icone nome="sol" tamanho={18} />
 * Nomes disponíveis: painel, calendario, alerta, atividade, busca, sol,
 * bateria, moeda, setaCima, setaBaixo, fechar, folha.
 */
function Icone({ nome, tamanho = 20 }) {
  const propriedadesSvg = {
    width: tamanho,
    height: tamanho,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }

  const desenhos = {
    painel: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
    calendario: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),
    alerta: (
      <>
        <path d="m10.3 4.3-7 12.1A2 2 0 005 19.5h14a2 2 0 001.7-3.1l-7-12.1a2 2 0 00-3.4 0z" />
        <path d="M12 9v4m0 3h.01" />
      </>
    ),
    atividade: (
      <>
        <path d="M3 12h4l3-8 4 16 3-8h4" />
      </>
    ),
    busca: (
      <>
        <circle cx="10.8" cy="10.8" r="6.8" />
        <path d="m16 16 4.5 4.5" />
      </>
    ),
    sol: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
      </>
    ),
    bateria: (
      <>
        <rect x="3" y="7" width="17" height="10" rx="2" />
        <path d="M23 10v4M7 10v4" />
      </>
    ),
    moeda: (
      <>
        <path d="M12 2v20m5-15H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </>
    ),
    setaCima: <path d="m5 15 6-6 4 4 5-7m0 0h-5m5 0v5" />,
    setaBaixo: <path d="m5 9 6 6 4-4 5 7m0 0h-5m5 0v-5" />,
    fechar: <path d="m18 6-12 12M6 6l12 12" />,
    folha: (
      <>
        <path d="M20 4c-8 0-14 3-14 10a6 6 0 006 6c7 0 8-8 8-16z" />
        <path d="M4 21c3-5 7-8 12-11" />
      </>
    ),
  }

  return <svg {...propriedadesSvg}>{desenhos[nome] || desenhos.atividade}</svg>
}

export default Icone
