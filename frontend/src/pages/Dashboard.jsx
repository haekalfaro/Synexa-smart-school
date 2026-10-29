import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CircleCheck, Clock3, UserX, Users } from 'lucide-react';
import api from '../api';
import { BarChart, C, LineChart } from '../components/Charts';
import { Badge, Card, PageHeader, Progress, StatCard, fmtDate, pct } from '../components/ui';

export default function Dashboard() {
  const [d, setD] = useState(null);

  useEffect(() => {
    const load = () => api.get('/dashboard').then((r) => setD(r.data));
    load();
    const t = setInterval(load, 15000); // data scan masuk otomatis
    return () => clearInterval(t);
  }, []);
  if (!d) return <p>Memuat…</p>;

  const s = d.summary;
  const m = d.monthly;

  return (
    <>
      <PageHeader title="Dashboard" subtitle={`Ringkasan aktivitas dan kondisi sekolah · ${fmtDate(d.tanggal)}`} />

      <div className="stats">
        <StatCard icon={Users} label="Total Siswa" value={s.total} sub="100%" />
        <StatCard icon={CircleCheck} tone="green" label="Hadir" value={s.hadir} sub={pct(s.persen_hadir)} />
        <StatCard icon={Clock3} tone="yellow" label="Terlambat" value={s.terlambat} sub={pct(s.persen_terlambat)} />
        <StatCard icon={UserX} tone="red" label="Tidak Hadir" value={s.tidak_hadir} sub={pct(s.persen_tidak_hadir)} />
      </div>

      <div className="grid g-3-2">
        <Card title="Grafik Kehadiran Hari Ini">
          <BarChart
            labels={d.hourly.labels}
            datasets={[
              { label: 'Hadir', data: d.hourly.hadir, backgroundColor: C.teal },
              { label: 'Terlambat', data: d.hourly.terlambat, backgroundColor: C.yellow },
            ]}
          />
        </Card>
        <Card title="Kehadiran per Kelas" action={<Link to="/kehadiran" className="link">Lihat Semua</Link>}>
          <table className="tbl compact">
            <thead><tr><th>Kelas</th><th>Hadir</th><th>Terlambat</th><th>Tidak</th><th>Total</th><th colSpan={2}>Persentase</th></tr></thead>
            <tbody>
              {d.per_kelas.map((k) => (
                <tr key={k.kelas}>
                  <td>{k.kelas}</td><td>{k.hadir}</td><td>{k.terlambat}</td><td>{k.tidak_hadir}</td><td>{k.total}</td>
                  <td>{pct(k.persen)}</td><td style={{ width: 90 }}><Progress value={k.persen} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <div className="grid g-1-1">
        <Card title="Aktivitas Kehadiran Terbaru" action={<Link to="/kehadiran" className="link">Lihat Semua</Link>}>
          <table className="tbl">
            <thead><tr><th>Waktu</th><th>Nama Siswa</th><th>Kelas</th><th>Status</th><th>Gerbang</th></tr></thead>
            <tbody>
              {d.recent.length === 0 && <tr><td colSpan={5} className="empty">Belum ada aktivitas hari ini.</td></tr>}
              {d.recent.map((r, i) => (
                <tr key={i}>
                  <td>{r.waktu}</td><td><b>{r.nama}</b></td><td>{r.kelas}</td>
                  <td><Badge status={r.status} /></td><td>{r.gerbang ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card title="Status Perangkat Gerbang" action={<Link to="/perangkat" className="link">Lihat Detail</Link>}>
          <table className="tbl compact">
            <thead><tr><th>Nama Perangkat</th><th>Lokasi</th><th>Status</th><th>Terakhir Online</th></tr></thead>
            <tbody>
              {d.devices.length === 0 && (
                <tr><td colSpan={4} className="empty">Belum ada scanner yang terhubung. Buka web scanner untuk menampilkannya di sini.</td></tr>
              )}
              {d.devices.map((v) => (
                <tr key={v.id}>
                  <td><b>{v.nama}</b>{v.status === 'online' && !v.kamera && <div className="muted" style={{ margin: 0 }}>Kamera belum aktif</div>}</td>
                  <td>{v.gerbang ?? '-'}</td>
                  <td><Badge status={v.status} /></td>
                  <td>{v.terakhir_online}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="muted">CCTV dan perangkat lain sedang dikembangkan.</p>
        </Card>
      </div>

      <div className="grid g-3-2-2">
        <Card title="Ringkasan Mingguan">
          <LineChart
            labels={d.trend.map((t) => t.label)}
            datasets={[
              { label: 'Hadir', data: d.trend.map((t) => t.hadir), borderColor: C.teal, fill: true },
              { label: 'Terlambat', data: d.trend.map((t) => t.terlambat), borderColor: C.yellow },
              { label: 'Tidak Hadir', data: d.trend.map((t) => t.tidak_hadir), borderColor: C.purple },
            ]}
          />
        </Card>
        <Card title={`Rekap Bulanan · ${m.bulan}`}>
          {[
            ['Hadir', m.persen_hadir, C.teal],
            ['Terlambat', m.persen_terlambat, C.yellow],
            ['Tidak Hadir', m.persen_tidak_hadir, C.purple],
          ].map(([l, v, c]) => (
            <div className="recap" key={l}>
              <div><span>{l}</span><b>{pct(v)}</b></div>
              <Progress value={v} color={c} />
            </div>
          ))}
        </Card>
        <Card title="Informasi Sekolah">
          <dl className="info">
            <dt>Nama Sekolah</dt><dd>{d.school.nama}</dd>
            <dt>Tahun Ajaran</dt><dd>{d.school.tahun_ajaran}</dd>
            <dt>Siswa Aktif</dt><dd>{d.school.siswa_aktif} siswa</dd>
            <dt>Guru & Staff</dt><dd>{d.school.guru_staff} orang</dd>
          </dl>
        </Card>
      </div>
    </>
  );
}
