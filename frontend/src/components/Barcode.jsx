import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { Printer } from 'lucide-react';
import { Modal } from './ui';

export function Barcode({ value, height = 64, width = 2 }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current && value) {
      JsBarcode(ref.current, value, { format: 'CODE128', height, width, displayValue: true, fontSize: 15, margin: 6 });
    }
  }, [value, height, width]);
  return <svg ref={ref} />;
}

/** Kartu barcode siswa + tombol cetak. */
export function BarcodeModal({ siswa, onClose }) {
  const cardRef = useRef(null);

  const print = () => {
    const w = window.open('', '_blank', 'width=520,height=420');
    if (!w) return alert('Pop-up diblokir browser. Izinkan pop-up untuk mencetak.');
    w.document.write(`<!doctype html><html><head><title>Kartu ${siswa.nama}</title><style>
      body{font-family:Arial,sans-serif;margin:0;display:grid;place-items:center;min-height:100vh}
      .kartu{border:2px solid #0f1f5c;border-radius:12px;padding:16px 22px;text-align:center;width:340px}
      .brand{color:#0f1f5c;font-weight:800;letter-spacing:1px;font-size:15px}
      .brand small{display:block;color:#00a99b;letter-spacing:.5px;font-size:11px}
      h2{margin:10px 0 2px;font-size:18px;color:#0f1f5c} p{margin:2px 0;font-size:13px;color:#334155}
      svg{max-width:100%;height:auto;margin-top:8px}
    </style></head><body>${cardRef.current.innerHTML}</body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  };

  return (
    <Modal title="Barcode siswa" onClose={onClose}>
      <div ref={cardRef} className="barcode-card kartu">
        <div className="brand">SMP NEGERI 166<small>JAKARTA</small></div>
        <h2>{siswa.nama}</h2>
        <p>Kelas {siswa.kelas?.nama ?? '-'} · NIS {siswa.nis}</p>
        <Barcode value={siswa.barcode} />
      </div>
      <div className="form-actions" style={{ marginTop: 14 }}>
        <button className="btn btn-ghost" onClick={onClose}>Tutup</button>
        <button className="btn" onClick={print}><Printer size={15} /> Cetak kartu</button>
      </div>
    </Modal>
  );
}
