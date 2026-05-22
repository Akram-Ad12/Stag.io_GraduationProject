import { useState, useEffect } from 'react';
import { 
  MapPin, Clock, CheckCircle2, Globe, X, Loader2, Zap, Calendar 
} from 'lucide-react';
import { getOfferDetails, applyForOffer } from '../api/studentApi';
import { getMediaUrl } from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function StudentOfferModal({ offerId, onClose, onApplySuccess }) {
  const { user } = useAuth();
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState('');
  const [showCompany, setShowCompany] = useState(false);

  useEffect(() => {
    if (!offerId) return;
    loadOffer();
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [offerId]);

  const [showConfirm, setShowConfirm] = useState(false);

  const loadOffer = async () => {
    try {
      const res = await getOfferDetails(offerId);
      setOffer(res.data);
      setApplied(res.data.already_applied || false);
    } catch (err) {
      console.error('Failed to load offer', err);
      setError('Failed to load offer details.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmApply = async () => {
    if (applied || applying) return;
    setApplying(true);
    setShowConfirm(false);
    setError('');
    try {
      await applyForOffer(offerId);
      setApplied(true);
      if (onApplySuccess) onApplySuccess(offerId);
    } catch (err) {
      const detail = err.response?.data?.detail;
      const fieldErrors = err.response?.data;
      
      if (detail) {
        setError(detail);
      } else if (fieldErrors && typeof fieldErrors === 'object') {
        const firstError = Object.values(fieldErrors)[0];
        setError(Array.isArray(firstError) ? firstError[0] : 'Application failed.');
      } else {
        setError('Application failed. Please try again.');
      }
    } finally {
      setApplying(false);
    }
  };

  const handleApplyClick = () => {
    if (applied || applying) return;
    setShowConfirm(true);
  };

  if (!offerId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-gray-900/40 backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div 
        className="relative w-full max-w-4xl bg-white rounded-[32px] shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div className="flex-1 flex items-center justify-center p-20">
            <Loader2 className="animate-spin text-indigo-600" size={48} />
          </div>
        ) : offer ? (
          <>
            {/* HERO BANNER */}
            <div className="relative h-48 sm:h-64 bg-gray-100 shrink-0">
              {offer.photo ? (
                <img src={getMediaUrl(offer.photo)} alt="Cover" className="w-full h-full object-cover" />
              ) : offer.company_logo ? (
                <div className="w-full h-full bg-gradient-to-br from-indigo-900 to-indigo-700 flex items-center justify-center">
                  <img src={getMediaUrl(offer.company_logo)} alt="Logo" className="w-32 h-32 object-contain opacity-20" />
                </div>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-900 to-indigo-700" />
              )}
              
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all z-10"
              >
                <X size={20} />
              </button>

              <div className="absolute -bottom-10 left-8 flex items-end gap-6 z-10">
                <div className="w-24 h-24 rounded-2xl bg-white flex items-center justify-center text-indigo-600 border-4 border-white shadow-lg overflow-hidden shrink-0">
                  {offer.company_logo ? (
                    <img src={getMediaUrl(offer.company_logo)} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl font-black">{(offer.company_name || 'C')[0]}</span>
                  )}
                </div>
              </div>
            </div>

            {/* CONTENT */}
            <div className="flex-1 p-8 pt-16 space-y-10">
              
              {showCompany && offer.company_details ? (
                /* COMPANY PROFILE VIEW */
                <div className="animate-fade-in space-y-8">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-6">
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">About {offer.company_details.name}</h2>
                    <button 
                      onClick={() => setShowCompany(false)}
                      className="px-6 py-2 bg-gray-100 text-gray-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-colors"
                    >
                      ← Back to Offer
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      {offer.company_details.industry && (
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Industry</p>
                          <p className="font-bold text-gray-900">{offer.company_details.industry}</p>
                        </div>
                      )}
                      {offer.company_details.wilaya && (
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Location</p>
                          <p className="font-bold text-gray-900">{offer.company_details.wilaya}</p>
                        </div>
                      )}
                      {offer.company_details.phone_number && (
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Phone Number</p>
                          <p className="font-bold text-gray-900">{offer.company_details.phone_number}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Company Description</p>
                        {offer.company_details.description ? (
                          <div className="space-y-3">
                            {offer.company_details.description.split('\n').filter(p => p.trim()).map((p, i) => (
                              <p key={i} className="text-sm text-gray-600 font-medium leading-relaxed">{p}</p>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400 font-medium italic">No description provided.</p>
                        )}
                      </div>
                      
                      {offer.company_details.website && (
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 shadow-sm">Website</p>
                          <a href={offer.company_details.website.startsWith('http') ? offer.company_details.website : `https://${offer.company_details.website}`} target="_blank" rel="noopener noreferrer" className="font-bold text-indigo-600 hover:underline flex items-center gap-1.5 transition-all w-fit">
                            <Globe size={14} /> Visit Site
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* OFFER VIEW */
                <div className="flex flex-col lg:flex-row gap-10 animate-fade-in">
                  
                  {/* LEFT COL: DETAILS */}
                  <div className="flex-1 space-y-8">
                  <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">{offer.title}</h1>
                    <p className="text-xl font-bold text-indigo-600 mb-4">{offer.company_name}</p>
                    <div className="flex flex-wrap gap-3">
                      {offer.wilaya && (
                        <span className="flex items-center gap-1.5 text-[11px] font-black text-gray-500 uppercase tracking-widest border border-gray-200 px-3 py-1.5 rounded-lg bg-gray-50">
                          <MapPin size={14} className="text-indigo-400" /> {offer.wilaya}
                        </span>
                      )}
                      {offer.type && (
                        <span className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest ${offer.type === 'paid' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-gray-50 text-gray-500 border border-gray-200'}`}>
                          {offer.type === 'paid' ? '💰 Paid' : 'Unpaid'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* QUICK STATS */}
                  <div className="grid grid-cols-2 gap-4 border-y border-gray-100 py-6">
                    {offer.duration_display && (
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><Clock size={12} /> Duration</p>
                        <p className="text-lg font-black text-gray-900">{offer.duration_display}</p>
                      </div>
                    )}
                    {offer.type === 'paid' && offer.salary_per_week && (
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><Zap size={12} /> Salary</p>
                        <p className="text-lg font-black text-emerald-600">{offer.salary_per_week} DA/wk</p>
                      </div>
                    )}
                    {offer.start_date && (
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><Calendar size={12} /> Start Date</p>
                        <p className="text-sm font-black text-gray-900">{new Date(offer.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                    )}
                    {offer.end_date && (
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><Calendar size={12} /> End Date</p>
                        <p className="text-sm font-black text-gray-900">{new Date(offer.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                    )}
                  </div>

                  {/* DESCRIPTION */}
                  <section>
                    <h2 className="text-xl font-black text-gray-900 tracking-tight mb-4">Role Overview</h2>
                    <div className="space-y-3">
                      {offer.description ? offer.description.split('\n').filter(p => p.trim()).map((p, i) => (
                        <p key={i} className="text-sm text-gray-600 font-medium leading-relaxed">{p}</p>
                      )) : <p className="text-gray-400 font-medium italic text-sm">No description provided.</p>}
                    </div>
                  </section>

                  {/* REQUIREMENTS */}
                  {offer.requirements && (
                    <section>
                      <h2 className="text-xl font-black text-gray-900 tracking-tight mb-4">Requirements</h2>
                      <div className="space-y-3">
                        {offer.requirements.split('\n').filter(r => r.trim()).map((req, idx) => (
                          <div key={idx} className="flex gap-3">
                            <CheckCircle2 size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                            <p className="text-sm font-bold text-gray-700">{req.replace(/^[-•*]\s*/, '')}</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                  
                  {/* SKILLS */}
                  {offer.required_skills?.length > 0 && (
                    <section>
                      <h2 className="text-xl font-black text-gray-900 tracking-tight mb-4">Required Skills</h2>
                      <div className="flex flex-wrap gap-2">
                        {offer.required_skills.map((skill, idx) => (
                          <span key={idx} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg font-black text-[10px] uppercase tracking-widest border border-indigo-100">
                            {skill.name}
                          </span>
                        ))}
                      </div>
                    </section>
                  )}
                </div>

                {/* RIGHT COL: ABOUT COMPANY & APPLY */}
                <div className="lg:w-72 shrink-0 space-y-6">
                  {error && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-bold">
                      {error}
                    </div>
                  )}
                  {applied ? (
                    <div className="flex items-center justify-center gap-3 py-5 bg-emerald-50 text-emerald-600 rounded-[24px] border border-emerald-100 font-black uppercase tracking-[2px] text-xs animate-fade-in shadow-sm">
                      <CheckCircle2 size={20} />
                      Application Submitted
                    </div>
                  ) : (
                    <button
                      onClick={handleApplyClick}
                      disabled={applying}
                      className="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-black uppercase tracking-[2px] text-xs shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-1 active:scale-95 transition-all border border-indigo-700 flex justify-center items-center gap-3"
                    >
                      {applying ? <Loader2 className="animate-spin" size={20} /> : 'Apply Now'}
                    </button>
                  )}

                  <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 space-y-4">
                    <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[2px]">About Company</h3>
                    <p className="text-sm font-bold text-gray-900">{offer.company_name}</p>
                    {offer.company_details?.wilaya && (
                      <p className="text-xs font-medium text-gray-500 flex items-center gap-1"><MapPin size={12}/> {offer.company_details.wilaya}</p>
                    )}
                    
                    <button
                      onClick={() => setShowCompany(true)}
                      className="w-full py-3 mt-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-100 transition-colors"
                    >
                      View Full Profile
                    </button>
                  </div>
                </div>

              </div>
              )}
            </div>

            {/* CONFIRMATION OVERLAY */}
            {showConfirm && (
              <div className="absolute inset-0 z-50 bg-white/90 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
                <div className="bg-white rounded-[32px] p-8 sm:p-12 max-w-md w-full shadow-2xl shadow-indigo-900/10 border border-indigo-50 text-center animate-slide-up">
                  <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-8 text-indigo-600 shadow-inner border border-indigo-100/50">
                    <Zap size={36} className="fill-indigo-100" />
                  </div>
                  <h3 className="text-3xl font-black text-gray-900 mb-4 tracking-tight leading-none">Confirm Application</h3>
                  <p className="text-gray-500 font-medium mb-10 leading-relaxed text-sm">
                    You are about to apply for <span className="font-bold text-gray-900">{offer.title}</span> at <span className="font-bold text-gray-900">{offer.company_name}</span>. This will securely share your student profile with them.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button 
                      onClick={() => setShowConfirm(false)}
                      className="flex-1 py-4 sm:py-5 bg-gray-50 text-gray-600 rounded-2xl font-black uppercase tracking-[2px] text-[10px] hover:bg-gray-100 hover:text-gray-900 transition-colors border border-gray-200 shadow-sm"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleConfirmApply}
                      className="flex-1 py-4 sm:py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-[2px] text-[10px] shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 active:scale-95 transition-all"
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              </div>
            )}

          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-20 gap-4">
            <p className="text-lg font-black text-gray-500">Offer not found.</p>
            <button onClick={onClose} className="px-6 py-2 bg-indigo-100 text-indigo-600 rounded-xl font-black text-sm hover:bg-indigo-200 transition-all">Close</button>
          </div>
        )}
      </div>
    </div>
  );
}
