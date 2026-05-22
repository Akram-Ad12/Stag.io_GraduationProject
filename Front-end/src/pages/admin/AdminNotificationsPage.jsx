import { useState, useEffect } from 'react';
import { 
  Bell, 
  CheckCircle2, 
  Clock, 
  Loader2,
  ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { 
  getAdminNotifications, 
  markAdminNotificationAsRead,
  markAdminNotificationsAsRead
} from '../../api/adminApi';

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await getAdminNotifications();
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await markAdminNotificationAsRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAdminNotificationsAsRead();
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'new_application': return <ExternalLink className="text-blue-500" />;
      case 'internship_accepted': return <CheckCircle2 className="text-indigo-500" />;
      case 'internship_validated': return <CheckCircle2 className="text-emerald-500" />;
      case 'internship_rejected': return <Bell className="text-rose-500" />;
      default: return <Bell className="text-indigo-500" />;
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="p-8 lg:p-12 max-w-4xl mx-auto animate-fade-in min-h-screen pb-24">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-12">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">Notifications</h1>
            <p className="text-gray-500 font-bold mt-1">Platform updates and validation requests</p>
          </div>
          <div className="flex items-center gap-4">
            {notifications.filter(n => !n.is_read).length > 0 && (
              <button 
                onClick={handleMarkAllRead}
                className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
              >
                Mark all as read
              </button>
            )}
            <div className="bg-indigo-50 px-6 py-2 rounded-2xl border border-indigo-100 shadow-sm text-xs font-black text-indigo-600 uppercase tracking-widest">
              {notifications.filter(n => !n.is_read).length} Unread
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-indigo-600" size={48} />
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-[40px] border border-gray-100 shadow-sm">
            <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-gray-300">
              <Bell size={40} />
            </div>
            <h3 className="text-xl font-black text-gray-900">No notifications yet</h3>
            <p className="text-gray-500 font-medium mt-2">All platform actions will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((n) => (
              <div 
                key={n.id} 
                className={`group relative bg-white p-6 rounded-[32px] border transition-all flex items-start gap-6 ${n.is_read ? 'border-gray-100 opacity-75' : 'border-indigo-100 shadow-md shadow-indigo-50 ring-1 ring-indigo-50'}`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${n.is_read ? 'bg-gray-50' : 'bg-indigo-50'}`}>
                  {getIcon(n.notification_type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className={`text-lg font-black tracking-tight ${n.is_read ? 'text-gray-700' : 'text-gray-900'}`}>
                      {n.notification_type === 'internship_accepted' ? 'Application Ready for Validation' : 'Internship Update'}
                    </h3>
                    <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap ml-4">
                      {new Date(n.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-500 leading-relaxed mb-4">
                    {n.message}
                  </p>
                  
                  <div className="flex items-center gap-4">
                    {n.internship_id && (
                      <button 
                        onClick={() => navigate('/admin')}
                        className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-sm"
                      >
                        <ExternalLink size={14} /> Go to Validation Queue
                      </button>
                    )}
                    {!n.is_read && (
                      <button 
                        onClick={() => handleMarkAsRead(n.id)}
                        className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
                
                {!n.is_read && (
                  <div className="absolute top-6 right-6 w-2 h-2 bg-indigo-600 rounded-full"></div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
