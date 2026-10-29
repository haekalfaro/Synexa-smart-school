import { useEffect, useState } from 'react';
import { GraduationCap, Pencil, Plus, RotateCcw, Search, ShieldCheck, Trash2, UserCog, Users } from 'lucide-react';
import api from '../api';
import { useAuth } from '../auth';
import { C, Donut, Legend2 } from '../components/Charts';
import { Badge, Card, Field, Modal, PageHeader, Pagination, Progress, StatCard, errMsg, pct } from '../components/ui';
import { useDebounced, useList } from '../hooks';

const EMPTY = { nama: '', nip: '', jabatan: '', jenis: 'guru', status: 'aktif' };
const rate = (n, t) => (t ? (n / t) * 100 : 0);

export default function Guru() {
  const { canWrite } = useAuth();
  const [search, setSearch] = useState('');
  const [jenis, setJenis] = useState('');
  const [status, setStatus] = useState('');
  const [jabatan, setJabatan] = useState('');
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState(null);
  const [modal, setModal] = useState(null);
  const q = useDebounced(search);

  const list = useList('/guru', { search: q, jenis, status, jabatan, page });
  const loadStats = () => api.get('/guru/stats').then((r) => setStats(r.data));

  useEffect(() => { loadStats(); }, []);
  useEffect(() => { setPage(1); }, [q, jenis, status, jabatan]);

  const reset = () => { setSearch(''); setJenis(''); setStatus(''); setJabatan(''); };
  const refresh = () => { list.reload(); loadStats(); };

  const remove = async (g) => {
    if (!confirm(`Hapus ${g.nama}?`)) return;
    try { await api.delete(`/guru/${g.id}`); refresh(); } catch (e) { alert(errMsg(e)); }
  };

  return (
    <>
      <PageHeader title="Guru & Staff" subtitle="Data, peran, dan manajemen pengguna sekolah">
        {canWrite && <button className="btn" onClick={() => setModal({ data: EMPTY })}><Plus size={16} /> Tambah Guru/Staff</button>}
      </PageHeader>

      {stats && (
        <div className="stats">
          <StatCard icon={Users} label="Total Guru & Staff" value={stats.total} sub="100%" />
          <StatCard icon={GraduationCap} tone="green" label="Guru" value={stats.guru} sub={pct(rate(stats.guru, stats.total))} />
          <StatCard icon={UserCog} tone="yellow" label="Staff" value={stats.staff} sub={pct(rate(stats.staff, stats.total))} />
          <StatCard icon={ShieldCheck} tone="purple" label="Akun Aktif" value={stats.akun_aktif} sub={pct(rate(stats.akun_aktif, stats.total))} />
        </div>
      )}

      <div className="grid g-3-2">
        <Card title="Daftar Guru & Staff">
          <div className="filters">
            <div className="search"><Search size={15} /><input placeholder="Cari nama, NIP, atau jabatan..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
            <select value={jenis} onChange={(e) => setJenis(e.target.value)}>
              <option value="">Semua jenis</option><option value="guru">Guru</option><option value="staff">Staff</option>
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Semua status</option><option value="aktif">Aktif</option><option value="tidak_aktif">Tidak Aktif</option>
            </select>
            <select value={jabatan} onChange={(e) => setJabatan(e.target.value)}>
              <option value="">Semua jabatan</option>
              {stats?.per_jabatan.map((j) => <option key={j.jabatan} value={j.jabatan}>{j.jabatan}</option>)}
            </select>
            <button className="btn btn-ghost" onClick={reset}><RotateCcw size={14} /> Reset</button>
          </div>
          <table className="tbl">
            <thead><tr><th>No</th><th>Nama</th><th>NIP</th><th>Jabatan</th><th>Jenis</th><th>Status</th>{canWrite && <th>Aksi</th>}</tr></thead>
            <tbody>
              {!list.loading && list.data.length === 0 && <tr><td colSpan={7} className="empty">Tidak ada data yang cocok dengan filter.</td></tr>}
              {list.data.map((g, i) => (
                <tr key={g.id}>
                  <td>{list.from + i}</td><td><b>{g.nama}</b></td><td>{g.nip ?? '-'}</td><td>{g.jabatan}</td>
                  <td>{g.jenis === 'guru' ? 'Guru' : 'Staff'}</td><td><Badge status={g.status} /></td>
                  {canWrite && (
                    <td className="actions">
                      <button className="icon-btn" onClick={() => setModal({ data: { ...g, nip: g.nip ?? '' } })} aria-label="Ubah"><Pencil size={15} /></button>
                      <button className="icon-btn danger" onClick={() => remove(g)} aria-label="Hapus"><Trash2 size={15} /></button>
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
            <Card title="Distribusi Guru & Staff">
              <div className="donut-row">
                <Donut labels={['Guru', 'Staff']} values={[stats.guru, stats.staff]} colors={[C.teal, C.yellow]} center={stats.total} sub="Total" />
                <Legend2 items={[
                  { label: 'Guru', color: C.teal, value: stats.guru, pct: pct(rate(stats.guru, stats.total)) },
                  { label: 'Staff', color: C.yellow, value: stats.staff, pct: pct(rate(stats.staff, stats.total)) },
                ]} />
              </div>
            </Card>
            <Card title="Jumlah per Jabatan">
              {stats.per_jabatan.map((j) => (
                <div className="recap" key={j.jabatan}>
                  <div><span>{j.jabatan}</span><b>{j.total} · {pct(rate(j.total, stats.total))}</b></div>
                  <Progress value={rate(j.total, stats.total) * 2} />
                </div>
              ))}
            </Card>
            <Card title="Status Akun Pengguna">
              <div className="donut-row">
                <Donut labels={['Aktif', 'Non-Aktif']} values={[stats.akun_aktif, stats.akun_nonaktif]} colors={[C.teal, C.red]} center={stats.total} sub="Total" size={120} />
                <Legend2 items={[
                  { label: 'Aktif', color: C.teal, value: stats.akun_aktif, pct: pct(rate(stats.akun_aktif, stats.total)) },
                  { label: 'Non-Aktif', color: C.red, value: stats.akun_nonaktif, pct: pct(rate(stats.akun_nonaktif, stats.total)) },
                ]} />
              </div>
            </Card>
          </div>
        )}
      </div>

      {modal && <GuruModal initial={modal.data} onClose={() => setModal(null)} onSaved={() => { setModal(null); refresh(); }} />}
    </>
  );
}

function GuruModal({ initial, onClose, onSaved }) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const editing = !!initial.id;

  const submit = async (e) => {
    e.preventDefault();
    try {
      const body = { nama: form.nama, nip: form.nip || null, jabatan: form.jabatan, jenis: form.jenis, status: form.status };
      editing ? await api.put(`/guru/${initial.id}`, body) : await api.post('/guru', body);
      onSaved();
    } catch (err) { setError(errMsg(err)); }
  };

  return (
    <Modal title={editing ? 'Ubah Guru/Staff' : 'Tambah Guru/Staff'} onClose={onClose}>
      <form onSubmit={submit} className="form">
        <Field label="Nama"><input value={form.nama} onChange={set('nama')} required /></Field>
        <Field label="NIP (kosongkan untuk staff tanpa NIP)"><input value={form.nip} onChange={set('nip')} /></Field>
        <Field label="Jabatan"><input value={form.jabatan} onChange={set('jabatan')} placeholder="Guru Kelas, Staff Tata Usaha, …" required /></Field>
        <Field label="Jenis">
          <select value={form.jenis} onChange={set('jenis')}><option value="guru">Guru</option><option value="staff">Staff</option></select>
        </Field>
        <Field label="Status">
          <select value={form.status} onChange={set('status')}><option value="aktif">Aktif</option><option value="tidak_aktif">Tidak Aktif</option></select>
        </Field>
        {error && <p className="form-error">{error}</p>}
        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Batal</button>
          <button className="btn">Simpan</button>
        </div>
      </form>
    </Modal>
  );
}
