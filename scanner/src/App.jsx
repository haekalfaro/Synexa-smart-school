import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

const KEY = import.meta.env.VITE_SCANNER_KEY || '';
const GATE = import.meta.env.VITE_GATE_NAME || 'Gerbang Utama';
const DEVICE = import.meta.env.VITE_DEVICE_NAME || 'Scanner 1';
const BATAS = import.meta.env.VITE_BATAS_MASUK || '07:30';
const COOLDOWN = 5000; // barcode yang sama diabaikan selama 5 detik
const SHOW_MS = 4000;  // lama hasil ditampilkan, lalu kembali siaga

/* ---------- suara ---------- */
let audioCtx;
const getCtx = () => (audioCtx ||= new (window.AudioContext || window.webkitAudioContext)());
function beep(kind) {
  try {
    const ctx = getCtx();
    const tones = { ok: [[880, 0.12]], late: [[660, 0.12], [660, 0.12]], info: [[520, 0.15]], err: [[200, 0.4]] }[kind] || [];
    let t = ctx.currentTime;
    for (const [freq, dur] of tones) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = kind === 'err' ? 'sawtooth' : 'sine';
      o.frequency.value = freq;
      g.gain.value = 0.15;
      o.connect(g); g.connect(ctx.destination);
      o.start(t); o.stop(t + dur);
      t += dur + 0.08;
    }
  } catch { /* audio tidak tersedia */ }
}

const pad = (n) => String(n).padStart(2, '0');

