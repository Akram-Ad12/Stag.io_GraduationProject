import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  MapPin, 
  Globe, 
  Phone,
  Briefcase,
  FileText,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { getCompanyProfile, updateCompanyProfile, uploadCompanyLogo } from '../../api/companyApi';
import { getMediaUrl } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

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

export default function CompanyProfilePage() {
  const [profile, setProfile] = useState({
    name: '',
    description: '',
    wilaya: '',
    website: '',
    phone_number: '',
    industry: '',
    logo: null
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  const { fetchMe } = useAuth();
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await getCompanyProfile();
      setProfile({
        name: res.data.name || '',
        description: res.data.description || '',
        wilaya: res.data.wilaya || '',
        website: res.data.website || '',
        phone_number: res.data.phone_number || '',
        industry: res.data.industry || '',
        logo: res.data.logo || null
      });
    } catch (err) {
      console.error('Failed to load profile', err);
      setErrorMsg('Failed to load profile data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await updateCompanyProfile({
        name: profile.name,
        description: profile.description,
        wilaya: profile.wilaya,
        website: profile.website,
        phone_number: profile.phone_number,
        industry: profile.industry
      });
      await fetchMe();
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg('Failed to update profile. Check your inputs.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setErrorMsg('');
    try {
      const res = await uploadCompanyLogo(file);
      setProfile(prev => ({ ...prev, logo: res.data.logo }));
      await fetchMe();
      setSuccessMsg('Logo updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg('Failed to upload logo.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="company">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="animate-spin text-indigo-600" size={48} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="company">
      <div className="p-6 md:p-8 lg:p-12 animate-fade-in bg-gray-50 min-h-screen pb-24">
        
        <div className="max-w-4xl mx-auto">
          {/* HEADER */}
          <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm mb-8">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Company Profile</h1>
            <p className="text-gray-500 font-medium mt-1">Manage your public information shown to students.</p>
          </div>

          {/* FORM */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
            <form onSubmit={handleSave} className="p-8 space-y-8">
              
              {/* LOGO SECTION */}
              <div className="flex flex-col sm:flex-row items-center gap-8 pb-8 border-b border-gray-100">
                <div className="relative w-32 h-32 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden shrink-0 group">
                  {profile.logo ? (
                    <img src={getMediaUrl(profile.logo)} alt="Logo" className="w-full h-full object-contain p-2" />
                  ) : (
                    <Building2 size={40} className="text-gray-300" />
                  )}
                  
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {uploading ? (
                      <Loader2 className="animate-spin text-white" size={24} />
                    ) : (
                      <>
                        <Upload className="text-white mb-1" size={20} />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Upload</span>
                      </>
                    )}
                  </div>
                  
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleLogoUpload}
                    accept="image/jpeg,image/png,image/gif" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={uploading}
                  />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 mb-1">Company Logo</h3>
                  <p className="text-sm font-medium text-gray-500 mb-4">Recommended size: 512x512px. PNG or JPG.</p>
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg font-black text-xs uppercase tracking-widest hover:bg-indigo-100 transition-colors"
                  >
                    {uploading ? 'Uploading...' : 'Change Logo'}
                  </button>
                </div>
              </div>

              {/* DETAILS SECTION */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[11px] font-black text-gray-500 uppercase tracking-widest">
                    <Building2 size={14} /> Company Name *
                  </label>
                  <input 
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-50 focus:outline-none transition-all" 
                    value={profile.name} 
                    onChange={e => setProfile({...profile, name: e.target.value})} 
                    placeholder="Company Name"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[11px] font-black text-gray-500 uppercase tracking-widest">
                    <Briefcase size={14} /> Industry
                  </label>
                  <input 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-50 focus:outline-none transition-all" 
                    value={profile.industry} 
                    onChange={e => setProfile({...profile, industry: e.target.value})} 
                    placeholder="e.g. Technology, Finance, Healthcare"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[11px] font-black text-gray-500 uppercase tracking-widest">
                    <MapPin size={14} /> Headquarter Location *
                  </label>
                  <select 
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-50 focus:outline-none transition-all" 
                    value={profile.wilaya} 
                    onChange={e => setProfile({...profile, wilaya: e.target.value})}
                  >
                    <option value="" disabled>Select a location</option>
                    {ALGERIAN_WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[11px] font-black text-gray-500 uppercase tracking-widest">
                    <Phone size={14} /> Phone Number
                  </label>
                  <input 
                    type="tel"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-50 focus:outline-none transition-all" 
                    value={profile.phone_number} 
                    onChange={e => setProfile({...profile, phone_number: e.target.value})} 
                    placeholder="e.g. +213 555 123 456"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="flex items-center gap-2 text-[11px] font-black text-gray-500 uppercase tracking-widest">
                    <Globe size={14} /> Website
                  </label>
                  <input 
                    type="url"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-50 focus:outline-none transition-all" 
                    value={profile.website} 
                    onChange={e => setProfile({...profile, website: e.target.value})} 
                    placeholder="https://example.com"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="flex items-center gap-2 text-[11px] font-black text-gray-500 uppercase tracking-widest">
                    <FileText size={14} /> About the Company
                  </label>
                  <textarea 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-50 focus:outline-none transition-all min-h-[150px] resize-y" 
                    value={profile.description} 
                    onChange={e => setProfile({...profile, description: e.target.value})} 
                    placeholder="Describe your company, mission, and culture..."
                  />
                </div>
              </div>

              {/* ACTIONS */}
              <div className="pt-8 border-t border-gray-100 flex items-center justify-between">
                <div>
                  {successMsg && (
                    <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm animate-fade-in">
                      <CheckCircle2 size={16} />
                      {successMsg}
                    </div>
                  )}
                  {errorMsg && (
                    <div className="flex items-center gap-2 text-rose-600 font-bold text-sm animate-fade-in">
                      <AlertCircle size={16} />
                      {errorMsg}
                    </div>
                  )}
                </div>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-md hover:bg-indigo-700 transition-all disabled:opacity-70"
                >
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  Save Profile
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
