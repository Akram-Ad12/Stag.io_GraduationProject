import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function Unauthorized() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8 font-inter">
      <div className="w-full max-w-lg animate-fade-in text-center">
        <div className="bg-white p-12 lg:p-16 rounded-[48px] shadow-2xl shadow-gray-200/50 border border-gray-100 flex flex-col items-center">
          <div className="w-24 h-24 rounded-[32px] bg-rose-50 flex items-center justify-center text-rose-600 mb-10 shadow-lg shadow-rose-100 animate-bounce">
            <ShieldAlert size={48} />
          </div>
          
          <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Access Restricted</h1>
          <p className="text-gray-500 font-bold mb-12 leading-relaxed">
            You've reached a secure zone. Your account level does not grant access to this command center. 
            If you believe this is an error, please sync with the platform administrator.
          </p>
          
          <button 
            onClick={() => navigate('/')}
            className="w-full py-5 bg-gray-900 text-white rounded-[24px] font-black uppercase tracking-widest text-xs shadow-xl shadow-gray-200 hover:bg-black hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
          >
            <ArrowLeft size={18} />
            Return to Dashboard
          </button>
          
          <div className="mt-10 pt-10 border-t border-gray-50 w-full">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">Security Protocol: 403 Forbidden</p>
          </div>
        </div>
      </div>
    </div>
  );
}

