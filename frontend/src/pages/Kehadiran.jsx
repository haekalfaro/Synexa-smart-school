import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, CircleCheck, Clock3, Plus, RotateCcw, Search, UserX, Users } from 'lucide-react';
import api from '../api';
import { useAuth } from '../auth';
import { C, Donut, Legend2, LineChart } from '../components/Charts';
import { Badge, Card, Field, Modal, PageHeader, Pagination, Progress, StatCard, errMsg, fmtDate, pct, shiftDate, toISO } from '../components/ui';
import { useDebounced, useList } from '../hooks';

export default function Kehadiran() {
  const { canWrite } = useAuth();
  const [date, setDate] = useState(toISO(new Date()));
  const [search, setSearch] = useState('');
  const [kelasId, setKelasId] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [kelas, setKelas] = useState([]);
  const [sum, setSum] = useState(null);
  const [modal, setModal] = useState(false);
  const q = useDebounced(search);

  const list = useList('/kehadiran', { date, search: q, kelas_id: kelasId, status, page });

  const loadSummary = () => api.get('/kehadiran/summary', { params: { date } }).then((r) => setSum(r.data));
  useEffect(() => { api.get('/kelas').then((r) => setKelas(r.data)); }, []);
  useEffect(() => { loadSummary(); }, [date]); // eslint-disable-line
  useEffect(() => { setPage(1); }, [date, q, kelasId, status]);
  useEffect(() => {
    const t = setInterval(() => { list.reload(); loadSummary(); }, 15000); // data scan masuk otomatis
    return () => clearInterval(t);
  }, [list.reload, date]); // eslint-disable-line

  const reset = () => { setSearch(''); setKelasId(''); setStatus(''); };
  const s = sum?.summary;

  return (
    <>
      <PageHeader title="Kehadiran" subtitle="Monitoring kehadiran siswa">
        <div className="date-nav">
          <button onClick={() => setDate(shiftDate(date, -1))} aria-label="Hari sebelumnya"><ChevronLeft size={16} /></button>
          <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
          <button onClick={() => setDate(shiftDate(date, 1))} aria-label="Hari berikutnya"><ChevronRight size={16} /></button>
        </div>
        {canWrite && <button className="btn" onClick={() => setModal(true)}><Plus size={16} /> Tambah Data</button>}
      </PageHeader>

      {s && (
        <div className="stats">
          <StatCard icon={Users} label="Total Siswa" value={s.total} sub="100%" />
          <StatCard icon={CircleCheck} tone="green" label="Hadir" value={s.hadir} sub={pct(s.persen_hadir)} />
          <StatCard icon={Clock3} tone="yellow" label="Terlambat" value={s.terlambat} sub={pct(s.persen_terlambat)} />
          <StatCard icon={UserX} tone="red" label="Tidak Hadir" value={s.tidak_hadir} sub={pct(s.persen_tidak_hadir)} />
        </div>
      )}

      <div className="grid g-3-2">
        <Card title="Daftar Kehadiran Siswa">
          <div className="filters">
            <div className="search"><Search size={15} /><input placeholder="Cari nama siswa atau NIS..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
            <select value={kelasId} onChange={(e) => setKelasId(e.target.value)}>
              <option value="">Semua kelas</option>
              {kelas.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Semua status</option>
              <option value="hadir">Masuk</option>
              <option value="terlambat">Terlambat</option>
              <option value="tidak_hadir">Tidak Hadir</option>
            </select>
            <button className="btn btn-ghost" onClick={reset}><RotateCcw size={14} /> Reset</button>
          </div>
          <table className="tbl">
            <thead><tr><th>No</th><th>Nama Siswa</th><th>NIS</th><th>Kelas</th><th>Waktu Masuk</th><th>Status</th><th>Gerbang</th></tr></thead>
            <tbody>
              {!list.loading && list.data.length === 0 && <tr><td colSpan={7} className="empty">Tidak ada siswa yang cocok dengan filter.</td></tr>}
              {list.data.map((r, i) => (
                <tr key={r.siswa_id}>
                  <td>{list.from + i}</td><td><b>{r.nama}</b></td><td>{r.nis}</td><td>{r.kelas}</td>
                  <td>{r.waktu_masuk ?? '-'}</td><td><Badge status={r.status} /></td><td>{r.gerbang ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination meta={list} onPage={setPage} />
        </Card>

        <div className="stack">
          {s && (
            <Card title="Rekap Kehadiran">
              <div className="donut-row">
                <Donut labels={['Hadir', 'Terlambat', 'Tidak Hadir']} values={[s.hadir, s.terlambat, s.tidak_hadir]} colors={[C.teal, C.yellow, C.purple]} center={s.total} sub="Total Siswa" />
                <Legend2 items={[
                  { label: 'Hadir', color: C.teal, value: s.hadir, pct: pct(s.persen_hadir) },
                  { label: 'Terlambat', color: C.yellow, value: s.terlambat, pct: pct(s.persen_terlambat) },
                  { label: 'Tidak Hadir', color: C.purple, value: s.tidak_hadir, pct: pct(s.persen_tidak_hadir) },
                ]} />
              </div>
              <p className="muted">{fmtDate(date)}</p>
            </Card>
          )}
          {sum && (
            <Card title="Kehadiran per Kelas">
              <table className="tbl compact">
                <thead><tr><th>Kelas</th><th>Hadir</th><th>Terlambat</th><th>Tidak</th><th>Total</th><th colSpan={2}>%</th></tr></thead>
                <tbody>
                  {sum.per_kelas.map((k) => (
                    <tr key={k.kelas}><td>{k.kelas}</td><td>{k.hadir}</td><td>{k.terlambat}</td><td>{k.tidak_hadir}</td><td>{k.total}</td><td>{pct(k.persen)}</td><td style={{ width: 70 }}><Progress value={k.persen} /></td></tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      </div>

      {sum && (
        <Card title="Tren Kehadiran">
          <LineChart
            labels={sum.trend.map((t) => t.label)}
            datasets={[
              { label: 'Hadir', data: sum.trend.map((t) => t.hadir), borderColor: C.teal, fill: true },
              { label: 'Terlambat', data: sum.trend.map((t) => t.terlambat), borderColor: C.yellow },
              { label: 'Tidak Hadir', data: sum.trend.map((t) => t.tidak_hadir), borderColor: C.purple },
            ]}
          />
        </Card>
      )}

      {modal && <AttendanceModal date={date} onClose={() => setModal(false)} onSaved={() => { setModal(false); list.reload(); loadSummary(); }} />}
    </>
  );
}

function AttendanceModal({ date, onClose, onSaved }) {
  const [siswa, setSiswa] = useState([]);
  const [form, setForm] = useState({ siswa_id: '', tanggal: date, status: 'hadir', waktu_masuk: '07:00', gerbang: 'Gerbang Utama' });
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  useEffect(() => {
    api.get('/siswa', { params: { status: 'aktif', per_page: 1000 } }).then((r) => setSiswa(r.data.data));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/kehadiran', { ...form, waktu_masuk: form.status === 'tidak_hadir' ? null : form.waktu_masuk });
      onSaved();
    } catch (err) { setError(errMsg(err)); }
  };

  return (
    <Modal title="Tambah Data Kehadiran" onClose={onClose}>
      <form onSubmit={submit} className="form">
        <Field label="Siswa">
          <select value={form.siswa_id} onChange={set('siswa_id')} required>
            <option value="">Pilih siswa…</option>
            {siswa.map((s) => <option key={s.id} value={s.id}>{s.nama} ({s.kelas.nama} · {s.nis})</option>)}
          </select>
        </Field>
        <Field label="Tanggal"><input type="date" value={form.tanggal} onChange={set('tanggal')} required /></Field>
        <Field label="Status">
          <select value={form.status} onChange={set('status')}>
            <option value="hadir">Masuk</option><option value="terlambat">Terlambat</option><option value="tidak_hadir">Tidak Hadir</option>
          </select>
        </Field>
        {form.status !== 'tidak_hadir' && (
          <>
            <Field label="Waktu masuk"><input type="time" value={form.waktu_masuk} onChange={set('waktu_masuk')} required /></Field>
            <Field label="Gerbang"><input value={form.gerbang} onChange={set('gerbang')} /></Field>
          </>
        )}
        {error && <p className="form-error">{error}</p>}
        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Batal</button>
          <button className="btn">Simpan</button>
        </div>
      </form>
    </Modal>
  );
}
