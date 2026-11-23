import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  Tooltip,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

/**
 * Gráfico da tela Consumo Mensal: energia consumida em cada dia do mês (RF16).
 * Dias sem leitura ficam sem barra (null), não como consumo zero (RN24).
 *
 * @param {{ dados: { dias: string[], consumoKwh: (number|null)[], periodo: string } }} props
 */
function GraficoConsumoMensal({ dados }) {
  const dadosGrafico = {
    labels: dados.dias,
    datasets: [
      {
        label: 'Consumo Real',
        data: dados.consumoKwh,
        backgroundColor: '#f5a000',
        hoverBackgroundColor: '#e58d00',
        borderRadius: 3,
        borderSkipped: false,
        maxBarThickness: 12,
        categoryPercentage: 0.82,
        barPercentage: 0.78,
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
            return ` Consumo Real: ${context.formattedValue} kWh`
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
        ticks: {
          color: '#8391a7',
          autoSkip: true,
          maxTicksLimit: 20,
          maxRotation: 0,
          minRotation: 0,
          font: {
            size: 10,
            weight: '500',
          },
          padding: 5,
        },
      },
      y: {
        beginAtZero: true,
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
            size: 11,
          },
          padding: 9,
          callback(value) {
            return `${value} kWh`
          },
        },
      },
    },
  }

  const valoresAcessiveis = dados.dias
    .map((dia, indice) => `Dia ${dia}: ${dados.consumoKwh[indice] ?? 'sem dados'} kWh`)
    .join('; ')

  return (
    <section
      className="monthly-chart-card"
      aria-labelledby="monthly-chart-title"
    >
      <div className="monthly-chart-card__header">
        <div>
          <h2 id="monthly-chart-title">
            Distribuição Diária de Consumo - {dados.periodo}
          </h2>
          <p>Energia consumida pela loja em cada dia do mês</p>
        </div>
        <span className="monthly-chart-legend">
          <i className="monthly-chart-legend__dot" />
          Consumo Real
        </span>
      </div>
      <div className="monthly-chart-canvas">
        <Bar
          aria-label={`Gráfico do consumo diário durante ${dados.periodo}`}
          data={dadosGrafico}
          options={opcoes}
          role="img"
        />
      </div>
      <p className="sr-only">{valoresAcessiveis}</p>
    </section>
  )
}

export default GraficoConsumoMensal
