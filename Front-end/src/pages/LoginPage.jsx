import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import logoImg from '../assets/logo.png';
import { useAuth } from '../context/AuthContext';
import { 
  Mail, 
  Lock, 
  Zap,
  ArrowRight,
  ShieldCheck,
  Star
} from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) navigate(`/${user.role}`);
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err) {
      setError('Authentication failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-sans selection:bg-indigo-100">
      
      {/* LEFT SIDE - BRANDING */}
      <div className="hidden lg:flex lg:w-1/2 bg-indigo-600 p-24 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 blur-3xl rounded-full translate-x-32 -translate-y-32"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-900/20 blur-3xl rounded-full -translate-x-32 translate-y-32"></div>
        
        <div className="relative z-10">
          <Link to="/" className="text-3xl font-black text-white tracking-tighter flex items-center gap-2">
            <img src={logoImg} alt="STAG.IO Logo" className="w-8 h-8 object-contain brightness-0 invert" />
            Stag.io
          </Link>
          
          <div className="mt-32 max-w-xl">
            <h1 className="text-6xl xl:text-7xl font-black text-white leading-[1] tracking-tighter mb-8 animate-slide-up">
              The next level of <br /> talent matching.
            </h1>
            <p className="text-xl text-indigo-100 font-medium leading-relaxed max-w-lg opacity-90">
              Join the ecosystem where Algeria's brightest students and most innovative companies build the future together.
            </p>
          </div>
        </div>


      </div>

      {/* RIGHT SIDE - FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-24 bg-gray-50 min-h-screen">
        <div className="w-full max-w-md animate-fade-in">
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-indigo-50 border border-indigo-100 text-[11px] font-black text-indigo-600 uppercase tracking-widest mb-6">
              <ShieldCheck size={14} />
              Secure Authentication
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-3 tracking-tight">Welcome back</h2>
            <p className="text-gray-500 font-medium text-lg">Resuming your career journey.</p>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl text-sm font-bold flex items-center gap-3">
              <Zap size={18} className="shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest px-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                <input 
                  type="email" 
                  className="w-full pl-14 pr-6 py-4 bg-white border border-gray-200 rounded-2xl font-bold text-gray-900 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 focus:outline-none transition-all shadow-sm"
                  placeholder="name@university.edu"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest px-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                <input 
                  type="password" 
                  className="w-full pl-14 pr-6 py-4 bg-white border border-gray-200 rounded-2xl font-bold text-gray-900 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 focus:outline-none transition-all shadow-sm"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 mt-2 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:translate-y-0 active:scale-95 group"
            >
              <span className="flex items-center justify-center gap-3">
                {loading ? 'Authenticating...' : 'Sign In'}
                {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
              </span>
            </button>
          </form>

          <p className="mt-12 text-center text-sm font-bold text-gray-500">
            Don't have an account? <Link to="/register" className="text-indigo-600 hover:text-indigo-700 hover:underline font-black">Sign up for free</Link>
          </p>

          <div className="mt-20 flex justify-center gap-8 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-t border-gray-200 pt-8">
            <a href="#" className="hover:text-gray-900 transition-colors">Privacy</a>
            <a href="#" className="hover:text-gray-900 transition-colors">Terms</a>
            <a href="#" className="hover:text-gray-900 transition-colors">Support</a>
          </div>
        </div>
      </div>
    </div>
  );
}
