import { useState, useEffect } from 'react';
import { 
  FileText, 
  CheckCircle2,
  MoreHorizontal, 
  TrendingUp,
  Users,
  Globe,
  Zap,
  Loader2,
  BarChart3,
  Clock,
  Bell,
  Filter
} from 'lucide-react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import { useAuth } from '../../context/AuthContext';
import { 
  getAdminInternships,
  getAdminInternshipDetails,
  validateInternship,
  rejectInternship,
  downloadAdminAgreement,
  getStatsSummary,
  getStatsStatuses,
  getStatsStudents,
  getStatsTrends,
  getAdminNotifications,
} from '../../api/adminApi';
import { getMediaUrl } from '../../api/axios';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

// ── OVERVIEW ──────────────────────────────────────────────────────────────────
function OverviewView({ internships, summary, trends, statusStats, studentStats, notifications = [], handleAction, handleGeneratePDF, setSelectedInternship, actionLoading }) {
  const queueItems = internships.filter(i => i.status === 'accepted_by_company' || i.status === 'pending');
  const actionRequiredCount = internships.filter(i => i.status === 'accepted_by_company').length;
  const recentNotifs = notifications.slice(0, 4);
  const navigate = useNavigate();
  
  return (
    <div className="space-y-8">
      {/* REAL STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: 'Total Internships',
            value: internships.length,
            icon: FileText,
            color: 'text-indigo-600',
            bg: 'bg-indigo-50',
          },
          {
            label: 'In Progress',
            value: queueItems.length,
            icon: Clock,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
            urgent: actionRequiredCount > 0,
          },
          {
            label: 'Validated',
            value: internships.filter(i => i.status === 'validated').length,
            icon: CheckCircle2,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
          },
          {
            label: 'Rejected',
            value: internships.filter(i => i.status === 'rejected').length,
            icon: BarChart3,
            color: 'text-rose-600',
            bg: 'bg-rose-50',
          },
        ].map((stat, idx) => (
          <div key={idx} className={`bg-white p-6 rounded-3xl border shadow-sm flex flex-col justify-between ${stat.urgent ? 'border-amber-200 ring-2 ring-amber-50' : 'border-gray-200'}`}>
            <div className="flex justify-between items-start mb-6">
              <p className="text-[11px] font-black text-gray-500 uppercase tracking-[2px]">{stat.label}</p>
              <div className={`w-10 h-10 ${stat.bg} rounded-full flex items-center justify-center ${stat.color} shrink-0`}>
                <stat.icon size={20} />
              </div>
            </div>
            <div>
              <h3 className="text-4xl font-black text-gray-900 tracking-tighter">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* PLACEMENT RATE from real API */}
      {summary && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden flex flex-col justify-center">
            <div className="flex justify-between items-start mb-8">
              <div>
                <p className="text-[11px] font-black text-gray-500 uppercase tracking-[2px] mb-2">Placement Rate</p>
                <h3 className="text-5xl font-black text-indigo-600 tracking-tighter">
                  {summary.students?.placement_rate ?? '—'}
                  {typeof summary.students?.placement_rate === 'number' ? '%' : ''}
                </h3>
              </div>
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                <TrendingUp size={28} strokeWidth={2.5} />
              </div>
            </div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Students Placed</p>
              <p className="text-xl font-black text-gray-900">{summary.students?.placed ?? '—'}</p>
            </div>
            {typeof summary.students?.placement_rate === 'number' && (
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 rounded-full transition-all duration-1000" style={{ width: `${summary.students.placement_rate}%` }}></div>
              </div>
            )}
          </div>

          <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm flex flex-col justify-center">
            <h3 className="text-xl font-black text-gray-900 mb-6">Student Breakdown</h3>
            <div className="space-y-4">
              {studentStats && Object.entries(studentStats).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm font-bold text-gray-600 capitalize">{key.replace(/_/g, ' ')}</span>
                  <span className="text-lg font-black text-gray-900">{value}</span>
                </div>
              ))}
              {!studentStats && (
                <p className="text-gray-500 font-medium text-sm">No data available.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TRENDS CHART */}
        <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
          <h3 className="text-xl font-black text-gray-900 mb-6 tracking-tight">Application Trends</h3>
          {trends && trends.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="period_start" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 'bold' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 'bold' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: '1px solid #f3f4f6', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                    itemStyle={{ color: '#111827', fontWeight: 'black' }}
                    labelStyle={{ color: '#6b7280', fontWeight: 'bold', fontSize: '12px', marginBottom: '4px' }}
                  />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <Area type="monotone" dataKey="total_updates" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" activeDot={{ r: 6, fill: '#4f46e5', stroke: '#fff', strokeWidth: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 w-full flex items-center justify-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <p className="text-gray-400 font-bold text-sm">No trend data available.</p>
            </div>
          )}
        </div>

        {/* STATUS BREAKDOWN CHART */}
        <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm flex flex-col">
          <h3 className="text-xl font-black text-gray-900 mb-6 tracking-tight">Status Distribution</h3>
          {statusStats && statusStats.total > 0 ? (
            <div className="h-64 w-full flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={Object.entries(statusStats)
                      .filter(([name, value]) => name !== 'total' && value > 0)
                      .map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {Object.entries(statusStats)
                      .filter(([name, value]) => name !== 'total' && value > 0)
                      .map(([name], index) => {
                      // Dynamic colors based on status name
                      let color = '#9ca3af'; // default gray
                      if (name.includes('validated')) color = '#10b981'; // emerald
                      else if (name.includes('pending')) color = '#f59e0b'; // amber
                      else if (name.includes('rejected')) color = '#e11d48'; // rose
                      else if (name.includes('accepted')) color = '#4f46e5'; // indigo
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: '1px solid #f3f4f6', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                    itemStyle={{ color: '#111827', fontWeight: 'black', textTransform: 'capitalize' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    formatter={(value) => <span className="text-xs font-bold text-gray-600 capitalize">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 w-full flex-1 flex items-center justify-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <p className="text-gray-400 font-bold text-sm">No status data available.</p>
            </div>
          )}
        </div>
      </div>

      {/* RECENT NOTIFICATIONS / ACTIVITY */}
      <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-gray-900 tracking-tight">Recent Activity</h3>
          <button onClick={() => navigate('/admin/notifications')} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">View All</button>
        </div>
        <div className="space-y-4">
          {recentNotifs.length > 0 ? recentNotifs.map((n) => (
            <div key={n.id} className={`flex items-start gap-4 p-4 rounded-2xl transition-all ${n.is_read ? 'bg-white' : 'bg-indigo-50/50 border border-indigo-100/50'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${n.notification_type === 'new_application' ? 'bg-blue-100 text-blue-600' : 'bg-indigo-100 text-indigo-600'}`}>
                {n.notification_type === 'new_application' ? <Zap size={18} /> : <Bell size={18} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm leading-relaxed ${n.is_read ? 'text-gray-600' : 'text-gray-900 font-bold'}`}>{n.message}</p>
                <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">
                  {new Date(n.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </p>
              </div>
            </div>
          )) : (
            <div className="py-8 text-center text-gray-400 font-medium text-sm border-2 border-dashed border-gray-100 rounded-2xl">
              No recent activity.
            </div>
          )}
        </div>
      </div>

      <div className="pt-4">
        <div className="flex justify-between items-center mb-6 px-2">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Validation Queue</h2>
          {queueItems.length > 0 && (
            <div className="bg-amber-50 text-amber-700 px-4 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-widest border border-amber-200 shadow-sm">
              {queueItems.length} In Progress
            </div>
          )}
        </div>

        {queueItems.length === 0 ? (
          <div className="py-12 text-center bg-white rounded-3xl border border-gray-200 shadow-sm">
            <CheckCircle2 size={40} className="mx-auto text-emerald-500 mb-4" />
            <p className="font-black text-gray-900 text-xl">All caught up!</p>
            <p className="text-gray-500 font-medium text-sm mt-1">No internships in progress.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {queueItems.map((req) => (
              <div 
                key={req.id} 
                onClick={() => handleAction(req.id, 'select')}
                className="bg-white p-6 rounded-3xl border border-amber-200 shadow-sm hover:shadow-md transition-shadow group flex flex-col cursor-pointer"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center font-black text-indigo-600 shrink-0 border border-indigo-100">
                    {(req.student_name || 'S')[0]}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-black text-gray-900 truncate group-hover:text-indigo-600 transition-colors">{req.offer_title || req.subject}</h4>
                    <p className="text-[11px] font-bold text-gray-500 mt-1 truncate">{req.student_name} · {req.company_name}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-auto pt-4 border-t border-gray-100" onClick={e => e.stopPropagation()}>
                  {req.status === 'accepted_by_company' ? (
                    <>
                      <button onClick={() => handleAction(req.id, 'reject')} className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition-colors">Reject</button>
                      <button onClick={() => handleAction(req.id, 'approve')} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-colors shadow-sm">Validate</button>
                    </>
                  ) : (
                    <div className="flex-1 py-2.5 bg-gray-50 text-gray-500 rounded-xl text-[10px] font-black uppercase tracking-widest text-center border border-gray-100">
                      Waiting for Company
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── INTERNSHIPS VIEW ───────────────────────────────────────────────────────────
function InternshipsView({ internships, loading, handleAction, handleGeneratePDF, setSelectedInternship }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [filters, setFilters] = useState({
    validated: true,
    rejected: true,
    pending: true,
  });

  const filteredInternships = internships.filter((item) => {
    if (item.status === 'validated') return filters.validated;
    if (item.status === 'rejected') return filters.rejected;
    if (item.status === 'pending' || item.status === 'accepted_by_company') return filters.pending;
    return true;
  });

  const hasActiveFilters = !filters.validated || !filters.rejected || !filters.pending;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-2">
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">All Internship Applications</h2>
        
        <div className="flex items-center gap-3">
          {/* Filter button and dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-sm transition-all cursor-pointer"
            >
              <Filter size={12} className="text-gray-500" />
              Filter
              {hasActiveFilters && (
                <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
              )}
            </button>

            {showDropdown && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowDropdown(false)}></div>
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-gray-200 shadow-xl z-30 p-4 space-y-2.5 animate-fade-in">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Filter by Status</p>
                  
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, pending: !prev.pending }))}
                    className={`flex items-center justify-between w-full px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      filters.pending 
                        ? 'bg-amber-50 text-amber-700 border-amber-200' 
                        : 'bg-gray-50 text-gray-400 border-gray-200'
                    }`}
                  >
                    <span>Pending</span>
                    <span className={`w-2 h-2 rounded-full ${filters.pending ? 'bg-amber-500' : 'bg-gray-300'}`}></span>
                  </button>

                  <button
                    onClick={() => setFilters(prev => ({ ...prev, validated: !prev.validated }))}
                    className={`flex items-center justify-between w-full px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      filters.validated 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-gray-50 text-gray-400 border-gray-200'
                    }`}
                  >
                    <span>Validated</span>
                    <span className={`w-2 h-2 rounded-full ${filters.validated ? 'bg-emerald-500' : 'bg-gray-300'}`}></span>
                  </button>

                  <button
                    onClick={() => setFilters(prev => ({ ...prev, rejected: !prev.rejected }))}
                    className={`flex items-center justify-between w-full px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      filters.rejected 
                        ? 'bg-rose-50 text-rose-700 border-rose-200' 
                        : 'bg-gray-50 text-gray-400 border-gray-200'
                    }`}
                  >
                    <span>Rejected</span>
                    <span className={`w-2 h-2 rounded-full ${filters.rejected ? 'bg-rose-500' : 'bg-gray-300'}`}></span>
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="bg-white px-4 py-1.5 rounded-xl border border-gray-200 shadow-sm text-[11px] font-black text-indigo-600 uppercase tracking-widest">
            {filteredInternships.length === internships.length ? `${internships.length} Total` : `${filteredInternships.length} of ${internships.length}`}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>
      ) : internships.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-gray-200 shadow-sm">
          <FileText size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="font-black text-gray-900 text-xl">No internships yet</p>
          <p className="text-gray-500 font-medium mt-2">Internships appear here once students apply and companies accept.</p>
        </div>
      ) : filteredInternships.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-gray-200 shadow-sm">
          <FileText size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="font-black text-gray-900 text-xl">No matching applications</p>
          <p className="text-gray-500 font-medium mt-2">Try adjusting your active status filters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50 text-left">
                  <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Student</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Company / Role</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredInternships.map((item) => (
                  <tr 
                    key={item.id} 
                    onClick={() => handleAction(item.id, 'select')}
                    className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center font-black text-indigo-600 text-lg shrink-0 border border-indigo-100">
                          {item.student_image ? (
                            <img src={getMediaUrl(item.student_image)} alt="" className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            <span>{(item.student_name || 'S')[0]}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm group-hover:text-indigo-600 transition-colors">{item.student_name}</p>
                          <p className="text-[11px] text-gray-500 font-bold mt-0.5">{item.student_email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900 text-sm">{item.offer_title || item.subject}</p>
                      <p className="text-[11px] font-bold text-gray-500 mt-0.5">{item.company_name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                        {item.status === 'accepted_by_company' && (
                          <button onClick={() => handleAction(item.id, 'approve')} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-sm">Validate</button>
                        )}
                        {item.status === 'validated' && (
                          <button onClick={() => handleGeneratePDF(item.id)} className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all border border-emerald-200">PDF</button>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); handleAction(item.id, 'select'); }} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><MoreHorizontal size={18} /></button>
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

// ── MAIN ADMIN DASHBOARD ───────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { user } = useAuth();
  const [internships, setInternships] = useState([]);
  const [summary, setSummary] = useState(null);
  const [studentStats, setStudentStats] = useState(null);
  const [trends, setTrends] = useState([]);
  const [statusStats, setStatusStats] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInternship, setSelectedInternship] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [companyProfileData, setCompanyProfileData] = useState(null);

  useEffect(() => { 
    loadData(true); 
    const interval = setInterval(() => {
      loadData(false);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [intRes, statsRes, studRes, trendsRes, statusRes, notifRes] = await Promise.allSettled([
        getAdminInternships(),
        getStatsSummary(),
        getStatsStudents(),
        getStatsTrends('monthly'),
        getStatsStatuses(),
        getAdminNotifications()
      ]);
      if (intRes.status === 'fulfilled') setInternships(intRes.value.data);
      if (statsRes.status === 'fulfilled') setSummary(statsRes.value.data);
      if (studRes.status === 'fulfilled') setStudentStats(studRes.value.data);
      if (trendsRes.status === 'fulfilled') setTrends(trendsRes.value.data.trends || []);
      if (statusRes.status === 'fulfilled') setStatusStats(statusRes.value.data);
      if (notifRes.status === 'fulfilled') setNotifications(notifRes.value.data);
    } catch (err) {
      console.error('Failed to load admin data', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    try {
      if (action === 'select') {
        const res = await getAdminInternshipDetails(id);
        setSelectedInternship(res.data);
        return;
      }
      
      setActionLoading(action);
      if (action === 'approve') await validateInternship(id);
      else await rejectInternship(id);
      
      await loadData(false);
      
      // Instead of closing the modal, update its status so the buttons swap
      setSelectedInternship(prev => prev ? { 
        ...prev, 
        status: action === 'approve' ? 'validated' : 'rejected' 
      } : null);
      
    } catch (err) {
      console.error('Action failed', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleGeneratePDF = async (id) => {
    try {
      const res = await downloadAdminAgreement(id);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `agreement_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF download failed', err);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="p-6 md:p-8 lg:p-12 space-y-8 animate-fade-in bg-gray-50 min-h-screen pb-24">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Admin Portal</h1>
            <p className="text-gray-500 font-medium mt-1">
              Welcome, {user?.full_name?.split(' ')[0] || user?.email?.split('@')[0]}. Validate internships and monitor metrics.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-40">
            <Loader2 className="animate-spin text-indigo-600" size={48} />
          </div>
        ) : (
          <>
            <Routes>
              <Route path="/" element={
                <OverviewView
                  internships={internships}
                  summary={summary}
                  trends={trends}
                  statusStats={statusStats}
                  studentStats={studentStats}
                  notifications={notifications}
                  handleAction={handleAction}
                  handleGeneratePDF={handleGeneratePDF}
                  setSelectedInternship={setSelectedInternship}
                  actionLoading={actionLoading}
                />
              } />
              <Route path="/internships" element={
                <InternshipsView
                  internships={internships}
                  loading={loading}
                  handleAction={handleAction}
                  handleGeneratePDF={handleGeneratePDF}
                  setSelectedInternship={setSelectedInternship}
                />
              } />
              <Route path="/applicants" element={
                <div className="space-y-6">
                  <div className="flex justify-between items-center px-2">
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Student Records</h2>
                  </div>
                  <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full whitespace-nowrap">
                        <thead>
                          <tr className="border-b border-gray-200 bg-gray-50/50 text-left">
                            <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Student</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Status</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {internships.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => handleAction(item.id, 'select')}>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center font-black text-indigo-600 shrink-0 border border-indigo-100">
                                    {(item.student_name || 'S')[0]}
                                  </div>
                                  <div>
                                    <p className="font-bold text-gray-900 text-sm">{item.student_name}</p>
                                    <p className="text-[11px] text-gray-500 font-bold mt-0.5">{item.student_email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4"><StatusBadge status={item.status} /></td>
                              <td className="px-6 py-4 text-right">
                                <button onClick={(e) => { e.stopPropagation(); handleAction(item.id, 'select'); }} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><MoreHorizontal size={18} /></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              } />

            </Routes>
        {selectedInternship && (
          <Modal title="Validation Review" wide={true} onClose={() => setSelectedInternship(null)}>
            <div className="space-y-8 max-w-7xl mx-auto w-full">
              <div className="flex flex-col lg:flex-row gap-8 items-start">
                
                {/* STUDENT PROFILE (LEFT) */}
                <div className="flex-1 space-y-6 w-full">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight border-b-2 border-slate-100 pb-3">Student CV</h3>
                  <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col items-center text-center space-y-4">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-8 border-white shadow-xl bg-indigo-100 flex items-center justify-center shrink-0 relative group">
                      {selectedInternship.student_cv?.profile_image ? (
                        <img src={getMediaUrl(selectedInternship.student_cv.profile_image)} alt="Student" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-5xl font-black text-indigo-600">{(selectedInternship.student_name || 'S')[0]}</span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">{selectedInternship.student_name}</h3>
                      <p className="text-indigo-600 font-bold text-sm leading-tight">{selectedInternship.student_email}</p>
                      {selectedInternship.student_cv?.academic_year && (
                        <p className="text-sm font-bold text-slate-500 mt-1">{selectedInternship.student_cv.academic_year}</p>
                      )}
                      <div className="flex items-center justify-center gap-2 mt-4">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-50 border border-slate-100 px-4 py-1.5 rounded-full shadow-sm">
                          📍 {selectedInternship.student_cv?.wilaya || 'Algeria'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Professional Summary</p>
                    <p className="text-sm text-slate-700 font-medium leading-relaxed">
                      {selectedInternship.student_cv?.professional_summary || <span className="text-slate-400 italic">No summary provided.</span>}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-5">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">GitHub</p>
                        {selectedInternship.student_cv?.github_link ? (
                          <a href={selectedInternship.student_cv.github_link} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-2 transition-all">
                            <Globe size={16} /> View Profile
                          </a>
                        ) : <p className="text-xs text-slate-400 font-medium">Not provided</p>}
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Portfolio</p>
                        {selectedInternship.student_cv?.portfolio_link ? (
                          <a href={selectedInternship.student_cv.portfolio_link} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-2 transition-all">
                            <Globe size={16} /> View Portfolio
                          </a>
                        ) : <p className="text-xs text-slate-400 font-medium">Not provided</p>}
                      </div>
                    </div>

                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Core Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedInternship.student_cv?.skills?.length > 0 ? (
                          selectedInternship.student_cv.skills.map((s, idx) => (
                            <span key={idx} className="px-3 py-2 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg">
                              {s.name}
                            </span>
                          ))
                        ) : (
                          <p className="text-xs text-slate-400 font-medium">No skills listed</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* DIVIDER */}
                <div className="hidden lg:block w-px bg-slate-200 self-stretch"></div>
                <div className="w-full h-px bg-slate-200 lg:hidden my-2"></div>

                {/* OFFER DETAILS (RIGHT) */}
                <div className="flex-1 space-y-6 w-full">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight border-b-2 border-slate-100 pb-3">Company Information</h3>
                  <div 
                    className="bg-indigo-600 p-8 rounded-3xl text-white shadow-xl shadow-indigo-100 relative overflow-hidden bg-cover bg-center"
                    style={selectedInternship.offer_details?.image ? { backgroundImage: `url(${getMediaUrl(selectedInternship.offer_details.image)})` } : {}}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/90 to-indigo-600/70 z-0"></div>
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg overflow-hidden relative z-10">
                          {selectedInternship.company_details?.logo ? (
                            <img src={getMediaUrl(selectedInternship.company_details.logo)} alt="" className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            <span className="text-indigo-600 font-black text-xl">{(selectedInternship.company_name || 'C')[0]}</span>
                          )}
                        </div>
                      </div>
                      <h4 className="text-2xl font-black tracking-tight mb-2 leading-tight">
                        {selectedInternship.offer_title || selectedInternship.subject}
                      </h4>
                      <p className="text-indigo-100 text-sm font-bold pointer-events-auto">
                        <span>{selectedInternship.company_name}</span>
                      </p>
                      {selectedInternship.company_details && (
                        <button 
                          onClick={(e) => {
                              e.stopPropagation();
                              setCompanyProfileData(selectedInternship.company_details);
                          }}
                          className="w-full py-3 mt-4 bg-white border border-gray-200 text-gray-700 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-100 transition-colors"
                        >
                          View Company Profile
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6 px-2">
                    <h4 className="text-lg font-black text-slate-900 tracking-tight">Offer Details</h4>
                    
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-3">Offer Description</p>
                      <p className="text-sm text-gray-600 font-medium leading-relaxed">
                        {selectedInternship.offer_details?.description || selectedInternship.description || 'No description available.'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {selectedInternship.offer_details?.duration_display && (
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-3">Duration</p>
                          <p className="text-sm font-black text-slate-800">
                            {selectedInternship.offer_details.duration_display}
                          </p>
                        </div>
                      )}
                      
                      {selectedInternship.offer_details?.start_date && (
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-3">Start Date</p>
                          <p className="text-sm font-black text-slate-800">
                            {new Date(selectedInternship.offer_details.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      )}

                      {selectedInternship.offer_details?.end_date && (
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-3">End Date</p>
                          <p className="text-sm font-black text-slate-800">
                            {new Date(selectedInternship.offer_details.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      )}

                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-3">Location</p>
                        <p className="text-sm font-black text-slate-800">
                          {selectedInternship.offer_details?.is_remote ? 'Remote' : (selectedInternship.offer_details?.wilaya || selectedInternship.offer_details?.location || 'Algeria')}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-3">Payment Type</p>
                        <p className="text-sm font-black text-slate-800 capitalize">
                          {selectedInternship.offer_details?.type || 'Unpaid'}
                        </p>
                      </div>
                      {selectedInternship.offer_details?.type === 'paid' && selectedInternship.offer_details?.salary_per_week && (
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-3">Weekly Salary</p>
                          <p className="text-sm font-black text-emerald-600 flex items-center gap-1.5">
                            <Zap size={14} /> {selectedInternship.offer_details.salary_per_week} DZD/wk
                          </p>
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-3">Required Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedInternship.offer_details?.required_skills?.length > 0 ? (
                          selectedInternship.offer_details.required_skills.map((s) => (
                            <span key={s.id} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg font-black text-[9px] uppercase tracking-widest border border-indigo-100">
                              {s.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400 italic">No specific skills required</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex gap-4 pt-8 border-t border-gray-100">
                {selectedInternship.status === 'accepted_by_company' && (
                  <>
                    <button 
                      onClick={() => handleAction(selectedInternship.id, 'reject')} 
                      disabled={actionLoading}
                      className="flex-1 py-4 bg-white border-2 border-gray-100 text-rose-600 rounded-2xl font-black uppercase tracking-[2px] text-[11px] hover:bg-rose-50 hover:border-rose-100 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                      {actionLoading === 'reject' ? <><Loader2 size={16} className="animate-spin"/> Rejecting...</> : 'Reject Application'}
                    </button>
                    <button 
                      onClick={() => handleAction(selectedInternship.id, 'approve')} 
                      disabled={actionLoading}
                      className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-[2px] text-[11px] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                      {actionLoading === 'approve' ? <><Loader2 size={16} className="animate-spin"/> Validating...</> : 'Validate & Generate PDF'}
                    </button>
                  </>
                )}
                {selectedInternship.status === 'validated' && (
                  <button 
                    onClick={() => handleGeneratePDF(selectedInternship.id)} 
                    className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-[2px] text-[11px] hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-100"
                  >
                    Download Convention de Stage (PDF)
                  </button>
                )}
                {selectedInternship.status === 'rejected' && (
                  <div className="w-full py-4 bg-rose-50 text-rose-600 rounded-2xl font-black uppercase tracking-[2px] text-[11px] text-center border border-rose-100">
                    Application Rejected
                  </div>
                )}
                {selectedInternship.status === 'pending' && (
                  <div className="w-full py-4 bg-gray-50 text-gray-500 rounded-2xl font-black uppercase tracking-[2px] text-[11px] text-center border border-gray-200 flex flex-col items-center justify-center">
                    <span className="flex items-center gap-2">
                      <Clock size={16} />
                      Waiting for Company Review
                    </span>
                    <span className="text-[9px] text-gray-400 mt-1 capitalize tracking-normal font-bold">
                      This application must be accepted by the company before admin validation.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Modal>
        )}
          </>
        )}

        {/* Company Profile Modal */}
        {companyProfileData && (
          <Modal
            isOpen={!!companyProfileData}
            onClose={() => setCompanyProfileData(null)}
            title={`About ${companyProfileData.name || 'Company'}`}
            size="lg"
          >
            <div className="p-8">
              <div className="flex items-center gap-6 mb-10 pb-8 border-b border-gray-100">
                <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-lg border border-gray-100 overflow-hidden relative group shrink-0">
                  {companyProfileData.logo ? (
                    <img src={getMediaUrl(companyProfileData.logo)} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                  ) : (
                    <span className="text-3xl font-black text-indigo-600">{(companyProfileData.name || 'C')[0]}</span>
                  )}
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight text-gray-900 mb-2">{companyProfileData.name}</h3>
                  <div className="flex gap-3">
                    <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-100/50 shadow-sm">
                      {companyProfileData.industry || 'Company'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  {companyProfileData.industry && (
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 shadow-sm">Industry</p>
                      <p className="font-bold text-gray-900">{companyProfileData.industry}</p>
                    </div>
                  )}
                  {companyProfileData.wilaya && (
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 shadow-sm">Location</p>
                      <p className="font-bold text-gray-900">{companyProfileData.wilaya}</p>
                    </div>
                  )}
                  {companyProfileData.phone_number && (
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 shadow-sm">Phone Number</p>
                      <p className="font-bold text-gray-900">{companyProfileData.phone_number}</p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 shadow-sm">Company Description</p>
                    {companyProfileData.description ? (
                      <div className="space-y-3">
                        {companyProfileData.description.split('\n').filter(p => p.trim()).map((p, i) => (
                          <p key={i} className="text-sm text-gray-600 font-medium leading-relaxed">{p}</p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 font-medium italic">No description provided.</p>
                    )}
                  </div>
                  
                  {companyProfileData.website && (
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 shadow-sm">Website</p>
                      <a href={companyProfileData.website.startsWith('http') ? companyProfileData.website : `https://${companyProfileData.website}`} target="_blank" rel="noopener noreferrer" className="font-bold text-indigo-600 hover:underline flex items-center gap-1.5 transition-all w-fit">
                        <Globe size={14} /> Visit Site
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Modal>
        )}

      </div>
    </DashboardLayout>
  );
}
