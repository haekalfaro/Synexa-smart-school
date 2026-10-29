import { NavLink, Outlet } from 'react-router-dom';
import {
  Bell, CalendarCheck, Cpu, FileText, GraduationCap, LayoutDashboard, LogOut, Monitor, Settings, Users,
} from 'lucide-react';
import { useAuth } from '../auth';
import { fmtDate, toISO } from './ui';
import logo from '../assets/logo.jpg';

const NAV = [
  ['/', 'Dashboard', LayoutDashboard],
  ['/kehadiran', 'Kehadiran', CalendarCheck],
  ['/siswa', 'Siswa', Users],
  ['/guru', 'Guru & Staff', GraduationCap],
  ['/gerbang-cctv', 'Gerbang & CCTV', Monitor],
  ['/perangkat', 'Perangkat', Cpu],
  ['/laporan', 'Laporan', FileText],
  ['/notifikasi', 'Notifikasi', Bell],
  ['/pengaturan', 'Pengaturan', Settings],
];

const ROLE = { admin: 'Administrator', kepala_sekolah: 'Kepala Sekolah', operator: 'Operator' };

export default function Layout() {
  const { user, logout } = useAuth();
  const initials = user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <img src={logo} alt="Logo SMP Negeri 166 Jakarta" className="brand-logo" />
          <b>SMP NEGERI 166</b>
          <span>JAKARTA</span>
        </div>
        <nav>
          {NAV.map(([to, label, Icon]) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => (isActive ? 'on' : '')}>
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          <small>Powered by</small>
          <b>SYNEXA</b>
          <small>Global Tekno · v1.0.0</small>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="topbar-right">
            <span>{fmtDate(toISO(new Date()), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
            <div className="user">
              <div className="avatar">{initials}</div>
              <div>
                <div className="user-name">{user.name}</div>
                <small>{ROLE[user.role] ?? user.role}</small>
              </div>
              <button className="icon-btn" onClick={logout} title="Keluar" aria-label="Keluar"><LogOut size={16} /></button>
            </div>
          </div>
        </header>
        <main className="content"><Outlet /></main>
      </div>
    </div>
  );
}
