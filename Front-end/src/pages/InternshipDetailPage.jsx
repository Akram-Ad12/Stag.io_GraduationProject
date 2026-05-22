import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import logoImg from '../assets/logo.png';
import {
  MapPin,
  Clock,
  CheckCircle2,
  Globe,
  ArrowLeft,
  Loader2,
  Zap,
  Calendar,
  Wifi
} from 'lucide-react';
import { getOfferDetails, applyForOffer } from '../api/studentApi';
import { getMediaUrl } from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function InternshipDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadOffer(); }, [id]);

  const loadOffer = async () => {
    try {
      const res = await getOfferDetails(id);
      setOffer(res.data);
      setApplied(res.data.already_applied || false);
    } catch (err) {
      console.error('Failed to load offer', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (applied || applying) return;
    setApplying(true);
    setError('');
    try {
      await applyForOffer(id);
      setApplied(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Application failed. You may have already applied.');
    } finally {
      setApplying(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="animate-spin text-indigo-600" size={48} />
    </div>
  );

  if (!offer) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-6">
      <p className="text-xl font-black text-gray-500">Offer not found.</p>
      <button onClick={() => navigate(-1)} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700 transition-all shadow-sm">
        Go Back
      </button>
    </div>
  );

  // Parse skills from comma-separated string or array
  const skills = Array.isArray(offer.skills) 
    ? offer.skills 
    : offer.required_skills 
      ? String(offer.required_skills).split(',').map(s => s.trim()).filter(Boolean)
      : [];

  // Parse responsibilities from description
  const descParagraphs = offer.description 
    ? offer.description.split('\n').filter(p => p.trim()) 
    : [];

  // Compute duration from start/end dates
  const getDuration = () => {
    if (!offer.start_date || !offer.end_date) return null;
    const start = new Date(offer.start_date);
    const end = new Date(offer.end_date);
    const months = Math.round((end - start) / (1000 * 60 * 60 * 24 * 30));
    return months > 0 ? `${months} ${months === 1 ? 'month' : 'months'}` : null;
  };
  const duration = getDuration();

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : null;

  return (
    <div className="min-h-screen bg-gray-50 font-sans selection:bg-indigo-100 pb-20">
      
      {/* BACK NAV */}
      <div className="fixed top-0 left-0 w-full z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center gap-6">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-3 text-gray-600 hover:text-indigo-600 font-black text-sm transition-colors group"
          >
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center group-hover:bg-indigo-50 transition-all border border-transparent group-hover:border-indigo-100">
              <ArrowLeft size={20} />
            </div>
            Back
          </button>
          <div className="flex items-center gap-2">
            <img src={logoImg} alt="STAG.IO Logo" className="w-8 h-8 object-contain" />
            <span className="text-2xl font-black tracking-tight text-indigo-600">Stag.io</span>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 pt-32 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT - MAIN CONTENT */}
        <div className="lg:col-span-2 space-y-8 animate-fade-in">
          
          {/* HERO CARD */}
          <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-6 mb-8">
              <div className="w-24 h-24 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-sm overflow-hidden shrink-0">
                {offer.company_logo ? (
                  <img src={getMediaUrl(offer.company_logo)} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-black">{(offer.company_name || 'C')[0]}</span>
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mb-2">{offer.title}</h1>
                <p className="text-lg sm:text-xl font-bold text-indigo-600 mb-4">{offer.company_name}</p>
                <div className="flex flex-wrap gap-3">
                  {offer.wilaya && (
                    <span className="flex items-center gap-1.5 text-[11px] font-black text-gray-500 uppercase tracking-widest border border-gray-200 px-3 py-1.5 rounded-lg bg-gray-50">
                      <MapPin size={14} className="text-indigo-400" /> {offer.wilaya}
                    </span>
                  )}
                  {offer.is_remote && (
                    <span className="flex items-center gap-1.5 text-[11px] font-black text-emerald-600 uppercase tracking-widest border border-emerald-200 px-3 py-1.5 rounded-lg bg-emerald-50">
                      <Wifi size={14} /> Remote
                    </span>
                  )}
                  {offer.type && (
                    <span className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest ${offer.type === 'paid' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-gray-50 text-gray-500 border border-gray-200'}`}>
                      {offer.type === 'paid' ? '💰 Paid' : 'Unpaid'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* QUICK STATS */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8 border-t border-b border-gray-100 py-8">
              {duration && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><Clock size={12} /> Duration</p>
                  <p className="text-lg font-black text-gray-900">{duration}</p>
                </div>
              )}
              {offer.start_date && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><Calendar size={12} /> Start Date</p>
                  <p className="text-lg font-black text-gray-900">{formatDate(offer.start_date)}</p>
                </div>
              )}
              {offer.end_date && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><Calendar size={12} /> End Date</p>
                  <p className="text-lg font-black text-gray-900">{formatDate(offer.end_date)}</p>
                </div>
              )}
              {offer.salary && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><Zap size={12} /> Stipend</p>
                  <p className="text-lg font-black text-gray-900">{offer.salary} DZD/wk</p>
                </div>
              )}
            </div>

            {/* APPLY */}
            {error && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-sm font-bold">
                {error}
              </div>
            )}
            {user?.role === 'student' && (
              <button
                onClick={handleApply}
                disabled={applied || applying}
                className={`w-full py-4 rounded-2xl font-black uppercase tracking-[2px] text-xs shadow-sm transition-all ${applied ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-default' : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:-translate-y-0.5 active:scale-95 border border-indigo-700'}`}
              >
                {applying ? <Loader2 className="animate-spin mx-auto" size={18} /> : applied ? '✓ Application Submitted' : 'Apply Now'}
              </button>
            )}
          </div>

          {/* DESCRIPTION */}
          <div className="bg-white p-8 sm:p-10 rounded-3xl border border-gray-200 shadow-sm space-y-10">
            <section>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-6">Role Overview</h2>
              {descParagraphs.length > 0 ? (
                <div className="space-y-4">
                  {descParagraphs.map((p, i) => (
                    <p key={i} className="text-base text-gray-600 font-medium leading-relaxed">{p}</p>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 font-medium italic">No description provided.</p>
              )}
            </section>

            {/* REQUIREMENTS */}
            {offer.requirements && (
              <section>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-6">Requirements</h2>
                <div className="space-y-4">
                  {offer.requirements.split('\n').filter(r => r.trim()).map((req, idx) => (
                    <div key={idx} className="flex gap-4">
                      <CheckCircle2 size={20} className="text-indigo-600 shrink-0 mt-0.5" />
                      <p className="text-base font-bold text-gray-700">{req.replace(/^[-•*]\s*/, '')}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* SKILLS */}
            {skills.length > 0 && (
              <section>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-6">Required Skills</h2>
                <div className="flex flex-wrap gap-3">
                  {skills.map((skill, idx) => (
                    <span key={idx} className="px-5 py-2.5 bg-gray-50 text-gray-600 rounded-xl font-black text-xs uppercase tracking-widest border border-gray-200 cursor-default">
                      {typeof skill === 'object' ? skill.name : skill}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>

        {/* RIGHT - SIDEBAR */}
        <div className="space-y-8 animate-fade-in">
          <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6">
            <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-[2px]">About the Company</h3>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xl overflow-hidden border border-indigo-100">
                {offer.company_logo ? (
                  <img src={getMediaUrl(offer.company_logo)} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <span>{(offer.company_name || 'C')[0]}</span>
                )}
              </div>
              <div>
                <p className="font-black text-gray-900 text-lg">{offer.company_name}</p>
                {offer.company_wilaya && (
                  <p className="text-[11px] font-bold text-gray-500 flex items-center gap-1 mt-1">
                    <MapPin size={12} /> {offer.company_wilaya}
                  </p>
                )}
              </div>
            </div>
            {offer.company_description && (
              <p className="text-gray-600 font-medium leading-relaxed text-sm border-t border-gray-100 pt-6">
                {offer.company_description}
              </p>
            )}
            {offer.company_website && (
              <a href={offer.company_website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-indigo-600 font-black text-sm hover:underline">
                <Globe size={16} /> Visit Website
              </a>
            )}
          </div>

          {/* OFFER META */}
          <div className="bg-indigo-600 p-8 rounded-3xl shadow-md border border-indigo-500 text-white space-y-6 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full translate-x-10 -translate-y-10"></div>
            <h3 className="text-[11px] font-black text-indigo-100 uppercase tracking-[2px] relative z-10">Quick Summary</h3>
            <div className="space-y-4 relative z-10">
              {[
                { label: 'Type', value: offer.type === 'paid' ? 'Paid Internship' : 'Unpaid Internship' },
                { label: 'Location', value: offer.is_remote ? 'Remote' : (offer.wilaya || 'Algeria') },
                duration && { label: 'Duration', value: duration },
                offer.start_date && { label: 'Start', value: formatDate(offer.start_date) },
                offer.end_date && { label: 'End', value: formatDate(offer.end_date) },
              ].filter(Boolean).map((item, idx) => (
                <div key={idx} className="flex justify-between items-center border-b border-indigo-500/50 pb-2 last:border-0 last:pb-0">
                  <span className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">{item.label}</span>
                  <span className="text-xs font-black text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
