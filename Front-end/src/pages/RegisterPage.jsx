import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import logoImg from '../assets/logo.png';
import {
  User,
  Briefcase,
  CheckCircle2,
  ArrowRight,
  Mail,
  Lock,
  MapPin,
  Building2,
  Phone,
  Zap,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ALGERIAN_WILAYAS = [
  "01 - Adrar", "02 - Chlef", "03 - Laghouat", "04 - Oum El Bouaghi", "05 - Batna",
  "06 - Béjaïa", "07 - Biskra", "08 - Béchar", "09 - Blida", "10 - Bouira",
  "11 - Tamanrasset", "12 - Tébessa", "13 - Tlemcen", "14 - Tiaret", "15 - Tizi Ouzou",
  "16 - Alger", "17 - Djelfa", "18 - Jijel", "19 - Sétif", "20 - Saïda",
  "21 - Skikda", "22 - Sidi Bel Abbès", "23 - Annaba", "24 - Guelma", "25 - Constantine",
  "26 - Médéa", "27 - Mostaganem", "28 - M'Sila", "29 - Mascara", "30 - Ouargla",
  "31 - Oran", "32 - El Bayadh", "33 - Illizi", "34 - Bordj Bou Arréridj", "35 - Boumerdès",
  "36 - El Tarf", "37 - Tindouf", "38 - Tissemsilt", "39 - El Oued", "40 - Khenchela",
  "41 - Souk Ahras", "42 - Tipaza", "43 - Mila", "44 - Aïn Defla", "45 - Naâma",
  "46 - Aïn Témouchent", "47 - Ghardaïa", "48 - Relizane",
];

// Allowed university email domains for students
const ALLOWED_STUDENT_DOMAINS = [
  { domain: 'univ-constantine1.dz', label: '@univ-constantine1.dz' },
  { domain: 'univ-constantine2.dz', label: '@univ-constantine2.dz' },
  { domain: 'univ-constantine3.dz', label: '@univ-constantine3.dz' },
  { domain: 'univ-setif1.dz', label: '@univ-setif1.dz' },
  { domain: 'univ-usthb.dz', label: '@univ-usthb.dz' },
];

export default function RegisterPage() {
  const location = useLocation();
  const initialRole = location.state?.role || 'student';

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: initialRole,
    full_name: '',    // Student only
    name: '',         // Company only
    phone_number: '', // Company only
    wilaya: '',       // Both
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const errs = {};
    if (!formData.email) {
      errs.email = 'Email is required';
    } else if (formData.role === 'student') {
      const parts = formData.email.split('@');
      const domain = parts[parts.length - 1]?.toLowerCase();
      const allowed = ALLOWED_STUDENT_DOMAINS.map(d => d.domain);
      if (!allowed.includes(domain)) {
        errs.email = `Students must register with a university email. Allowed: ${ALLOWED_STUDENT_DOMAINS.map(d => d.label).join(', ')}`;
      }
    }
    if (!formData.password) {
      errs.password = 'Password is required';
    } else if (formData.password.length < 5) {
      errs.password = 'Password must be at least 5 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }
    if (formData.role === 'student' && !formData.full_name) {
      errs.full_name = 'Full name is required';
    }
    if (formData.role === 'company' && !formData.name) {
      errs.name = 'Company name is required';
    }
    if (!formData.wilaya) {
      errs.wilaya = 'Please select a wilaya';
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const payload = { ...formData };
      if (formData.role === 'student') {
        delete payload.name;
        delete payload.phone_number;
        delete payload.confirmPassword;
      } else {
        delete payload.full_name;
        delete payload.confirmPassword;
      }

      await register(formData.role, payload);
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.email?.[0] ||
                  err.response?.data?.password?.[0] ||
                  err.response?.data?.non_field_errors?.[0] ||
                  err.response?.data?.detail ||
                  'Registration failed. Please check your data.';
      setErrors({ general: msg });
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
            <h1 className="text-6xl xl:text-7xl font-black text-white leading-[1] tracking-tighter mb-12 animate-slide-up">
              Start your <br /> journey today.
            </h1>
            <div className="space-y-8">
              {[
                { title: "Verified Listings", desc: "Access high-quality internship opportunities from vetted companies." },
                { title: "Direct Matching", desc: "Get matched with roles that perfectly align with your academic background." },
                { title: "Career Growth", desc: "Bridge the gap between university and your professional future." }
              ].map((item, i) => (
                <div key={i} className="flex gap-6 group">
                  <div>
                    <h3 className="text-xl font-black text-white mb-2 tracking-tight">{item.title}</h3>
                    <p className="text-indigo-100 font-medium opacity-90">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <div className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/20 max-w-lg shadow-xl">
            <p className="text-lg text-white font-medium italic leading-relaxed">
              "The most efficient way to start your career in Algeria. Everything is verified and ready for you."
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12 xl:p-24 bg-gray-50 min-h-screen">
        <div className="w-full max-w-xl animate-fade-in">
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-indigo-50 border border-indigo-100 text-[11px] font-black text-indigo-600 uppercase tracking-widest mb-6">
              <Sparkles size={14} />
              Join the ecosystem
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-3 tracking-tight">Create Account</h2>
            <p className="text-gray-500 font-medium text-lg">Select your journey to get started.</p>
          </div>

          <div className="flex p-1.5 bg-gray-200/50 rounded-[20px] mb-10">
            <button
              type="button"
              onClick={() => { setFormData({...formData, role: 'student', confirmPassword: ''}); setErrors({}); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${formData.role === 'student' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            >
              <User size={16} />
              <span>Student</span>
            </button>
            <button
              type="button"
              onClick={() => { setFormData({...formData, role: 'company', confirmPassword: ''}); setErrors({}); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${formData.role === 'company' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            >
              <Briefcase size={16} />
              <span>Company</span>
            </button>
          </div>

          {errors.general && (
            <div className="mb-8 p-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl text-sm font-bold flex items-center gap-3">
              <Zap size={18} className="shrink-0" />
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {formData.role === 'student' ? (
                <div className="space-y-2 md:col-span-2">
                  <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest px-1">Full Name</label>
                  <div className="relative group">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                    <input
                      className={`w-full pl-14 pr-6 py-4 bg-white border rounded-2xl font-bold text-gray-900 focus:ring-4 focus:ring-indigo-50 focus:outline-none transition-all shadow-sm ${errors.full_name ? 'border-rose-400 focus:border-rose-500' : 'border-gray-200 focus:border-indigo-600'}`}
                      placeholder="Enter your full name"
                      value={formData.full_name}
                      onChange={e => { setFormData({...formData, full_name: e.target.value}); setErrors({...errors, full_name: ''}); }}
                      required
                    />
                  </div>
                  {errors.full_name && <p className="text-rose-500 text-xs font-bold px-1">{errors.full_name}</p>}
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest px-1">Company Name</label>
                    <div className="relative group">
                      <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                      <input
                        className={`w-full pl-14 pr-6 py-4 bg-white border rounded-2xl font-bold text-gray-900 focus:ring-4 focus:ring-indigo-50 focus:outline-none transition-all shadow-sm ${errors.name ? 'border-rose-400 focus:border-rose-500' : 'border-gray-200 focus:border-indigo-600'}`}
                        placeholder="Company Ltd"
                        value={formData.name}
                        onChange={e => { setFormData({...formData, name: e.target.value}); setErrors({...errors, name: ''}); }}
                        required
                      />
                    </div>
                    {errors.name && <p className="text-rose-500 text-xs font-bold px-1">{errors.name}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest px-1">Phone Number</label>
                    <div className="relative group">
                      <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                      <input
                        type="tel"
                        className="w-full pl-14 pr-6 py-4 bg-white border border-gray-200 rounded-2xl font-bold text-gray-900 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 focus:outline-none transition-all shadow-sm"
                        placeholder="+213 555 55 55 55"
                        value={formData.phone_number}
                        onChange={e => setFormData({...formData, phone_number: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2 flex flex-col justify-end">
                <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest px-1">
                  Email Address {formData.role === 'student' && <span className="text-amber-500 normal-case tracking-normal font-normal ml-1">(use your university email)</span>}
                </label>
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                  <input
                    type="email"
                    className={`w-full pl-14 pr-6 py-4 bg-white border rounded-2xl font-bold text-gray-900 focus:ring-4 focus:ring-indigo-50 focus:outline-none transition-all shadow-sm ${errors.email ? 'border-rose-400 focus:border-rose-500' : 'border-gray-200 focus:border-indigo-600'}`}
                    placeholder={formData.role === 'student' ? 'name@univ-constantine1.dz' : 'contact@company.com'}
                    value={formData.email}
                    onChange={e => { setFormData({...formData, email: e.target.value}); setErrors({...errors, email: ''}); }}
                    required
                  />
                </div>
                {errors.email && <p className="text-rose-500 text-xs font-bold px-1">{errors.email}</p>}
              </div>

              <div className="space-y-2 flex flex-col justify-end">
                <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest px-1">Location (Wilaya)</label>
                <div className="relative group">
                  <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                  <select
                    className={`w-full pl-14 pr-6 py-4 bg-white border rounded-2xl font-bold text-gray-900 focus:ring-4 focus:ring-indigo-50 focus:outline-none transition-all shadow-sm appearance-none cursor-pointer ${errors.wilaya ? 'border-rose-400 focus:border-rose-500' : 'border-gray-200 focus:border-indigo-600'}`}
                    value={formData.wilaya}
                    onChange={e => { setFormData({...formData, wilaya: e.target.value}); setErrors({...errors, wilaya: ''}); }}
                    required
                  >
                    <option value="" disabled>Select your Wilaya</option>
                    {ALGERIAN_WILAYAS.map(w => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
                {errors.wilaya && <p className="text-rose-500 text-xs font-bold px-1">{errors.wilaya}</p>}
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest px-1">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                  <input
                    type="password"
                    className={`w-full pl-14 pr-6 py-4 bg-white border rounded-2xl font-bold text-gray-900 focus:ring-4 focus:ring-indigo-50 focus:outline-none transition-all shadow-sm ${errors.password ? 'border-rose-400 focus:border-rose-500' : 'border-gray-200 focus:border-indigo-600'}`}
                    placeholder="Min. 5 characters"
                    value={formData.password}
                    onChange={e => { setFormData({...formData, password: e.target.value}); setErrors({...errors, password: ''}); }}
                    required
                  />
                </div>
                {errors.password && <p className="text-rose-500 text-xs font-bold px-1">{errors.password}</p>}
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest px-1">Confirm Password</label>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                  <input
                    type="password"
                    className={`w-full pl-14 pr-6 py-4 bg-white border rounded-2xl font-bold text-gray-900 focus:ring-4 focus:ring-indigo-50 focus:outline-none transition-all shadow-sm ${errors.confirmPassword ? 'border-rose-400 focus:border-rose-500' : 'border-gray-200 focus:border-indigo-600'}`}
                    placeholder="Repeat password"
                    value={formData.confirmPassword}
                    onChange={e => { setFormData({...formData, confirmPassword: e.target.value}); setErrors({...errors, confirmPassword: ''}); }}
                    required
                  />
                </div>
                {errors.confirmPassword && <p className="text-rose-500 text-xs font-bold px-1">{errors.confirmPassword}</p>}
              </div>
            </div>

            {/* Allowed university domains hint for students */}
            {formData.role === 'student' && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">Allowed Student Email Domains</p>
                <div className="flex flex-wrap gap-2">
                  {ALLOWED_STUDENT_DOMAINS.map(d => (
                    <span key={d.domain} className="px-3 py-1 bg-white text-indigo-700 rounded-lg font-black text-[10px] uppercase tracking-widest border border-indigo-100">
                      {d.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-2 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 group disabled:opacity-70 disabled:translate-y-0 active:scale-95"
            >
              {loading ? 'Creating Account...' : (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="mt-10 text-center text-sm font-bold text-gray-500">
            Already have an account? <Link to="/login" className="text-indigo-600 hover:text-indigo-700 hover:underline font-black">Login instead</Link>
          </p>
        </div>
      </div>
    </div>
  );
}