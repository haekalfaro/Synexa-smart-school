import { Navigate, Route, Routes } from 'react-router-dom';
import { Bell, FileText, Monitor, Settings } from 'lucide-react';
import { useAuth } from './auth';
import Layout from './components/Layout';
import ComingSoon from './pages/ComingSoon';
import Dashboard from './pages/Dashboard';
import Guru from './pages/Guru';
import Kehadiran from './pages/Kehadiran';
import Login from './pages/Login';
import Perangkat from './pages/Perangkat';
import Siswa from './pages/Siswa';

function Protected() {
  const { user, loading } = useAuth();
  if (loading) return <div className="center">Memuat…</div>;
  return user ? <Layout /> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Protected />}>
        <Route index element={<Dashboard />} />
        <Route path="kehadiran" element={<Kehadiran />} />
        <Route path="siswa" element={<Siswa />} />
        <Route path="guru" element={<Guru />} />
        <Route
          path="gerbang-cctv"
          element={
            <ComingSoon
              icon={Monitor}
              title="Gerbang & CCTV"
              desc="Monitoring kondisi gerbang, kamera, dan aktivitas akses secara real-time sedang kami kembangkan."
              features={[
                ['Live monitoring CCTV', 'Pantau kamera tiap gerbang dalam satu layar.'],
                ['Aktivitas gerbang', 'Catatan siswa masuk dan keluar, lengkap dengan waktu.'],
                ['Status gerbang', 'Lihat gerbang mana yang online atau offline.'],
                ['Peringatan', 'Dapat pemberitahuan saat koneksi kamera terputus.'],
              ]}
            />
          }
        />
        <Route path="perangkat" element={<Perangkat />} />
        <Route path="laporan" element={<ComingSoon icon={FileText} title="Laporan" desc="Rekap data dan unduhan laporan PDF/Excel akan segera tersedia." features={[]} />} />
        <Route path="notifikasi" element={<ComingSoon icon={Bell} title="Notifikasi" desc="Pemberitahuan kehadiran, perangkat, dan kejadian penting akan segera tersedia." features={[]} />} />
        <Route path="pengaturan" element={<ComingSoon icon={Settings} title="Pengaturan" desc="Pengaturan profil sekolah, pengguna, dan integrasi akan segera tersedia." features={[]} />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
