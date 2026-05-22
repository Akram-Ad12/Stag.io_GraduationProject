import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, 
  LogOut, 
  LayoutDashboard, 
  ChevronDown,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/logo.png';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className={`fixed top-0 left-0 w-full z-[1000] transition-all duration-500 ${scrolled ? 'py-4 bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm' : 'py-6 bg-transparent'}`}>
      <div className="max-w-[1400px] mx-auto px-8 flex justify-between items-center">
        
        {/* LOGO */}
        <Link to="/" className="flex items-center gap-2 group">
          <img 
            src={logoImg} 
            alt="STAG.IO Logo" 
            className="w-10 h-10 object-contain group-hover:scale-110 transition-transform drop-shadow-md"
          />
          <span className={`text-2xl font-black tracking-tighter transition-colors ${scrolled ? 'text-gray-900' : 'text-gray-900 lg:text-white'}`}>
            STAG<span className="text-indigo-600">.IO</span>
          </span>
        </Link>

        {/* DESKTOP MENU */}
        <div className="hidden lg:flex items-center gap-10">
          <div className={`flex gap-8 font-black text-xs uppercase tracking-widest ${scrolled ? 'text-gray-500' : 'text-gray-400 lg:text-gray-300'}`}>
            <a href="#features" className="hover:text-indigo-600 transition-colors">Platform</a>
            <a href="#solutions" className="hover:text-indigo-600 transition-colors">Ecosystem</a>
            <a href="#testimonials" className="hover:text-indigo-600 transition-colors">Success</a>
          </div>

          <div className="h-6 w-[1px] bg-gray-200 lg:bg-white/10"></div>

          {user ? (
            <div className="relative">
              <button 
                onClick={() => setShowDropdown(!showDropdown)}
                className={`flex items-center gap-3 p-1.5 rounded-full border transition-all ${scrolled ? 'bg-gray-50 border-gray-100' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'}`}
              >
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-md">
                  {(user.full_name || user.email)[0].toUpperCase()}
                </div>
                <span className="text-sm font-black pr-2 hidden xl:block">{user.email.split('@')[0]}</span>
                <ChevronDown size={14} className={`mr-2 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showDropdown && (
                <div className="absolute top-full right-0 mt-4 w-64 bg-white rounded-3xl shadow-2xl shadow-gray-200 border border-gray-100 p-2 animate-fade-in">
                  <div className="p-4 border-b border-gray-50 mb-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Authenticated as</p>
                    <p className="font-black text-gray-900 truncate">{user.email}</p>
                  </div>
                  <Link 
                    to={user.role === 'student' ? '/student' : user.role === 'company' ? '/company' : '/admin'} 
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                    onClick={() => setShowDropdown(false)}
                  >
                    <LayoutDashboard size={18} />
                    Command Center
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-rose-600 hover:bg-rose-50 transition-all"
                  >
                    <LogOut size={18} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/login" className={`px-6 py-3 font-black text-xs uppercase tracking-widest transition-all ${scrolled ? 'text-gray-900 hover:text-indigo-600' : 'text-white hover:text-indigo-300'}`}>
                Login
              </Link>
              <Link to="/register" className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 transition-all">
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* MOBILE MENU TRIGGER */}
        <button className="lg:hidden p-2 text-gray-900" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* MOBILE MENU */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-[72px] bg-white z-[999] p-8 animate-fade-in">
          <div className="space-y-6">
            <a href="#features" className="block text-2xl font-black text-gray-900">Platform</a>
            <a href="#solutions" className="block text-2xl font-black text-gray-900">Ecosystem</a>
            <a href="#testimonials" className="block text-2xl font-black text-gray-900">Success Stories</a>
            <div className="pt-8 border-t border-gray-100 flex flex-col gap-4">
              <Link to="/login" className="w-full py-4 text-center font-black text-gray-900 border-2 border-gray-100 rounded-2xl">Login</Link>
              <Link to="/register" className="w-full py-4 text-center font-black text-white bg-indigo-600 rounded-2xl">Create Account</Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

