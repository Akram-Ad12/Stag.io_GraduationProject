import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  Network, 
  Settings, 
  Plus, 
  HelpCircle, 
  LogOut,
  ChevronRight,
  Building2,
  Bell,
  FileText,
  TrendingUp as StatsIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getMediaUrl } from '../api/axios';
import logoImg from '../assets/logo.png';

export default function Sidebar({ role }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const baseMenuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: `/${role}` },
    { name: 'Internship Offers', icon: Briefcase, path: `/${role}/internships` },
  ];

  const menuItems = role === 'company' ? [
    { name: 'Dashboard', icon: LayoutDashboard, path: `/${role}/dashboard` },
    { name: 'Internship Offers', icon: Briefcase, path: `/${role}/internships` },
    { name: 'Analytics', icon: StatsIcon, path: `/${role}/stats` },
    { name: 'Notifications', icon: Bell, path: `/${role}/notifications`, badge: true },
    { name: 'Company Profile', icon: Building2, path: `/${role}/profile` },
  ] : role === 'student' ? [
    { name: 'Explore Offers', icon: Briefcase, path: `/${role}/internships` },
    { name: 'My Applications', icon: FileText, path: `/${role}/applications` },
    { name: 'Notifications', icon: Bell, path: `/${role}/notifications`, badge: true },
    { name: 'Edit Profile', icon: Users, path: `/${role}/profile` },
    { name: 'Digital CV', icon: Network, path: `/${role}/cv` },
  ] : [
    { name: 'Dashboard', icon: LayoutDashboard, path: `/${role}` },
    { name: 'Manage Applications', icon: Briefcase, path: `/${role}/internships` },
    { name: 'Notifications', icon: Bell, path: `/${role}/notifications`, badge: true },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-72 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0 z-50 shadow-sm">
      {/* BRANDING */}
      <div className="p-10 pb-12">
        <Link to="/" className="text-3xl font-black text-indigo-600 tracking-tighter flex items-center gap-2 group">
          <img src={logoImg} alt="STAG.IO Logo" className="w-8 h-8 object-contain group-hover:scale-110 transition-transform" />
          Stag.io
        </Link>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 px-6 space-y-2 overflow-y-auto pb-4">
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.path === `/${role}`}
            className={({ isActive }) => `
              flex items-center justify-between px-5 py-3.5 rounded-2xl font-bold transition-all duration-300 group
              ${isActive 
                ? 'bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100' 
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 border border-transparent'}
            `}
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center gap-4">
                  <item.icon size={20} className={`${isActive ? 'scale-110 text-indigo-600' : 'group-hover:scale-110 group-hover:text-indigo-600'} transition-all`} />
                  <span className="tracking-tight text-sm font-semibold">{item.name}</span>
                </div>
                {item.badge && <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>}
                {isActive && !item.badge && <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.4)]"></div>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* FOOTER / USER */}
      <div className="p-6 border-t border-gray-100">
        <div
          onClick={() => (role === 'student' || role === 'company') ? navigate(`/${role}/profile`) : undefined}
          className={`flex items-center gap-3 px-3 py-4 mb-4 border-b border-gray-100 rounded-2xl transition-all ${(role === 'student' || role === 'company') ? 'cursor-pointer hover:bg-gray-50 group' : ''}`}
        >
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-black text-indigo-600 overflow-hidden shrink-0 border border-indigo-200 shadow-sm group-hover:ring-2 group-hover:ring-indigo-300 transition-all">
            {user?.profile_image || user?.logo ? (
              <img src={getMediaUrl(user.profile_image || user.logo)} alt="User" className="w-full h-full object-cover" />
            ) : (
              <span>{(user?.full_name || user?.name || user?.email || 'U')[0].toUpperCase()}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate tracking-tight">{user?.full_name || user?.name || user?.email?.split('@')[0]}</p>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest truncate">
              {role === 'admin' ? 'System Admin' : 'View Profile →'}
            </p>
          </div>
        </div>

        {role === 'company' && (
          <button 
            onClick={() => navigate(`/${role}/internships`)}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all mb-4 group"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform" />
            <span>Post internship</span>
          </button>
        )}

        <div className="pt-2">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 text-gray-400 font-bold text-xs uppercase tracking-widest hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all group border border-transparent hover:border-rose-100"
          >
            <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