export default function App() {
  const [started, setStarted] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [camId, setCamId] = useState(localStorage.getItem('camId') || '');
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState(null);
  const [recent, setRecent] = useState([]);
  const [now, setNow] = useState(new Date());

  const last = useRef({ code: '', at: 0 });
  const busy = useRef(false);
  const timer = useRef();

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Heartbeat: memberi tahu server bahwa perangkat ini hidup (muncul di dashboard admin).
  const camOk = useRef(false);
  useEffect(() => { camOk.current = started && !error; }, [started, error]);
  const [watched, setWatched] = useState(false);
  const streaming = useRef(false);
  const canvas = useRef(null);

  const post = (path, body) =>
    fetch(`/api/scanner/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-Scanner-Key': KEY },
      body: JSON.stringify(body),
    }).then((r) => (r.ok ? r.json() : null)).catch(() => null);

  const setStream = (res) => {
    const on = !!res?.stream;
    streaming.current = on;
    setWatched(on);
  };

  useEffect(() => {
    const beat = () => post('heartbeat', { nama: DEVICE, gerbang: GATE, kamera: camOk.current }).then(setStream);
    beat();
    const t = setInterval(beat, 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live view: kirim cuplikan kamera HANYA saat admin sedang membuka halaman Perangkat.
  useEffect(() => {
    const t = setInterval(() => {
      if (!streaming.current || !camOk.current) return;
      const v = document.querySelector('#reader video');
      if (!v || !v.videoWidth) return;
      const c = (canvas.current ||= document.createElement('canvas'));
      c.width = 320;
      c.height = Math.round((v.videoHeight / v.videoWidth) * 320);
      c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
      post('frame', { nama: DEVICE, image: c.toDataURL('image/jpeg', 0.5) }).then(setStream);
    }, 1500);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const show = (r) => {
    setResult(r);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setResult(null), SHOW_MS);
  };

  /* ---------- kirim hasil scan ke server ---------- */
  const handle = async (raw) => {
    const code = raw.trim().toUpperCase();
    const t = Date.now();
    if (busy.current || (last.current.code === code && t - last.current.at < COOLDOWN)) return;
    busy.current = true;
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-Scanner-Key': KEY },
        body: JSON.stringify({ barcode: code, gerbang: GATE }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        beep('err');
        return show({ tone: 'err', title: 'Kunci scanner salah', text: 'Samakan VITE_SCANNER_KEY dengan SCANNER_KEY di .env Laravel.' });
      }

      last.current = { code, at: t };
      const waktu = data.waktu || `${pad(new Date().getHours())}:${pad(new Date().getMinutes())}`;

      if (data.result === 'ok') {
        const late = data.status === 'terlambat';
        beep(late ? 'late' : 'ok');
        show({
          tone: late ? 'late' : 'ok',
          title: late ? 'Terlambat' : 'Tepat waktu',
          name: data.siswa.nama,
          text: `Kelas ${data.siswa.kelas} · masuk ${waktu}`,
        });
        setRecent((r) => [{ id: t, waktu, nama: data.siswa.nama, kelas: data.siswa.kelas, late }, ...r].slice(0, 6));
      } else if (data.result === 'sudah') {
        beep('info');
        show({ tone: 'info', title: 'Sudah tercatat hari ini', name: data.siswa.nama, text: `Kelas ${data.siswa.kelas} · masuk ${waktu}` });
      } else {
        beep('err');
        show({ tone: 'err', title: data.message || 'Scan gagal', name: data.siswa?.nama, text: data.siswa ? `Kelas ${data.siswa.kelas}` : 'Pastikan kartu barcode dari Synexa.' });
      }
    } catch {
      // Gagal jaringan: jangan pasang cooldown, supaya bisa langsung dicoba lagi.
      beep('err');
      show({ tone: 'err', title: 'Server tidak terhubung', text: 'Pastikan php artisan serve berjalan, lalu scan ulang.' });
    } finally {
      busy.current = false;
    }
  };

  /* ---------- kamera (selalu aktif setelah dimulai) ---------- */
  useEffect(() => {
    if (!started) return undefined;
    const scanner = new Html5Qrcode('reader', {
      formatsToSupport: [Html5QrcodeSupportedFormats.CODE_128],
      useBarCodeDetectorIfSupported: true,
      verbose: false,
    });
    let alive = true;

    scanner
      .start(
        camId || { facingMode: 'environment' },
        { fps: 10, qrbox: (w, h) => ({ width: Math.floor(w * 0.85), height: Math.floor(h * 0.5) }) },
        handle,
        () => {}
      )
      .then(() => Html5Qrcode.getCameras().then((c) => alive && setCameras(c)).catch(() => {}))
      .catch((e) => alive && setError(String(e)));

    return () => {
      alive = false;
      scanner.stop().then(() => scanner.clear()).catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, camId, retry]);

  /* ---------- layar tidak boleh mati ---------- */
  useEffect(() => {
    if (!started || !('wakeLock' in navigator)) return undefined;
    let lock;
    const ask = () => navigator.wakeLock.request('screen').then((l) => { lock = l; }).catch(() => {});
    ask();
    const onVis = () => document.visibilityState === 'visible' && ask();
    document.addEventListener('visibilitychange', onVis);
    return () => { document.removeEventListener('visibilitychange', onVis); lock?.release().catch(() => {}); };
  }, [started]);

  const start = () => {
    getCtx().resume(); // browser baru mengizinkan suara setelah ada ketukan
    setStarted(true);
  };

  if (!started) {
    return (
      <div className="start">
        <div className="logo"><b>SYNEXA</b><span>SMART SCHOOL</span></div>
        <h1>Scanner Kehadiran</h1>
        <p>{GATE} · batas masuk {BATAS}</p>
        <button onClick={start}>Mulai scanner</button>
        <small>Ketuk sekali untuk mengaktifkan kamera dan suara. Setelah itu scanner siaga terus.</small>
      </div>
    );
  }

  const clock = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  const date = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="scan">
      <header>
        <div className="logo"><b>SYNEXA</b><span>SMART SCHOOL</span></div>
        <div className="clock"><strong>{clock}</strong><small>{date}</small></div>
        <div className="gate"><b>{DEVICE}</b><small>{GATE} · batas masuk {BATAS}</small>{watched && <small className="watch">● Sedang dipantau admin</small>}</div>
      </header>

      <main>
        <section className="cam">
          <div id="reader" />
          {error && (
            <div className="cam-error">
              <p>Kamera tidak bisa dibuka.</p>
              <small>{error}</small>
              <button onClick={() => { setError(''); setRetry((n) => n + 1); }}>Coba lagi</button>
            </div>
          )}
          {cameras.length > 1 && (
            <select value={camId} onChange={(e) => { setCamId(e.target.value); localStorage.setItem('camId', e.target.value); }} aria-label="Pilih kamera">
              <option value="">Kamera otomatis</option>
              {cameras.map((c) => <option key={c.id} value={c.id}>{c.label || c.id}</option>)}
            </select>
          )}
        </section>

        <section className="side">
          <div className={`status ${result ? result.tone : 'idle'}`} aria-live="polite">
            {result ? (
              <>
                <h2>{result.title}</h2>
                {result.name && <div className="name">{result.name}</div>}
                <p>{result.text}</p>
              </>
            ) : (
              <>
                <h2>Siap memindai</h2>
                <p>Arahkan barcode kartu siswa ke kamera.</p>
              </>
            )}
          </div>

          <div className="recent">
            <h3>Scan terakhir</h3>
            {recent.length === 0 && <p className="none">Belum ada scan.</p>}
            {recent.map((r) => (
              <div className="row" key={r.id}>
                <span>{r.waktu}</span>
                <b>{r.nama}</b>
                <em>{r.kelas}</em>
                <i className={r.late ? 'late' : 'ok'}>{r.late ? 'Terlambat' : 'Tepat waktu'}</i>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
