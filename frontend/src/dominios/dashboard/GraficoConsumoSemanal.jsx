import {
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  PointElement,
  Tooltip,
  LinearScale,
  CategoryScale,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
)
// Este componente monta o gráfico ConsumoSemanal.

function GraficoConsumoSemanal({ dados }) {
  const dadosGrafico = {
    labels: dados.rotulos,
    datasets: [
      {
        label: 'Consumo Real',
        data: dados.consumoKwh,
        borderColor: '#f5a000',
        backgroundColor: 'rgba(247, 160, 0, 0.075)',
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: '#f5a000',
        pointBorderColor: '#fff',
        pointBorderWidth: 1.5,
        fill: true,
        tension: 0.12,
      },
      {
        label: 'Meta Diária',
        data: dados.metaKwh,
        borderColor: '#18b783',
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderDash: [5, 5],
        pointRadius: 0,
        pointHoverRadius: 3,
        fill: false,
        tension: 0.12,
      },
    ],
  }

  const opcoes = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index',
    },
    layout: {
      padding: {
        top: 24,
        right: 30,
        left: 0,
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#17233c',
        padding: 11,
        displayColors: true,
        usePointStyle: true,
        titleFont: {
          size: 13,
          weight: '700',
        },
        bodyFont: {
          size: 12,
        },
        callbacks: {
          label(context) {
            return ` ${context.dataset.label}: ${context.formattedValue} kWh`
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        border: {
          display: false,
        },
        ticks: {
          color: '#8391a7',
          font: {
            size: 12,
          },
          padding: 8,
        },
      },
      y: {
        beginAtZero: true,

        grace: '12%',
        border: {
          display: false,
          dash: [3, 5],
        },
        grid: {
          color: '#e8edf4',
          drawTicks: false,
        },
        ticks: {
          color: '#8391a7',
          font: {
            size: 12,
          },
          padding: 10,
          callback(value) {
            return `${value} kWh`
          },
        },
      },
    },
  }

  return (
    <section className="chart-card" aria-labelledby="weekly-chart-title">
      <div className="chart-card__header">
        <div>
          <h2 id="weekly-chart-title">Desempenho Semanal de Consumo (7 dias)</h2>
          <p>Energia consumida pela loja por dia, calculada a partir das leituras</p>
        </div>
        <div className="chart-legend" aria-hidden="true">
          <span>
            <i className="chart-legend__dot chart-legend__dot--orange" />
            Consumo Real
          </span>
          <span>
            <i className="chart-legend__dot chart-legend__dot--green" />
            Meta Diária
          </span>
        </div>
      </div>
      <div className="chart-canvas">
        <Line
          aria-label="Gráfico do consumo real e da meta diária nos últimos sete dias"
          data={dadosGrafico}
          options={opcoes}
          role="img"
        />
      </div>
      <p className="sr-only">
        {dados.rotulos
          .map((rotulo, indice) => `${rotulo}: ${dados.consumoKwh[indice] ?? 'sem dados'} kWh`)
          .join('; ')}
      </p>
    </section>
  )
}

export default GraficoConsumoSemanal
