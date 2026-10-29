import { useEffect, useState } from 'react';
import { GraduationCap, Layers, Pencil, Plus, RotateCcw, ScanBarcode, Search, Trash2, UserMinus, Users } from 'lucide-react';
import api from '../api';
import { useAuth } from '../auth';
import { BarcodeModal } from '../components/Barcode';
import { C, Donut, Legend2 } from '../components/Charts';
import { Badge, Card, Field, Modal, PageHeader, Pagination, Progress, StatCard, errMsg, pct } from '../components/ui';
import { useDebounced, useList } from '../hooks';

const EMPTY = { nis: '', nama: '', kelas_id: '', jenis_kelamin: 'L', status: 'aktif', kontak_orang_tua: '' };
const JENJANG_COLORS = [C.teal, C.yellow, C.purple];

export default function Siswa() {
  const { canWrite } = useAuth();
  const [search, setSearch] = useState('');
  const [kelasId, setKelasId] = useState('');
  const [jenjang, setJenjang] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [kelas, setKelas] = useState([]);
  const [stats, setStats] = useState(null);
  const [modal, setModal] = useState(null); // null | {data}
  const [card, setCard] = useState(null); // siswa yang barcode-nya sedang ditampilkan
  const q = useDebounced(search);

  const list = useList('/siswa', { search: q, kelas_id: kelasId, jenjang, status, page });
  const loadStats = () => api.get('/siswa/stats').then((r) => setStats(r.data));

  useEffect(() => { api.get('/kelas').then((r) => setKelas(r.data)); loadStats(); }, []);
  useEffect(() => { setPage(1); }, [q, kelasId, jenjang, status]);

  const reset = () => { setSearch(''); setKelasId(''); setJenjang(''); setStatus(''); };
  const refresh = () => { list.reload(); loadStats(); };

  const remove = async (s) => {
    if (!confirm(`Hapus siswa ${s.nama}? Data kehadirannya juga ikut terhapus.`)) return;
    try { await api.delete(`/siswa/${s.id}`); refresh(); } catch (e) { alert(errMsg(e)); }
  };

  return (
    <>
      <PageHeader title="Siswa" subtitle="Data dan informasi siswa">
        {canWrite && <button className="btn" onClick={() => setModal({ data: EMPTY })}><Plus size={16} /> Tambah Siswa</button>}
      </PageHeader>

      {stats && (
        <div className="stats">
          <StatCard icon={Users} label="Total Siswa" value={stats.total} sub="100%" />
          <StatCard icon={GraduationCap} tone="green" label="Siswa Aktif" value={stats.aktif} sub={pct(stats.total ? (stats.aktif / stats.total) * 100 : 0)} />
          <StatCard icon={UserMinus} tone="yellow" label="Siswa Non-Aktif" value={stats.tidak_aktif} sub={pct(stats.total ? (stats.tidak_aktif / stats.total) * 100 : 0)} />
          <StatCard icon={Layers} tone="purple" label="Jumlah Kelas" value={stats.jumlah_kelas} sub={`${stats.per_jenjang.length} jenjang`} />
        </div>
      )}

      <div className="grid g-3-2">
        <Card title="Daftar Siswa">
          <div className="filters">
            <div className="search"><Search size={15} /><input placeholder="Cari nama siswa atau NIS..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
            <select value={kelasId} onChange={(e) => setKelasId(e.target.value)}>
              <option value="">Semua kelas</option>
              {kelas.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
            </select>
            <select value={jenjang} onChange={(e) => setJenjang(e.target.value)}>
              <option value="">Semua jenjang</option>
              {[7, 8, 9].map((j) => <option key={j} value={j}>Kelas {j}</option>)}
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Semua status</option>
              <option value="aktif">Aktif</option>
              <option value="tidak_aktif">Tidak Aktif</option>
            </select>
            <button className="btn btn-ghost" onClick={reset}><RotateCcw size={14} /> Reset</button>
          </div>
          <table className="tbl">
            <thead><tr><th>No</th><th>NIS</th><th>Nama Siswa</th><th>Kelas</th><th>Jenis Kelamin</th><th>Status</th><th>Kontak Orang Tua</th><th>Barcode</th>{canWrite && <th>Aksi</th>}</tr></thead>
            <tbody>
              {!list.loading && list.data.length === 0 && <tr><td colSpan={9} className="empty">Belum ada siswa. Klik Tambah Siswa untuk mendaftarkan.</td></tr>}
              {list.data.map((s, i) => (
                <tr key={s.id}>
                  <td>{list.from + i}</td><td>{s.nis}</td><td><b>{s.nama}</b></td><td>{s.kelas.nama}</td>
                  <td>{s.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</td><td><Badge status={s.status} /></td><td>{s.kontak_orang_tua ?? '-'}</td>
                  <td><button className="icon-btn" onClick={() => setCard(s)} title={s.barcode ?? ''} aria-label="Lihat barcode"><ScanBarcode size={17} /></button></td>
                  {canWrite && (
                    <td className="actions">
                      <button className="icon-btn" onClick={() => setModal({ data: { ...s, kontak_orang_tua: s.kontak_orang_tua ?? '' } })} aria-label="Ubah"><Pencil size={15} /></button>
                      <button className="icon-btn danger" onClick={() => remove(s)} aria-label="Hapus"><Trash2 size={15} /></button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination meta={list} onPage={setPage} />
        </Card>

        {stats && (
          <div className="stack">
            <Card title="Distribusi Siswa per Jenjang">
              <div className="donut-row">
                <Donut labels={stats.per_jenjang.map((j) => `Kelas ${j.jenjang}`)} values={stats.per_jenjang.map((j) => j.total)} colors={JENJANG_COLORS} center={stats.total} sub="Total Siswa" />
                <Legend2 items={stats.per_jenjang.map((j, i) => ({ label: `Kelas ${j.jenjang}`, color: JENJANG_COLORS[i], value: j.total, pct: pct(stats.total ? (j.total / stats.total) * 100 : 0) }))} />
              </div>
            </Card>
            <Card title="Rekap Siswa per Kelas">
              <table className="tbl compact">
                <thead><tr><th>Kelas</th><th>Jumlah</th><th>L</th><th>P</th><th colSpan={2}>%</th></tr></thead>
                <tbody>
                  {stats.per_kelas.map((k) => {
                    const p = stats.total ? (k.total / stats.total) * 100 : 0;
                    return <tr key={k.id}><td>{k.nama}</td><td>{k.total}</td><td>{k.laki}</td><td>{k.perempuan}</td><td>{pct(p)}</td><td style={{ width: 70 }}><Progress value={p * 5} /></td></tr>;
                  })}
                </tbody>
              </table>
            </Card>
            <Card title="Status Siswa">
              <div className="donut-row">
                <Donut labels={['Aktif', 'Non-Aktif']} values={[stats.aktif, stats.tidak_aktif]} colors={[C.teal, C.red]} center={stats.total} sub="Total Siswa" size={120} />
                <Legend2 items={[
                  { label: 'Aktif', color: C.teal, value: stats.aktif, pct: pct(stats.total ? (stats.aktif / stats.total) * 100 : 0) },
                  { label: 'Non-Aktif', color: C.red, value: stats.tidak_aktif, pct: pct(stats.total ? (stats.tidak_aktif / stats.total) * 100 : 0) },
                ]} />
              </div>
            </Card>
          </div>
        )}
      </div>

      {modal && <SiswaModal initial={modal.data} kelas={kelas} onClose={() => setModal(null)} onSaved={(created) => { setModal(null); refresh(); if (created) setCard(created); }} />}
      {card && <BarcodeModal siswa={card} onClose={() => setCard(null)} />}
    </>
  );
}

function SiswaModal({ initial, kelas, onClose, onSaved }) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const editing = !!initial.id;

  const submit = async (e) => {
    e.preventDefault();
    try {
      const body = { nis: form.nis, nama: form.nama, kelas_id: form.kelas_id, jenis_kelamin: form.jenis_kelamin, status: form.status, kontak_orang_tua: form.kontak_orang_tua || null };
      const res = editing ? await api.put(`/siswa/${initial.id}`, body) : await api.post('/siswa', body);
      onSaved(editing ? null : res.data);
    } catch (err) { setError(errMsg(err)); }
  };

  return (
    <Modal title={editing ? 'Ubah Siswa' : 'Tambah Siswa'} onClose={onClose}>
      <form onSubmit={submit} className="form">
        <Field label="NIS"><input value={form.nis} onChange={set('nis')} required /></Field>
        <Field label="Nama siswa"><input value={form.nama} onChange={set('nama')} required /></Field>
        <Field label="Kelas">
          <select value={form.kelas_id} onChange={set('kelas_id')} required>
            <option value="">Pilih kelas…</option>
            {kelas.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
          </select>
        </Field>
        <Field label="Jenis kelamin">
          <select value={form.jenis_kelamin} onChange={set('jenis_kelamin')}><option value="L">Laki-laki</option><option value="P">Perempuan</option></select>
        </Field>
        <Field label="Status">
          <select value={form.status} onChange={set('status')}><option value="aktif">Aktif</option><option value="tidak_aktif">Tidak Aktif</option></select>
        </Field>
        <Field label="Kontak orang tua"><input value={form.kontak_orang_tua} onChange={set('kontak_orang_tua')} placeholder="08xx xxxx xxxx" /></Field>
        {!editing && <p className="muted">Barcode unik dibuat otomatis setelah data disimpan.</p>}
        {error && <p className="form-error">{error}</p>}
        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Batal</button>
          <button className="btn">Simpan</button>
        </div>
      </form>
    </Modal>
  );
}
