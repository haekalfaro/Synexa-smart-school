import { useEffect, useRef, useState } from 'react';
import { Cpu, Video, VideoOff, Wifi, WifiOff } from 'lucide-react';
import api from '../api';
import { Badge, Card, PageHeader, StatCard } from '../components/ui';

export default function Perangkat() {
  const [devices, setDevices] = useState(null);
  const [selected, setSelected] = useState('');
  const [img, setImg] = useState(null);
  const [at, setAt] = useState(null);
  const urlRef = useRef(null);

  // Daftar perangkat, diperbarui tiap 5 detik
  useEffect(() => {
    const load = () => api.get('/perangkat').then((r) => setDevices(r.data.data)).catch(() => {});
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (devices?.length && !devices.some((d) => d.id === selected)) setSelected(devices[0].id);
  }, [devices, selected]);

  const sel = devices?.find((d) => d.id === selected);
  const live = !!sel && sel.status === 'online' && sel.kamera;

  // Live view: ambil gambar terbaru tiap 1,5 detik selama halaman ini terbuka
  useEffect(() => {
    setImg(null);
    setAt(null);
    if (!live) return undefined;
    let alive = true;
    let timer;

    const tick = async () => {
      try {
        const r = await api.get(`/perangkat/${selected}/snapshot`, {
          responseType: 'blob',
          validateStatus: (s) => s === 200 || s === 204,
        });
        if (alive && r.status === 200) {
          const next = URL.createObjectURL(r.data);
          const old = urlRef.current;
          urlRef.current = next;
          setImg(next);
          setAt(new Date());
          if (old) URL.revokeObjectURL(old);
        }
      } catch { /* coba lagi pada putaran berikutnya */ }
      if (alive) timer = setTimeout(tick, 1500);
    };
    tick();

    return () => {
      alive = false;
      clearTimeout(timer);
      if (urlRef.current) { URL.revokeObjectURL(urlRef.current); urlRef.current = null; }
    };
  }, [selected, live]);

  const list = devices ?? [];
  const online = list.filter((d) => d.status === 'online').length;
  const kamera = list.filter((d) => d.status === 'online' && d.kamera).length;

  let liveMsg = null;
  if (!sel) liveMsg = 'Pilih perangkat untuk melihat tampilan langsung.';
  else if (sel.status !== 'online') liveMsg = `${sel.nama} sedang offline.`;
  else if (!sel.kamera) liveMsg = 'Kamera scanner belum aktif. Buka halaman scanner lalu tekan "Mulai scanner".';
  else if (!img) liveMsg = 'Menunggu gambar dari scanner… (beberapa detik)';

  return (
    <>
      <PageHeader title="Perangkat" subtitle="Status dan pemantauan perangkat sekolah" />

      <div className="stats">
        <StatCard icon={Cpu} label="Total Perangkat" value={list.length} sub="Scanner barcode" />
        <StatCard icon={Wifi} tone="green" label="Online" value={online} sub={`dari ${list.length} perangkat`} />
        <StatCard icon={WifiOff} tone="red" label="Offline" value={list.length - online} sub="tidak mengirim sinyal" />
        <StatCard icon={Video} tone="purple" label="Kamera Aktif" value={kamera} sub="siap dipantau" />
      </div>

      <div className="grid g-3-2">
        <Card title="Daftar Perangkat">
          <table className="tbl">
            <thead><tr><th>Nama Perangkat</th><th>Jenis</th><th>Lokasi</th><th>Status</th><th>Terakhir Online</th><th>Aksi</th></tr></thead>
            <tbody>
              {devices && list.length === 0 && (
                <tr><td colSpan={6} className="empty">Belum ada scanner terhubung. Buka web scanner (localhost:5174) agar muncul di sini.</td></tr>
              )}
              {list.map((d) => (
                <tr key={d.id} className={d.id === selected ? 'sel' : ''}>
                  <td><b>{d.nama}</b></td>
                  <td>Scanner Barcode</td>
                  <td>{d.gerbang ?? '-'}</td>
                  <td><Badge status={d.status} /></td>
                  <td>{d.terakhir_online}</td>
                  <td><button className="btn btn-ghost" onClick={() => setSelected(d.id)}>Lihat live</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="muted">Terminal absen, CCTV, NVR, switch, access point, jadwal perawatan, dan grafik konektivitas sedang dikembangkan.</p>
        </Card>

        <Card title={sel ? `Live · ${sel.nama}` : 'Live scanner'}>
          <div className="live-box">
            {liveMsg ? (
              <div><VideoOff size={30} /><p>{liveMsg}</p></div>
            ) : (
              <img src={img} alt={`Tampilan langsung kamera ${sel.nama}`} />
            )}
          </div>
          {at && <p className="muted">Diperbarui {at.toLocaleTimeString('id-ID')} · tampilan hanya dikirim saat halaman ini dibuka dan tidak direkam.</p>}
        </Card>
      </div>
    </>
  );
}
