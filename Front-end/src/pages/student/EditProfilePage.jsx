import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Camera, Save, User, MapPin, Calendar,
  CheckCircle2, Loader2
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import {
  getStudentProfile,
  updateStudentProfile,
  uploadProfileImage,
} from '../../api/studentApi';
import { getMediaUrl } from '../../api/axios';

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

export default function EditProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileRef = useRef();

  const [profile, setProfile] = useState({
    full_name: '',
    wilaya: '',
    date_of_birth: '',
  });
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [uploadingImg, setUploadingImg] = useState(false);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const res = await getStudentProfile();
      const data = res.data;
      setProfile({
        full_name: data.full_name || '',
        wilaya: data.wilaya || '',
        date_of_birth: data.date_of_birth || '',
      });
      setProfileImage(data.profile_image || null);
    } catch (err) {
      console.error('Failed to load profile', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSavedMsg('');
    try {
      const payload = {
        full_name: profile.full_name,
        wilaya: profile.wilaya,
        date_of_birth: profile.date_of_birth || null,
      };
      await updateStudentProfile(payload);
      setSavedMsg('Profile saved successfully!');
      setTimeout(() => setSavedMsg(''), 3000);
    } catch (err) {
      console.error('Save failed', err);
    } finally {
      setSaving(false);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImg(true);
    try {
      const res = await uploadProfileImage(file);
      setProfileImage(res.data.profile_image);
    } catch (err) {
      console.error('Image upload failed', err);
    } finally {
      setUploadingImg(false);
    }
  };

  if (loading) return (
    <DashboardLayout role="student">
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout role="student">
      <div className="p-8 lg:p-12 max-w-4xl mx-auto animate-fade-in pb-24">

        {/* HEADER */}
        <div className="flex items-center gap-6 mb-12">
          <button
            onClick={() => navigate('/student')}
            className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">Edit Profile</h1>
            <p className="text-gray-500 font-bold mt-1">Manage your personal information</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-10">

          {/* AVATAR SECTION */}
          <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm p-10">
            <h2 className="text-xl font-black text-gray-900 mb-8 tracking-tight">Profile Photo</h2>
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="relative group">
                <div className="w-32 h-32 rounded-[32px] bg-indigo-50 border-4 border-white shadow-xl overflow-hidden flex items-center justify-center">
                  {uploadingImg ? (
                    <Loader2 className="animate-spin text-indigo-600" size={32} />
                  ) : profileImage ? (
                    <img src={getMediaUrl(profileImage)} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-5xl font-black text-indigo-600">
                      {(profile.full_name || user?.email || 'S')[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </div>
              <div className="flex flex-col items-center md:items-start text-center md:text-left">
                <p className="font-black text-gray-900 text-2xl mb-1">{profile.full_name || 'Your Name'}</p>
                <p className="text-gray-500 font-bold text-sm mb-4">{user?.email}</p>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-50 text-indigo-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-100 transition-all border border-indigo-100"
                >
                  <Camera size={16} /> Upload Photo
                </button>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-4">
                  Student · {profile.wilaya || 'Location not set'}
                </p>
              </div>
            </div>
          </div>

          {/* PERSONAL INFO */}
          <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm p-10">
            <h2 className="text-xl font-black text-gray-900 mb-8 tracking-tight">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[2px]">Full Name</label>
                <div className="relative group">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                  <input
                    className="w-full pl-12 pr-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl font-bold text-gray-900 focus:bg-white focus:border-indigo-600 focus:outline-none transition-all"
                    placeholder="Your full name"
                    value={profile.full_name || ''}
                    onChange={e => setProfile({ ...profile, full_name: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[2px]">Wilaya / City</label>
                <div className="relative group">
                  <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                  <select
                    className="w-full pl-12 pr-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl font-bold text-gray-900 focus:bg-white focus:border-indigo-600 focus:outline-none transition-all appearance-none"
                    value={profile.wilaya || ''}
                    onChange={e => setProfile({ ...profile, wilaya: e.target.value })}
                  >
                    <option value="">Select your wilaya</option>
                    {ALGERIAN_WILAYAS.map(w => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[2px]">Date of Birth</label>
                <div className="relative group">
                  <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                  <input
                    type="date"
                    className="w-full pl-12 pr-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl font-bold text-gray-900 focus:bg-white focus:border-indigo-600 focus:outline-none transition-all"
                    value={profile.date_of_birth || ''}
                    onChange={e => setProfile({ ...profile, date_of_birth: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SAVE BUTTON */}
          <div className="flex items-center gap-6">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-3 px-10 py-5 bg-indigo-600 text-white rounded-[24px] font-black uppercase tracking-widest text-sm shadow-2xl shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-1 transition-all disabled:opacity-70 disabled:translate-y-0"
            >
              {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
            {savedMsg && (
              <span className="flex items-center gap-2 text-emerald-600 font-black text-sm">
                <CheckCircle2 size={18} /> {savedMsg}
              </span>
            )}
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
