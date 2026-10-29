import { Link } from 'react-router-dom';
import { Hammer } from 'lucide-react';
import { PageHeader } from '../components/ui';

export default function ComingSoon({ icon: Icon, title, desc, features = [] }) {
  return (
    <>
      <PageHeader title={title} subtitle="Fitur sedang dikembangkan" />
      <section className="card soon">
        <div className="soon-icon"><Icon size={44} /></div>
        <span className="badge badge-yellow"><Hammer size={12} style={{ marginRight: 4 }} />Sedang dikembangkan</span>
        <h2>{title} belum tersedia</h2>
        <p>{desc}</p>
        <Link to="/" className="btn">Kembali ke Dashboard</Link>
      </section>
      {features.length > 0 && (
        <>
          <h3 className="soon-sub">Yang akan hadir</h3>
          <div className="soon-grid">
            {features.map(([t, d]) => (
              <div className="card" key={t}>
                <h4>{t}</h4>
                <p>{d}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
