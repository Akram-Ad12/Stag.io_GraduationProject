import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams, Navigate } from 'react-router-dom';
import {
  Plus,
  Users,
  CheckCircle2,
  MoreHorizontal,
  Edit2,
  Trash2,
  Globe,
  Zap,
  Loader2,
  FileText,
  TrendingUp,
  XCircle,
  Wifi,
  Clock,
  Calendar
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import { useAuth } from '../../context/AuthContext';
import { 
  getCompanyOffers, 
  createOffer, 
  updateOffer, 
  deleteOffer, 
  getAllCompanyApplications,
  acceptApplication,
  rejectApplication,
  uploadOfferImage,
  getOfferDetails,
  getOfferApplicants,
  getCompanyStats,
  getCompanyOfferStats,
  resetCompanyData,
  downloadCompanyAgreement
} from '../../api/companyApi';
import { getAllSkills } from '../../api/publicApi';
import { getMediaUrl } from '../../api/axios';

const XIcon = ({ size, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
);

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
    "49 - El M'Ghair", "50 - El Meniaa", "51 - Ouled Djellal", "52 - Bordj Baji Mokhtar",
    "53 - Béni Abbès", "54 - Timimoun", "55 - Touggourt", "56 - Djanet",
    "57 - In Salah", "58 - In Guezzam", "Remote"
];

function OverviewView({ stats, setShowOfferModal }) {
  if (!stats) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>;

  return (
    <div className="space-y-8">
      {/* REAL STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-indigo-600 p-8 rounded-3xl shadow-md border border-indigo-500 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full translate-x-10 -translate-y-10"></div>
          <div className="flex justify-between items-start mb-6 relative z-10 text-indigo-100">
            <p className="text-[11px] font-black uppercase tracking-[2px]">Total Applications</p>
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white">
              <Users size={20} />
            </div>
          </div>
          <div className="relative z-10">
            <h3 className="text-4xl font-black text-white tracking-tighter">{stats.overall.total}</h3>
            <p className="text-xs font-bold text-indigo-200 uppercase tracking-widest mt-2">All time</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6">
            <p className="text-[11px] font-black text-gray-500 uppercase tracking-[2px]">Pending</p>
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
              <MoreHorizontal size={20} />
            </div>
          </div>
          <div>
            <h3 className="text-4xl font-black text-gray-900 tracking-tighter">{stats.overall.pending}</h3>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">To review</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6">
            <p className="text-[11px] font-black text-gray-500 uppercase tracking-[2px]">Accepted</p>
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div>
            <h3 className="text-4xl font-black text-gray-900 tracking-tighter">{stats.overall.accepted + stats.overall.validated}</h3>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">Placed</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6">
            <p className="text-[11px] font-black text-gray-500 uppercase tracking-[2px]">Success Rate</p>
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
              <TrendingUp size={20} />
            </div>
          </div>
          <div>
            <h3 className="text-4xl font-black text-gray-900 tracking-tighter">
              {stats.overall.total > 0 ? Math.round(((stats.overall.accepted + stats.overall.validated) / stats.overall.total) * 100) : 0}%
            </h3>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">Conversion</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex justify-between items-center mb-8">
           <h3 className="text-2xl font-black text-gray-900 tracking-tight">Recent Offers</h3>
           <button onClick={() => setShowOfferModal(true)} className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline">Create New</button>
        </div>
        
        {stats.offers.length === 0 ? (
           <div className="py-12 text-center">
              <FileText size={48} className="mx-auto text-gray-200 mb-4" />
              <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No offers posted yet</p>
           </div>
        ) : (
           <div className="space-y-4">
              {stats.offers.slice(0, 3).map(offer => (
                 <div key={offer.offer_id} className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl border border-gray-100 hover:border-indigo-100 transition-colors">
                    <div>
                       <h4 className="font-bold text-gray-900">{offer.offer_title}</h4>
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{offer.total} Total Applicants</p>
                    </div>
                    <div className="flex gap-4">
                       <div className="text-center">
                          <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">{offer.pending}</p>
                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-tight">Pending</p>
                       </div>
                       <div className="text-center">
                          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{offer.accepted + offer.validated}</p>
                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-tight">Hired</p>
                       </div>
                    </div>
                 </div>
              ))}
           </div>
        )}
      </div>
    </div>
  );
}

function InternshipsView({ offers, loading, handleEdit, handleDelete, setShowOfferModal, setEditingOffer, setOfferForm }) {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-8 rounded-3xl border border-gray-200 shadow-sm mb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Recruiter Dashboard</h1>
          <p className="text-gray-500 font-medium mt-1">Manage your listings and review applicants.</p>
        </div>
        <button 
          onClick={() => { setEditingOffer(null); setOfferForm({title:'', description:'', location:'', requirements:'', status:'open', imageFile:null, type:'unpaid', salary:'', start_date: '', end_date: '', skills:[], is_remote:false}); setShowOfferModal(true); }}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-md hover:bg-indigo-700 transition-all shrink-0"
        >
          <Plus size={18} />
          Post Internship Offer
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>
      ) : offers.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-gray-200 shadow-sm">
          <FileText size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-black text-gray-900 mb-2">No offers posted yet</h3>
          <p className="text-gray-500 font-medium mb-6">Create your first internship listing to start attracting talent.</p>
          <button onClick={() => { setEditingOffer(null); setOfferForm({ title: '', description: '', location: '', requirements: '', status: 'open', imageFile: null, type: 'unpaid', salary: '', start_date: '', end_date: '', skills: [], is_remote: false }); setShowOfferModal(true); }} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-sm">
            Post First Offer
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50 text-left">
                  <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-[2px]">Role</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-[2px]">Location</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-[2px]">Duration</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-[2px]">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-[2px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {offers.map((offer) => (
                  <tr key={offer.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-gray-100 bg-indigo-50 flex items-center justify-center">
                          {offer.photo ? (
                            <img src={getMediaUrl(offer.photo)} alt="offer" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs font-black text-indigo-600 uppercase tracking-tighter">{(offer.title || 'In').substring(0, 2)}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{offer.title}</p>
                          <p className="text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-widest">{offer.type === 'paid' ? 'Paid' : 'Unpaid'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm font-medium text-gray-600">
                        {offer.is_remote ? (
                          <span className="flex items-center gap-1 text-emerald-600 font-black text-xs uppercase"><Wifi size={14} /> Remote</span>
                        ) : (
                          offer.wilaya || offer.location || '—'
                        )}
                      </td>
                    <td className="px-6 py-5">
                      <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                        {offer.duration_display || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${offer.status === 'open' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                        {offer.status === 'open' ? 'Open' : 'Closed'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => navigate(`/company/internships/${offer.id}`)} className="px-4 py-2 bg-indigo-50 text-indigo-600 font-black text-[10px] uppercase tracking-widest rounded-lg hover:bg-indigo-100 transition-colors mr-2">Manage</button>
                        <button onClick={() => handleEdit(offer)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><Edit2 size={16} /></button>
                        <button onClick={() => handleDelete(offer.id)} className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function CompanyOfferDetailView({ offers, handleEdit, handleAppResponse }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [offer, setOffer] = useState(offers.find(o => String(o.id) === id) || null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    loadOfferData();
  }, [id]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    if (applications.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const appId = params.get('appId');
      if (appId) {
        const matchingApp = applications.find(app => String(app.id) === appId);
        if (matchingApp) {
          setSelectedStudent(matchingApp);
        }
      }
    }
  }, [applications]);

  const loadOfferData = async () => {
    setLoading(true);
    try {
      if (!offer) {
        const resOffer = await getOfferDetails(id);
        setOffer(resOffer.data);
      }
      const resApps = await getOfferApplicants(id);
      setApplications(resApps.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const closeStudentView = () => {
    setSelectedStudent(null);
    navigate(`/company/internships/${id}`, { replace: true });
  };

  const handleLocalResponse = async (appId, action) => {
    await handleAppResponse(appId, action);
    loadOfferData();
    closeStudentView();
  };

  const handleDownloadAgreement = async (internshipId) => {
    try {
      const res = await downloadCompanyAgreement(internshipId);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `convention_stage_${internshipId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF download failed', err);
    }
  };

  if (loading) return (
    <Modal title="Loading..." onClose={() => navigate('/company/internships')}>
      <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>
    </Modal>
  );
  if (!offer) return (
    <Modal title="Error" onClose={() => navigate('/company/internships')}>
      <div className="py-20 text-center">
        <p className="font-black text-gray-500 text-xl mb-4">Offer not found</p>
        <button onClick={() => navigate('/company/internships')} className="px-6 py-2 bg-indigo-100 text-indigo-600 rounded-xl font-black text-sm">Go Back</button>
      </div>
    </Modal>
  );

  return (
    <Modal 
      title={selectedStudent ? "Digital CV" : "Offer Details"} 
      wide={true} 
      onClose={() => selectedStudent ? closeStudentView() : navigate('/company/internships')}
    >
      {selectedStudent ? (
        <div className="flex flex-col lg:flex-row gap-8 items-start w-full max-w-7xl mx-auto animate-fade-in">
            {/* STUDENT PROFILE (LEFT) */}
            <div className="flex-1 space-y-6 w-full lg:max-w-md">
              <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col items-center text-center">
                <div className="w-32 h-32 rounded-full overflow-hidden border-8 border-white shadow-xl bg-indigo-100 flex items-center justify-center shrink-0 mb-5 relative group">
                  {selectedStudent.student?.profile_image ? (
                    <img src={getMediaUrl(selectedStudent.student.profile_image)} alt="Student" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-5xl font-black text-indigo-600">{(selectedStudent.student?.full_name || 'S')[0]}</span>
                  )}
                </div>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">{selectedStudent.student?.full_name}</h3>
                <p className="text-indigo-600 font-bold text-sm mt-1">{selectedStudent.student?.email}</p>
                <div className="mt-4">
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest bg-gray-50 px-5 py-2 rounded-full border border-gray-100 shadow-sm">
                    📍 {selectedStudent.student?.wilaya || 'Algeria'}
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">Professional Summary</p>
                <p className="text-sm text-gray-600 font-medium leading-relaxed">
                  {selectedStudent.student?.professional_summary || <span className="text-gray-400 italic">No summary provided.</span>}
                </p>
              </div>

              <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-5">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Core Skills & Links</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedStudent.student?.skills?.length > 0 ? (
                    selectedStudent.student.skills.map((s, idx) => (
                      <span key={idx} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg font-black text-[10px] uppercase tracking-widest border border-indigo-100">
                        {s.name}
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 font-medium">No skills listed</p>
                  )}
                </div>
                <div className="flex gap-4 border-t border-gray-50 pt-4">
                   {selectedStudent.student?.github_link && (
                      <a href={selectedStudent.student.github_link} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1.5"><Globe size={14} /> GitHub</a>
                   )}
                   {selectedStudent.student?.portfolio_link && (
                      <a href={selectedStudent.student.portfolio_link} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1.5"><Globe size={14} /> Portfolio</a>
                   )}
                </div>
              </div>
            </div>

            {/* OFFER DETAILS & ACTIONS (RIGHT) */}
            <div className="flex-1 space-y-6 w-full">
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-[32px] p-8 text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <TrendingUp size={120} />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <span className="px-3 py-1 bg-white/20 rounded-lg text-[10px] font-black uppercase tracking-widest">
                      {offer?.type === 'paid' ? 'Paid' : 'Unpaid'}
                    </span>
                    {offer?.company_logo && (
                      <div className="w-10 h-10 rounded-xl bg-white p-2 flex items-center justify-center shrink-0">
                         <img src={getMediaUrl(offer.company_logo)} alt="" className="w-full h-full object-contain" />
                      </div>
                    )}
                  </div>
                  <h2 className="text-3xl font-black tracking-tight mb-2">{offer?.title}</h2>
                  <p className="text-indigo-100 font-medium text-sm flex items-center gap-2">
                     {offer?.company_name} • {offer?.is_remote ? 'Remote' : offer?.wilaya}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Offer Description</p>
                  <p className="text-sm text-gray-600 font-medium leading-relaxed whitespace-pre-wrap">{offer?.description}</p>
                </div>

                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Required Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {offer?.required_skills?.map((skill, index) => (
                      <span key={index} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg font-black text-[10px] uppercase tracking-widest border border-indigo-100">
                        {skill.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="pt-2">
                {selectedStudent.status === 'pending' ? (
                  <div className="flex gap-4">
                    <button 
                      onClick={closeStudentView}
                      className="flex-1 py-4 bg-gray-50 text-gray-500 rounded-2xl font-black text-[11px] uppercase tracking-widest border border-gray-200 hover:bg-gray-100 transition-colors"
                    >
                      Keep Pending
                    </button>
                    <button 
                      onClick={() => handleLocalResponse(selectedStudent.id, 'rejected')}
                      className="flex-1 py-4 bg-white text-rose-600 rounded-2xl font-black text-[11px] uppercase tracking-widest border-2 border-gray-100 hover:bg-rose-50 hover:border-rose-100 transition-colors"
                    >
                      Reject
                    </button>
                    <button 
                      onClick={() => handleLocalResponse(selectedStudent.id, 'accepted')}
                      className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[2px] shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-colors"
                    >
                      Accept Applicant
                    </button>
                  </div>
                ) : (
                  <div className="w-full flex items-center justify-between bg-white p-5 rounded-2xl border-2 border-gray-100">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedStudent.status === 'rejected' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                        {selectedStudent.status === 'rejected' ? <XCircle size={20} /> : <CheckCircle2 size={20} />}
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Application Status</p>
                        <p className="text-base font-black text-gray-900 mt-1 capitalize">{selectedStudent.status.replace(/_/g, ' ')}</p>
                      </div>
                    </div>
                    {selectedStudent.status === 'validated' ? (
                      <button 
                        onClick={() => handleDownloadAgreement(selectedStudent.id)} 
                        className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                      >
                        Download Agreement
                      </button>
                    ) : (
                      <button 
                        onClick={closeStudentView} 
                        className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                      >
                        Close View
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
        </div>
      ) : (
      <div className="space-y-8 animate-fade-in">
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        {/* HERO BANNER */}
        <div className="h-48 w-full bg-indigo-50 relative border-b border-gray-100">
          {offer.photo ? (
             <img src={getMediaUrl(offer.photo)} alt={offer.title} className="w-full h-full object-cover" />
          ) : (
             <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-indigo-100">
                <span className="text-6xl font-black text-indigo-200 uppercase tracking-tighter">
                   {(offer.title || 'In').substring(0, 2)}
                </span>
             </div>
          )}
        </div>
        
        {/* DETAILS */}
        <div className="p-8 flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-2">{offer.title}</h2>
            <div className="flex flex-wrap gap-3 items-center">
              <span className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${offer.status === 'open' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                {offer.status === 'open' ? 'Open' : 'Closed'}
              </span>
              <span className="text-sm font-bold text-gray-500">{offer.is_remote ? <span className="flex items-center gap-1"><Wifi size={14} /> Remote</span> : offer.wilaya || offer.location || 'Algeria'}</span>
              <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-md text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                {offer.duration_display || 'N/A'}
              </span>
            </div>
          </div>
          <button onClick={() => { navigate('/company/internships'); handleEdit(offer); }} className="px-6 py-3 bg-indigo-50 text-indigo-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-100 transition-colors flex items-center gap-2 shrink-0">
            <Edit2 size={16} /> Edit Offer
          </button>
        </div>
      </div>

      {/* QUICK STATS & DESCRIPTION & SKILLS CARD */}
      <div className="bg-white rounded-[32px] border border-gray-200 shadow-sm p-8 space-y-8">
        {/* QUICK STATS GRID */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 border-b border-gray-100 pb-6">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><Clock size={12} /> Duration</p>
            <p className="text-lg font-black text-gray-900">{offer.duration_display || 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
              {offer.type === 'paid' ? '💰' : '💳'} Pay Status
            </p>
            <p className="text-lg font-black text-gray-900 capitalize">{offer.type || 'Unpaid'}</p>
          </div>
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
        <div className="space-y-3">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Offer Description</p>
          {offer.description ? (
            <p className="text-sm text-gray-600 font-medium leading-relaxed whitespace-pre-wrap">{offer.description}</p>
          ) : (
            <p className="text-sm text-gray-400 font-medium italic">No description provided.</p>
          )}
        </div>

        {/* REQUIRED SKILLS */}
        <div className="space-y-3">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Required Skills</p>
          <div className="flex flex-wrap gap-2">
            {offer.required_skills?.length > 0 ? (
              offer.required_skills.map((skill, idx) => (
                <span key={idx} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg font-black text-[10px] uppercase tracking-widest border border-indigo-100">
                  {skill.name}
                </span>
              ))
            ) : (
              <p className="text-sm text-gray-400 font-medium italic">No specific skills required.</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center px-2 pt-4">
        <h3 className="text-2xl font-black text-gray-900 tracking-tight">Applicants</h3>
        <div className="bg-indigo-50 px-4 py-1.5 rounded-xl border border-indigo-100 text-[11px] font-black text-indigo-600 uppercase tracking-widest">
          {applications.length} Total
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-gray-200 shadow-sm">
          <Users size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="font-black text-gray-900 text-xl">No applicants yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {applications.map((app) => (
            <div key={app.id} className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xl overflow-hidden border border-gray-100 shrink-0">
                  {app.student?.profile_image ? (
                    <img src={getMediaUrl(app.student.profile_image)} alt="Student" className="w-full h-full object-cover" />
                  ) : (
                    <span>{(app.student?.full_name || 'S')[0]}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-lg font-black text-gray-900 truncate">{app.student?.full_name}</h4>
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mt-1 truncate">{app.offer_title}</p>
                </div>
              </div>
              <div className="mb-4">
                <StatusBadge status={app.status} />
              </div>
              <p className="text-[10px] text-gray-400 font-bold mb-4">Applied {new Date(app.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              
              <div className="flex gap-2 pt-4 border-t border-gray-100 mt-auto">
                <button 
                  onClick={() => setSelectedStudent(app)}
                  className="flex-1 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-100 transition-colors"
                >
                  Review Application
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      </div>
      )}
    </Modal>
  );
}

function StatsView({ stats }) {
  if (!stats) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>;

  const total = stats.overall.total || 1; // avoid div by zero
  const pendingPerc = (stats.overall.pending / total) * 100;
  const acceptedPerc = ((stats.overall.accepted + stats.overall.validated) / total) * 100;
  const rejectedPerc = (stats.overall.rejected / total) * 100;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Recruitment Analytics</h1>
          <p className="text-gray-500 font-medium mt-1">Real-time breakdown of your internship applications.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* DONUT CHART (SVG) */}
        <div className="lg:col-span-1 bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex flex-col items-center">
           <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-8">Overall Funnel</h3>
           <div className="relative w-48 h-48">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                 {/* Background circle */}
                 <circle cx="18" cy="18" r="15.9" fill="transparent" stroke="#f3f4f6" strokeWidth="3.8"></circle>
                 
                 {/* Accepted segment */}
                 <circle cx="18" cy="18" r="15.9" fill="transparent" stroke="#4f46e5" strokeWidth="4" 
                    strokeDasharray={`${acceptedPerc} ${100 - acceptedPerc}`} strokeDashoffset="0"></circle>
                 
                 {/* Pending segment */}
                 <circle cx="18" cy="18" r="15.9" fill="transparent" stroke="#f59e0b" strokeWidth="4" 
                    strokeDasharray={`${pendingPerc} ${100 - pendingPerc}`} strokeDashoffset={`-${acceptedPerc}`}></circle>
                 
                 {/* Rejected segment */}
                 <circle cx="18" cy="18" r="15.9" fill="transparent" stroke="#f43f5e" strokeWidth="4" 
                    strokeDasharray={`${rejectedPerc} ${100 - rejectedPerc}`} strokeDashoffset={`-${acceptedPerc + pendingPerc}`}></circle>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                 <span className="text-2xl font-black text-gray-900 tracking-tighter">{stats.overall.total}</span>
                 <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total</span>
              </div>
           </div>
           
           <div className="mt-8 w-full space-y-3">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
                    <span className="text-xs font-bold text-gray-600">Accepted</span>
                 </div>
                 <span className="text-xs font-black text-gray-900">{stats.overall.accepted + stats.overall.validated}</span>
              </div>
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <span className="text-xs font-bold text-gray-600">Pending</span>
                 </div>
                 <span className="text-xs font-black text-gray-900">{stats.overall.pending}</span>
              </div>
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                    <span className="text-xs font-bold text-gray-600">Rejected</span>
                 </div>
                 <span className="text-xs font-black text-gray-900">{stats.overall.rejected}</span>
              </div>
           </div>
        </div>

        {/* PER-OFFER TABLE */}
        <div className="lg:col-span-2 bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
           <div className="p-8 border-b border-gray-50 bg-gray-50/50">
              <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Performance per Offer</h3>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full">
                 <thead>
                    <tr className="text-left border-b border-gray-50">
                       <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Offer</th>
                       <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Applied</th>
                       <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center text-indigo-600">Hired</th>
                       <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center text-amber-500">Pending</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50">
                    {stats.offers.map(offer => (
                       <tr key={offer.offer_id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-8 py-5">
                             <p className="text-sm font-bold text-gray-900">{offer.offer_title}</p>
                          </td>
                          <td className="px-8 py-5 text-center text-sm font-black text-gray-700">{offer.total}</td>
                          <td className="px-8 py-5 text-center text-sm font-black text-indigo-600">{offer.accepted + offer.validated}</td>
                          <td className="px-8 py-5 text-center text-sm font-black text-amber-500">{offer.pending}</td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      </div>
    </div>
  );
}

export default function CompanyDashboard() {
  const { user } = useAuth();
  const [offers, setOffers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [loadingApps, setLoadingApps] = useState(true);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [offerForm, setOfferForm] = useState({ title: '', description: '', location: '', requirements: '', is_active: true, imageFile: null, type: 'unpaid', salary: '', start_date: '', end_date: '', skills: [], is_remote: false });
  const [formError, setFormError] = useState('');
  const [savingOffer, setSavingOffer] = useState(false);
  const [offerToDelete, setOfferToDelete] = useState(null);
  const [allSkills, setAllSkills] = useState([]);
  const [companyStats, setCompanyStats] = useState(null);

  // Reset Modal State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState('');

  useEffect(() => { 
    loadAllData(true); 
    loadAllSkills();
    const interval = setInterval(() => {
      loadAllData(false);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadAllData = async (showLoading = true) => {
    if (showLoading) {
      setLoadingOffers(true);
      setLoadingApps(true);
    }
    try {
      const [offersRes, appsRes, statsRes] = await Promise.allSettled([
        getCompanyOffers(),
        getAllCompanyApplications(),
        getCompanyStats()
      ]);
      if (offersRes.status === 'fulfilled') setOffers(offersRes.value.data);
      if (appsRes.status === 'fulfilled') setApplications(appsRes.value.data);
      if (statsRes.status === 'fulfilled') setCompanyStats(statsRes.value.data);
    } catch (err) {
      console.error('Failed to load data', err);
    } finally {
      if (showLoading) {
        setLoadingOffers(false);
        setLoadingApps(false);
      }
    }
  };

  const loadAllSkills = async () => {
    try { const res = await getAllSkills(); setAllSkills(res.data); }
    catch (err) { console.error('Failed to load skills', err); }
  };

  const loadCompanyStats = async (showLoading = true) => {
    try { const res = await getCompanyStats(); setCompanyStats(res.data); }
    catch (err) { console.error('Failed to load stats', err); }
  };

  const loadOffers = async (showLoading = true) => {
    if (showLoading) setLoadingOffers(true);
    try { const res = await getCompanyOffers(); setOffers(res.data); }
    catch (err) { console.error('Failed to load offers', err); }
    finally { if (showLoading) setLoadingOffers(false); }
  };

  const loadApps = async (showLoading = true) => {
    if (showLoading) setLoadingApps(true);
    try { const res = await getAllCompanyApplications(); setApplications(res.data); }
    catch (err) { console.error('Failed to load applications', err); }
    finally { if (showLoading) setLoadingApps(false); }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setResetting(true);
    setResetError('');
    try {
      await resetCompanyData(resetPassword);
      setShowResetModal(false);
      setResetPassword('');
      loadAllData(true);
    } catch (err) {
      setResetError(err.response?.data?.detail || 'Invalid password or reset failed.');
    } finally {
      setResetting(false);
    }
  };

  const handleOfferSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSavingOffer(true);
    try {
      let savedOffer;
      if (editingOffer) { 
        const res = await updateOffer(editingOffer.id, {
          title: offerForm.title,
          description: offerForm.description,
          location: offerForm.is_remote ? '' : offerForm.location,
          wilaya: offerForm.is_remote ? '' : offerForm.location,
          requirements: offerForm.requirements,
          status: offerForm.status,
          type: offerForm.type,
          salary_per_week: offerForm.type === 'paid' ? offerForm.salary : null,
          start_date: offerForm.start_date || null,
          end_date: offerForm.end_date || null,
          skill_ids: offerForm.skills,
          is_remote: offerForm.is_remote,
        });
        savedOffer = res.data;
      } else { 
        const res = await createOffer({
          title: offerForm.title,
          description: offerForm.description,
          location: offerForm.is_remote ? '' : offerForm.location,
          wilaya: offerForm.is_remote ? '' : offerForm.location,
          requirements: offerForm.requirements,
          status: offerForm.status,
          type: offerForm.type,
          salary_per_week: offerForm.type === 'paid' ? offerForm.salary : null,
          start_date: offerForm.start_date || null,
          end_date: offerForm.end_date || null,
          skill_ids: offerForm.skills,
          is_remote: offerForm.is_remote,
        });
        savedOffer = res.data;
      }

      if (offerForm.imageFile) {
        await uploadOfferImage(savedOffer.id || editingOffer.id, offerForm.imageFile);
      }

      setShowOfferModal(false);
      setEditingOffer(null);
      loadOffers();
    } catch (err) {
      setFormError(JSON.stringify(err.response?.data) || 'Failed to save. Check required fields.');
    } finally {
      setSavingOffer(false);
    }
  };

  const handleEdit = (offer) => {
    setEditingOffer(offer);
    setOfferForm({
      title: offer.title,
      description: offer.description || '',
      location: offer.wilaya || offer.location || '',
      requirements: offer.requirements || '',
      status: offer.status || 'open',
      imageFile: null,
      type: offer.type || 'unpaid',
      salary: offer.salary_per_week || '',
      start_date: offer.start_date || '',
      end_date: offer.end_date || '',
      skills: offer.required_skills ? offer.required_skills.map(s => s.id) : [],
      is_remote: offer.is_remote || false,
    });
    setShowOfferModal(true);
  };

  const handleDelete = (id) => {
    setOfferToDelete(id);
  };

  const confirmDelete = async () => {
    if (!offerToDelete) return;
    try { 
      await deleteOffer(offerToDelete); 
      setOfferToDelete(null); 
      loadOffers(); 
    } catch (err) { 
      console.error('Delete failed', err); 
    }
  };

  const handleAppResponse = async (id, action) => {
    try {
      if (action === 'accepted') await acceptApplication(id);
      else await rejectApplication(id);
      loadApps();
    } catch (err) { console.error('Action failed', err); }
  };

  return (
    <DashboardLayout role="company">
      <div className="p-6 md:p-8 lg:p-12 space-y-8 animate-fade-in bg-gray-50 min-h-screen pb-24">

        <Routes>
          <Route path="/" element={<Navigate to="internships" replace />} />
          <Route path="/dashboard" element={<OverviewView stats={companyStats} setShowOfferModal={setShowOfferModal} />} />
          <Route path="/internships/*" element={
            <>
              <InternshipsView offers={offers} loading={loadingOffers} handleEdit={handleEdit} handleDelete={handleDelete} setShowOfferModal={setShowOfferModal} setEditingOffer={setEditingOffer} setOfferForm={setOfferForm} />
              <Routes>
                <Route path=":id" element={<CompanyOfferDetailView offers={offers} handleEdit={handleEdit} handleAppResponse={handleAppResponse} />} />
              </Routes>
            </>
          } />
          <Route path="/stats" element={<StatsView stats={companyStats} />} />
        </Routes>

        {showOfferModal && (
          <Modal title={editingOffer ? 'Edit Offer' : 'New Internship Offer'} onClose={() => { setShowOfferModal(false); setFormError(''); }}>
            <form onSubmit={handleOfferSubmit} className="space-y-5">
              {formError && <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-sm font-bold">{formError}</div>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Job Title *</label>
                  <input className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-50 focus:outline-none transition-all" value={offerForm.title} onChange={e => setOfferForm({...offerForm, title: e.target.value})} required placeholder="e.g. Frontend Engineering Intern" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Location *</label>
                  <select
                    className={`w-full px-4 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-900 focus:ring-2 focus:ring-indigo-50 focus:outline-none transition-all ${offerForm.is_remote ? 'opacity-40 cursor-not-allowed' : ''}`}
                    value={offerForm.location}
                    onChange={e => setOfferForm({...offerForm, location: e.target.value})}
                    disabled={offerForm.is_remote}
                  >
                    <option value="" disabled>Select a location</option>
                    {ALGERIAN_WILAYAS.map(wilaya => (
                      <option key={wilaya} value={wilaya}>{wilaya}</option>
                    ))}
                  </select>
                </div>

                {/* Remote toggle */}
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Remote Internship</label>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-200 cursor-pointer">
                    <input
                      type="checkbox"
                      id="remote-toggle"
                      className="w-5 h-5 accent-indigo-600 rounded"
                      checked={offerForm.is_remote}
                      onChange={e => setOfferForm({...offerForm, is_remote: e.target.checked, location: e.target.checked ? '' : offerForm.location})}
                    />
                    <label htmlFor="remote-toggle" className="text-sm font-bold text-gray-700 cursor-pointer select-none">
                      This is a remote/online internship (no wilaya or location required)
                    </label>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Type *</label>
                  <select className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-50 focus:outline-none transition-all" value={offerForm.type} onChange={e => setOfferForm({...offerForm, type: e.target.value})}>
                    <option value="unpaid">Unpaid</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
                {offerForm.type === 'paid' && (
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Weekly Stipend (DZD) *</label>
                    <input type="number" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-50 focus:outline-none transition-all" value={offerForm.salary} onChange={e => setOfferForm({...offerForm, salary: e.target.value})} required placeholder="e.g. 5000" min="0" />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Start Date *</label>
                  <input
                    type="date"
                    required
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-50 focus:outline-none transition-all"
                    value={offerForm.start_date}
                    onChange={e => setOfferForm({...offerForm, start_date: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest">End Date *</label>
                  <input
                    type="date"
                    required
                    min={offerForm.start_date || undefined}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-50 focus:outline-none transition-all"
                    value={offerForm.end_date}
                    onChange={e => setOfferForm({...offerForm, end_date: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Offer Status *</label>
                <select className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-50 focus:outline-none transition-all" value={offerForm.status} onChange={e => setOfferForm({...offerForm, status: e.target.value})}>
                  <option value="open">Open (Accepting Applicants)</option>
                  <option value="closed">Closed (Not Accepting)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Offer Picture</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={e => setOfferForm({...offerForm, imageFile: e.target.files[0]})}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-500 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-50 focus:outline-none transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-black file:uppercase file:tracking-widest file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Description *</label>
                <textarea className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl font-medium text-gray-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-50 focus:outline-none transition-all min-h-[120px] resize-none" value={offerForm.description} onChange={e => setOfferForm({...offerForm, description: e.target.value})} required placeholder="Describe the role and what the intern will work on..." />
              </div>

              <div className="space-y-4">
                <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Target Skills</label>
                <div className="flex flex-wrap gap-2 min-h-[40px] p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  {offerForm.skills.length === 0 && <p className="text-[10px] font-bold text-gray-400 italic">No skills selected yet</p>}
                  {offerForm.skills.map(skillId => {
                    const skill = allSkills.find(s => s.id === skillId);
                    return (
                      <span key={skillId} className="flex items-center gap-2 px-3 py-1 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest">
                        {skill?.name || 'Skill'}
                        <button type="button" onClick={() => setOfferForm({...offerForm, skills: offerForm.skills.filter(id => id !== skillId)})}>
                          <XIcon size={12} />
                        </button>
                      </span>
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-2">
                  {allSkills.filter(s => !offerForm.skills.includes(s.id)).slice(0, 15).map(skill => (
                    <button
                      type="button"
                      key={skill.id}
                      onClick={() => setOfferForm({...offerForm, skills: [...offerForm.skills, skill.id]})}
                      className="px-3 py-1 bg-white border border-gray-200 text-gray-500 rounded-lg text-[9px] font-black uppercase tracking-widest hover:border-indigo-200 hover:text-indigo-600 transition-all"
                    >
                      + {skill.name}
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" disabled={savingOffer} className="w-full py-4 mt-2 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest text-[11px] shadow-sm hover:bg-indigo-700 transition-all disabled:opacity-70 flex justify-center items-center gap-2">
                {savingOffer ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : (editingOffer ? 'Update Offer' : 'Publish Offer')}
              </button>
            </form>
          </Modal>
        )}

        {/* DELETE OFFER MODAL */}
        {offerToDelete && (
          <Modal title="Delete Internship Offer" onClose={() => setOfferToDelete(null)}>
            <div className="space-y-6 pt-4 pb-2">
              <div className="flex items-center justify-center w-20 h-20 bg-rose-50 border border-rose-100 text-rose-600 rounded-full mx-auto mb-6">
                <Trash2 size={32} />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-black text-gray-900">Are you absolutely sure?</h3>
                <p className="text-gray-500 font-medium">This action cannot be undone. This will permanently delete the internship offer and all of its applications.</p>
              </div>
              <div className="flex gap-4 pt-6 mt-4">
                <button 
                  onClick={() => setOfferToDelete(null)}
                  className="flex-1 py-4 bg-white border border-gray-200 text-gray-700 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-gray-50 hover:text-gray-900 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 py-4 bg-rose-600 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-md hover:bg-rose-700 transition-colors"
                >
                  Yes, Delete Offer
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* RESET MODAL */}
        {showResetModal && (
          <div className="fixed inset-0 z-[100] bg-gray-900/40 flex items-center justify-center p-6 animate-fade-in" onClick={() => setShowResetModal(false)}>
            <div className="bg-white rounded-[32px] p-8 sm:p-12 max-w-md w-full shadow-2xl shadow-rose-900/10 border border-rose-50 animate-slide-up" onClick={e => e.stopPropagation()}>
              <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto mb-8 text-rose-600 shadow-inner border border-rose-100/50">
                <Globe size={36} className="text-rose-500" />
              </div>
              <h3 className="text-3xl font-black text-gray-900 mb-4 tracking-tight leading-none text-center">Reset Dashboard</h3>
              <p className="text-gray-500 font-medium mb-6 leading-relaxed text-sm text-center">
                This action will permanently delete <span className="font-bold text-rose-600">ALL your company's offers and applications</span>. Enter your password to confirm.
              </p>
              
              <form onSubmit={handleResetSubmit} className="space-y-6">
                <div>
                  <input
                    type="password"
                    required
                    placeholder="Enter your password"
                    value={resetPassword}
                    onChange={e => setResetPassword(e.target.value)}
                    className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl font-bold text-gray-900 focus:bg-white focus:border-rose-500 focus:outline-none transition-all text-center"
                  />
                  {resetError && <p className="text-rose-500 text-xs font-bold mt-2 text-center">{resetError}</p>}
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    type="button"
                    onClick={() => setShowResetModal(false)}
                    className="flex-1 py-4 bg-gray-50 text-gray-600 rounded-2xl font-black uppercase tracking-[2px] text-[10px] hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={resetting || !resetPassword}
                    className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-[2px] text-[10px] shadow-lg shadow-rose-200 hover:bg-rose-700 transition-all disabled:opacity-50"
                  >
                    {resetting ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Confirm Wipe'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}



      </div>
    </DashboardLayout>
  );
}
