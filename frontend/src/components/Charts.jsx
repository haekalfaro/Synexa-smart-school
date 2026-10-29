import {
  ArcElement, BarElement, CategoryScale, Chart as ChartJS, Filler, Legend,
  LinearScale, LineElement, PointElement, Tooltip,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(ArcElement, BarElement, CategoryScale, Filler, Legend, LinearScale, LineElement, PointElement, Tooltip);

export const C = { teal: '#00c4b4', yellow: '#fbbf24', purple: '#8b5cf6', red: '#f43f5e', blue: '#38bdf8' };

const axes = {
  x: { grid: { display: false }, ticks: { color: '#64748b' } },
  y: { beginAtZero: true, grid: { color: '#e8eef5' }, ticks: { color: '#64748b' } },
};
const legend = { display: true, position: 'top', align: 'end', labels: { usePointStyle: true, boxWidth: 8, color: '#334155' } };

export function BarChart({ labels, datasets, height = 220 }) {
  const data = { labels, datasets: datasets.map((d) => ({ borderRadius: 4, barPercentage: 0.7, ...d })) };
  return (
    <div style={{ height }}>
      <Bar data={data} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend }, scales: axes }} />
    </div>
  );
}

export function LineChart({ labels, datasets, height = 220 }) {
  const data = {
    labels,
    datasets: datasets.map((d) => ({
      tension: 0.35, pointRadius: 3, borderWidth: 2,
      fill: d.fill ?? false, backgroundColor: d.fill ? `${d.borderColor}22` : undefined, ...d,
    })),
  };
  return (
    <div style={{ height }}>
      <Line data={data} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend }, scales: axes }} />
    </div>
  );
}

export function Donut({ labels, values, colors, center, sub = 'Total', size = 150 }) {
  const data = { labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 0 }] };
  return (
    <div className="donut" style={{ width: size, height: size }}>
      <Doughnut data={data} options={{ cutout: '70%', plugins: { legend: { display: false } }, maintainAspectRatio: false }} />
      <div className="donut-center">
        <strong>{center}</strong>
        <small>{sub}</small>
      </div>
    </div>
  );
}

export function Legend2({ items }) {
  return (
    <ul className="legend2">
      {items.map((i) => (
        <li key={i.label}>
          <i style={{ background: i.color }} />
          <span>{i.label}</span>
          <b>{i.value}</b>
          <em>{i.pct}</em>
        </li>
      ))}
    </ul>
  );
}
