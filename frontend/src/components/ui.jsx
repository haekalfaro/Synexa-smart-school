import { ChevronLeft, ChevronRight, X } from 'lucide-react';

export const pct = (n) => `${Number(n ?? 0).toFixed(1)}%`;

export const toISO = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const shiftDate = (iso, n) => {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + n);
  return toISO(d);
};

export const fmtDate = (iso, opts = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('id-ID', opts);

export const errMsg = (e) =>
  e.response?.data?.errors ? Object.values(e.response.data.errors)[0][0] : e.response?.data?.message || 'Terjadi kesalahan.';

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="page-head-actions">{children}</div>
    </div>
  );
}

export function Card({ title, action, children, className = '' }) {
  return (
    <section className={`card ${className}`}>
      {(title || action) && (
        <header className="card-head">
          <h3>{title}</h3>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function StatCard({ icon: Icon, tone = 'teal', label, value, sub }) {
  return (
    <div className={`stat stat-${tone}`}>
      <div className="stat-icon"><Icon size={26} /></div>
      <div>
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        <div className="stat-sub">{sub}</div>
      </div>
    </div>
  );
}

const BADGES = {
  hadir: ['Masuk', 'green'],
  terlambat: ['Terlambat', 'yellow'],
  tidak_hadir: ['Tidak Hadir', 'red'],
  aktif: ['Aktif', 'green'],
  tidak_aktif: ['Tidak Aktif', 'red'],
  online: ['Online', 'green'],
  offline: ['Offline', 'red'],
};

export function Badge({ status }) {
  const [text, tone] = BADGES[status] ?? [status, 'gray'];
  return <span className={`badge badge-${tone}`}>{text}</span>;
}

export function Progress({ value, color = 'var(--teal)' }) {
  return (
    <div className="progress">
      <span style={{ width: `${Math.min(value, 100)}%`, background: color }} />
    </div>
  );
}

export function Pagination({ meta, onPage }) {
  const { current_page: cur, last_page: last } = meta;
  const pages = new Set([1, last, cur - 1, cur, cur + 1]);
  const list = [...pages].filter((p) => p >= 1 && p <= last).sort((a, b) => a - b);
  return (
    <div className="pager">
      <span>
        {meta.total > 0 ? `Menampilkan ${meta.from} - ${meta.to} dari ${meta.total} data` : 'Tidak ada data'}
      </span>
      <div className="pager-btns">
        <button disabled={cur <= 1} onClick={() => onPage(cur - 1)} aria-label="Sebelumnya"><ChevronLeft size={16} /></button>
        {list.map((p, i) => (
          <span key={p} style={{ display: 'contents' }}>
            {i > 0 && p - list[i - 1] > 1 && <span className="gap">…</span>}
            <button className={p === cur ? 'on' : ''} onClick={() => onPage(p)}>{p}</button>
          </span>
        ))}
        <button disabled={cur >= last} onClick={() => onPage(cur + 1)} aria-label="Berikutnya"><ChevronRight size={16} /></button>
      </div>
    </div>
  );
}

export function Modal({ title, onClose, children }) {
  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <header>
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Tutup"><X size={18} /></button>
        </header>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
