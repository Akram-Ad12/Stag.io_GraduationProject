import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import {
  Search,
  Bookmark,
  Zap,
  Globe,
  CheckCircle2,
  XCircle,
  Timer,
  FileText,
  Loader2,
  Download,
  Wifi,
  Bell
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import StatusBadge from '../../components/StatusBadge';
import {
  getOffers, 
  getMyApplications, 
  applyForOffer,
  downloadStudentAgreement,
  getStudentNotifications,
  markStudentNotificationRead
} from '../../api/studentApi';
import { getMediaUrl } from '../../api/axios';
import StudentOfferModal from '../../components/StudentOfferModal';

// ─── EXPLORE VIEW ───────────────────────────────────────────────────────────
function ExploreView({ offers, loading, loadData, handleApply, onSelectOffer }) {
  const [search, setSearch]         = useState('');
  const [type, setType]             = useState('all');
  const [wilaya, setWilaya]         = useState('all');
  const [remoteOnly, setRemoteOnly]  = useState(false);
  const [duration, setDuration]     = useState('none'); // 'short' | 'medium' | 'long'
  const [orderBy, setOrderBy]       = useState('newest');

  const wilayas = [
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
    "57 - In Salah", "58 - In Guezzam"
  ];

  // Apply all client-side filters & sorts
  const filteredOffers = offers
    .filter(o => {
      const matchesType   = type === 'all' || o.type === type;
      const offerWilaya = o.wilaya || o.location || '';
      const matchesWilaya = wilaya === 'all' || 
        (offerWilaya && (
          offerWilaya.toLowerCase().includes(wilaya.toLowerCase()) || 
          wilaya.toLowerCase().includes(offerWilaya.toLowerCase())
        ));
      const matchesRemote = !remoteOnly || o.is_remote === true;
      const matchesSearch = !search ||
        o.title?.toLowerCase().includes(search.toLowerCase()) ||
        o.company_name?.toLowerCase().includes(search.toLowerCase());

      if (duration !== 'none') {
        if (!o.start_date || !o.end_date) return false;
        const start = new Date(o.start_date);
        const end = new Date(o.end_date);
        const days = (end - start) / (1000 * 60 * 60 * 24);
        
        if (duration === 'short' && days > 28) return false;
        if (duration === 'medium' && (days <= 28 || days >= 60)) return false;
        if (duration === 'long' && days < 60) return false;
      }

      return matchesType && matchesWilaya && matchesRemote && matchesSearch;
    })
    .sort((a, b) => {
      if (orderBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
      if (orderBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
      return 0;
    });

  const activeFilters = [
    type !== 'all',
    wilaya !== 'all',
    duration !== 'none',
    remoteOnly,
  ].filter(Boolean).length;

  const resetFilters = () => { setType('all'); setWilaya('all'); setDuration('none'); setRemoteOnly(false); setOrderBy('newest'); };

  const selectClass = "px-4 py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-sm text-gray-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 focus:outline-none transition-all appearance-none cursor-pointer";
  const activeFilterBtn = "px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all";
  const inactiveFilterBtn = "px-4 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl font-black text-xs uppercase tracking-widest hover:border-indigo-200 hover:text-indigo-600 transition-all";

  return (
    <div className="space-y-10">
      {/* HERO SEARCH */}
      <div className="max-w-4xl mx-auto text-center space-y-8 py-10">
        <h1 className="text-6xl font-black text-gray-900 tracking-tight leading-[0.9]">
          Find your dream <br />
          <span className="text-indigo-600 italic">internship offer.</span>
        </h1>
        <p className="text-xl text-gray-500 font-medium max-w-xl mx-auto">
          Verified opportunities matched to your profile.
        </p>
        
        <div className="flex flex-col md:flex-row items-center gap-4 max-w-4xl mx-auto mt-12 relative z-10">
          <div className="relative group w-full">
            <div className="absolute inset-0 bg-indigo-100 blur-xl opacity-50 group-focus-within:opacity-100 transition-opacity rounded-[32px]"></div>
            <div className="relative">
              <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={24} />
              <input 
                type="text" 
                placeholder="Search by role, company or keywords..."
                className="w-full pl-20 pr-6 py-6 bg-white border border-gray-200 rounded-[32px] font-bold text-gray-900 shadow-lg focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 focus:outline-none transition-all text-lg"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadData(search, type)}
              />
            </div>
          </div>
          <button 
            onClick={() => loadData(search, type)}
            className="px-10 py-6 bg-indigo-600 text-white rounded-[32px] font-black uppercase tracking-widest text-xs hover:bg-indigo-700 transition-all shadow-md active:scale-95 shrink-0"
          >
            Search
          </button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white border border-gray-100 rounded-[28px] shadow-sm px-6 py-5">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Filter icon + label */}
          <div className="flex items-center gap-2 text-gray-500 shrink-0">
            <Bookmark size={16} />
            <span className="text-xs font-black uppercase tracking-widest">Filters</span>
            {activeFilters > 0 && (
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[9px] font-black flex items-center justify-center">{activeFilters}</span>
            )}
          </div>

          <div className="w-px h-6 bg-gray-200 hidden md:block" />

          {/* Type */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Type</span>
            <select value={type} onChange={(e) => setType(e.target.value)} className={selectClass}>
              <option value="all">All Types</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>

          {/* Wilaya */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Wilaya</span>
            <select value={wilaya} onChange={(e) => setWilaya(e.target.value)} className={selectClass}>
              <option value="all">All Wilayas</option>
              {wilayas.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>

          {/* Duration checkboxes */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Duration</span>
            <div className="flex gap-1.5">
              {[
                { value: 'short', label: 'Short (14-28d)' },
                { value: 'medium', label: 'Medium (29-60d)' },
                { value: 'long', label: 'Long (60+d)' },
              ].map(d => (
                <label key={d.value} className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${duration === d.value ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-200'}`}>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={duration === d.value}
                    onChange={() => setDuration(duration === d.value ? 'none' : d.value)}
                  />
                  <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">{d.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Order by dropdown */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Order By</span>
            <select
              value={orderBy}
              onChange={e => setOrderBy(e.target.value)}
              className={selectClass}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>

          {/* Remote checkbox */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Remote</span>
            <label className={`flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer transition-all ${remoteOnly ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-200'}`}>
              <input
                type="checkbox"
                className="hidden"
                checked={remoteOnly}
                onChange={e => setRemoteOnly(e.target.checked)}
              />
              <Wifi size={14} className={remoteOnly ? 'text-white' : 'text-gray-400'} />
              <span className="text-[10px] font-black uppercase tracking-widest">Remote only</span>
            </label>
          </div>

          {/* Reset */}
          {activeFilters > 0 && (
            <button onClick={resetFilters} className="ml-auto text-xs font-black text-rose-500 hover:text-rose-700 transition-colors uppercase tracking-widest">
              ✕ Clear all
            </button>
          )}
        </div>

        {/* Results count */}
        <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
            {filteredOffers.length} result{filteredOffers.length !== 1 ? 's' : ''} found
          </p>
          {wilaya !== 'all' && (
            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-100">
              📍 {wilaya}
            </span>
          )}
        </div>
      </div>

      {/* OFFERS GRID */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-indigo-600" size={48} />
        </div>
      ) : filteredOffers.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-[40px] border border-gray-100 shadow-sm">
          <FileText size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-black text-gray-900 mb-2">No internship offers found</h3>
          <p className="text-gray-500 font-medium">Try a different search term or clear filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredOffers.map((offer) => (
            <div key={offer.id} className="bg-white rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:border-indigo-100 hover:-translate-y-1 transition-all group flex flex-col h-full overflow-hidden">
              <div className="h-32 bg-indigo-50 w-full relative shrink-0">
                {offer.photo ? (
                  <img src={getMediaUrl(offer.photo)} alt="Cover" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-indigo-50" />
                )}
                <div className="absolute -bottom-6 left-6 w-16 h-16 rounded-2xl bg-white flex items-center justify-center text-indigo-600 font-black text-2xl border-4 border-white shadow-sm overflow-hidden group-hover:scale-105 transition-transform">
                  {offer.company_logo ? (
                    <img src={getMediaUrl(offer.company_logo)} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <span>{(offer.company_name || 'C')[0]}</span>
                  )}
                </div>
              </div>

              <div className="flex-1 p-8 pt-10 flex flex-col">
                <div className="flex-1">
                  <h3 className="text-2xl font-black text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors leading-tight">{offer.title}</h3>
                  <p className="text-sm font-bold text-gray-500 mb-8">{offer.company_name}</p>

                  <div className="grid grid-cols-2 gap-4 border-t border-b border-gray-100 py-6 mb-8">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Location</p>
                      <p className="text-sm font-black text-gray-900 truncate">
                        {offer.is_remote ? (
                          <span className="flex items-center gap-1 text-emerald-600">
                            <Wifi size={12} /> Remote
                          </span>
                        ) : (
                          offer.wilaya || 'Algeria'
                        )}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</p>
                      <p className="text-sm font-black text-gray-900">{offer.type === 'paid' ? 'Paid' : 'Unpaid'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Duration</p>
                      <p className="text-sm font-black text-gray-900">{offer.duration_display || 'N/A'}</p>
                    </div>
                    {offer.type === 'paid' && offer.salary_per_week && (
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Salary</p>
                        <p className="text-sm font-black text-emerald-600">{offer.salary_per_week} DA/wk</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 mt-auto">
                  <button 
                    onClick={() => onSelectOffer(offer.id)} 
                    className="flex-1 py-3.5 bg-gray-50 text-gray-700 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-100 hover:text-gray-900 transition-all border border-gray-200"
                  >
                    View Details
                  </button>
                  {offer.already_applied ? (
                    <div className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 font-black uppercase tracking-widest text-[10px] animate-fade-in">
                      <CheckCircle2 size={14} /> Applied
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleApply(offer.id)} 
                      className="flex-1 py-3.5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-sm transition-all active:scale-95 hover:bg-indigo-700 hover:shadow-md"
                    >
                      Apply Now
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


// ─── APPLICATIONS VIEW ────────────────────────────────────────────────────────
function ApplicationsView({ applications, loading, handleDownloadAgreement }) {
  return (
    <div className="space-y-10">
      <div className="flex justify-between items-center px-4">
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">My Applications</h2>
        <div className="bg-indigo-50 px-6 py-2 rounded-2xl border border-indigo-100 shadow-sm text-xs font-black text-indigo-600 uppercase tracking-widest">
          {applications.length} Total
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-indigo-600" size={48} />
        </div>
      ) : applications.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-[40px] border border-gray-100 shadow-sm">
          <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-gray-400">
            <FileText size={40} />
          </div>
          <h3 className="text-xl font-black text-gray-900">No applications yet</h3>
          <p className="text-gray-500 font-medium mt-2">Start exploring and apply for your first internship offer!</p>
        </div>
      ) : (
        <div className="space-y-6 px-4">
          {applications.map((app) => (
            <div key={app.id} className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-8 group hover:border-indigo-100 hover:shadow-md transition-all">
              <div className="flex items-center gap-6 w-full lg:w-auto">
                <div className="w-20 h-20 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100 overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                  {app.company_logo ? (
                    <img src={getMediaUrl(app.company_logo)} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-black text-indigo-600">{(app.company_name || 'C')[0]}</span>
                  )}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors leading-tight">{app.offer_title || app.subject}</h3>
                  <p className="text-[lg] font-bold text-gray-500 mb-2">{app.company_name}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-indigo-100">
                      {app.offer_duration} {app.offer_duration === 1 ? 'Month' : 'Months'}
                    </span>
                    {app.offer_skills?.slice(0, 3).map(sk => (
                      <span key={sk.id} className="px-2 py-1 bg-gray-50 text-gray-500 rounded-lg text-[9px] font-black uppercase tracking-widest border border-gray-100">
                        {sk.name}
                      </span>
                    ))}
                  </div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Applied {new Date(app.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* STATUS TRACK */}
              <div className="flex items-center gap-4">
                {[
                  { label: 'Applied', done: true, icon: CheckCircle2 },
                  { label: 'Review', done: app.status !== 'pending', icon: Timer },
                  { label: 'Decision', done: ['validated', 'rejected'].includes(app.status), icon: app.status === 'rejected' ? XCircle : CheckCircle2 }
                ].map((step, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${step.done ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                        <step.icon size={20} />
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-widest mt-2 ${step.done ? 'text-indigo-600' : 'text-gray-400'}`}>{step.label}</span>
                    </div>
                    {idx < 2 && <div className={`w-8 h-0.5 rounded-full mb-5 ${step.done ? 'bg-indigo-600' : 'bg-gray-200'}`}></div>}
                  </div>
                ))}
              </div>

              <div className="shrink-0 flex flex-col items-end gap-4">
                <StatusBadge status={app.status} />
                {app.status === 'validated' && (
                  <button 
                    onClick={() => handleDownloadAgreement(app.id)}
                    className="flex items-center gap-2 px-6 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-100 transition-all border border-emerald-200"
                  >
                    <Download size={14} /> Agreement
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── NOTIFICATIONS VIEW ───────────────────────────────────────────────────────
function NotificationsView({ notifications, loading, handleDownloadAgreement, markAsRead }) {
  return (
    <div className="space-y-10">
      <div className="flex justify-between items-center px-4">
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Notifications</h2>
        <div className="bg-indigo-50 px-6 py-2 rounded-2xl border border-indigo-100 shadow-sm text-xs font-black text-indigo-600 uppercase tracking-widest">
          {notifications.filter(n => !n.is_read).length} Unread
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-indigo-600" size={48} />
        </div>
      ) : notifications.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-[40px] border border-gray-100 shadow-sm">
          <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-gray-400">
            <Bell size={40} />
          </div>
          <h3 className="text-xl font-black text-gray-900">All caught up!</h3>
          <p className="text-gray-500 font-medium mt-2">You don't have any notifications right now.</p>
        </div>
      ) : (
        <div className="space-y-4 px-4">
          {notifications.map((notif) => (
            <div 
              key={notif.id} 
              onMouseEnter={() => { if(!notif.is_read) markAsRead(notif.id) }}
              className={`p-6 rounded-[24px] border flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-all ${notif.is_read ? 'bg-white border-gray-100 shadow-sm opacity-70' : 'bg-indigo-50 border-indigo-200 shadow-md ring-4 ring-white'}`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                  notif.notification_type === 'agreement_ready' ? 'bg-emerald-100 text-emerald-600 border-emerald-200' :
                  notif.notification_type === 'internship_rejected' ? 'bg-rose-100 text-rose-600 border-rose-200' :
                  'bg-indigo-100 text-indigo-600 border-indigo-200'
                }`}>
                  {notif.notification_type === 'agreement_ready' ? <CheckCircle2 size={24} /> :
                   notif.notification_type === 'internship_rejected' ? <XCircle size={24} /> :
                   <Bell size={24} />}
                </div>
                <div>
                  <h4 className="text-lg font-black text-gray-900 leading-tight">
                    {notif.notification_type === 'agreement_ready' ? 'Application Validated' :
                     notif.notification_type === 'internship_rejected' ? 'Application Rejected' :
                     'Update on your application'}
                  </h4>
                  <p className="text-sm font-bold text-gray-600 mt-1">{notif.message}</p>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">
                    {new Date(notif.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              {notif.has_agreement && (
                <button 
                  onClick={() => handleDownloadAgreement(notif.internship_id)}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-[2px] hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200 shrink-0"
                >
                  <Download size={16} /> Download PDF
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MAIN DASHBOARD ────────────────────────────────────────────────────────────
export default function StudentDashboard() {
  const [offers, setOffers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [loadingApps, setLoadingApps] = useState(true);
  const [loadingNotifs, setLoadingNotifs] = useState(true);
  const [selectedOfferId, setSelectedOfferId] = useState(null);

  useEffect(() => {
    loadOffers();
    loadApps();
    loadNotifs();
  }, []);

  const loadNotifs = async () => {
    setLoadingNotifs(true);
    try {
      const res = await getStudentNotifications();
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoadingNotifs(false);
    }
  };

  const loadOffers = async (query = '', type = 'all') => {
    setLoadingOffers(true);
    try {
      const params = {};
      if (query) params.search = query;
      if (type !== 'all') params.type = type;
      const res = await getOffers(params);
      setOffers(res.data);
    } catch (err) {
      console.error('Failed to load offers', err);
    } finally {
      setLoadingOffers(false);
    }
  };

  const loadApps = async () => {
    setLoadingApps(true);
    try {
      const res = await getMyApplications();
      setApplications(res.data);
    } catch (err) {
      console.error('Failed to load applications', err);
    } finally {
      setLoadingApps(false);
    }
  };

  const [offerToApply, setOfferToApply] = useState(null);

  const handleApplyClick = (offerId) => {
    setOfferToApply(offers.find(o => o.id === offerId));
  };

  const confirmApply = async () => {
    if (!offerToApply) return;
    try {
      await applyForOffer(offerToApply.id);
      setOfferToApply(null);
      // Refresh both so "already_applied" flag and applications list update
      loadOffers();
      loadApps();
    } catch (err) {
      console.error('Application failed', err);
    }
  };

  const handleDownloadAgreement = async (internshipId) => {
    try {
      const res = await downloadStudentAgreement(internshipId);
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

  const handleMarkAsRead = async (id) => {
    try {
      await markStudentNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  return (
    <DashboardLayout role="student">
      <div className="p-8 lg:p-12 space-y-12 animate-fade-in min-h-screen pb-24">
        <Routes>
          <Route path="/" element={
            <ExploreView offers={offers} loading={loadingOffers} loadData={loadOffers} handleApply={handleApplyClick} onSelectOffer={setSelectedOfferId} />
          } />
          <Route path="/internships" element={
            <ExploreView offers={offers} loading={loadingOffers} loadData={loadOffers} handleApply={handleApplyClick} onSelectOffer={setSelectedOfferId} />
          } />
          <Route path="/applications" element={
            <ApplicationsView applications={applications} loading={loadingApps} handleDownloadAgreement={handleDownloadAgreement} />
          } />
          <Route path="/notifications" element={
            <NotificationsView notifications={notifications} loading={loadingNotifs} handleDownloadAgreement={handleDownloadAgreement} markAsRead={handleMarkAsRead} />
          } />
          <Route path="*" element={<Navigate to="/student/internships" replace />} />
        </Routes>
      </div>

      {/* CONFIRMATION OVERLAY (GRID) */}
      {offerToApply && (
        <div className="fixed inset-0 z-[100] bg-gray-900/40 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in" onClick={() => setOfferToApply(null)}>
          <div className="bg-white rounded-[32px] p-8 sm:p-12 max-w-md w-full shadow-2xl shadow-indigo-900/10 border border-indigo-50 text-center animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-8 text-indigo-600 shadow-inner border border-indigo-100/50">
              <Zap size={36} className="fill-indigo-100" />
            </div>
            <h3 className="text-3xl font-black text-gray-900 mb-4 tracking-tight leading-none">Confirm Application</h3>
            <p className="text-gray-500 font-medium mb-10 leading-relaxed text-sm">
              You are about to apply for <span className="font-bold text-gray-900">{offerToApply.title}</span> at <span className="font-bold text-gray-900">{offerToApply.company_name}</span>. This will securely share your student profile with them.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => setOfferToApply(null)}
                className="flex-1 py-4 sm:py-5 bg-gray-50 text-gray-600 rounded-2xl font-black uppercase tracking-[2px] text-[10px] hover:bg-gray-100 hover:text-gray-900 transition-colors border border-gray-200 shadow-sm"
              >
                Cancel
              </button>
              <button 
                onClick={confirmApply}
                className="flex-1 py-4 sm:py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-[2px] text-[10px] shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 active:scale-95 transition-all"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      <StudentOfferModal 
        offerId={selectedOfferId} 
        onClose={() => setSelectedOfferId(null)} 
        onApplySuccess={() => {
          loadOffers();
          loadApps();
        }}
      />
    </DashboardLayout>
  );
}
