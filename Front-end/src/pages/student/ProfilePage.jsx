import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Camera, Save, User, MapPin, GitBranch, Globe,
  BookOpen, Plus, X, CheckCircle2, Loader2
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import {
  getStudentProfile, updateStudentProfile, uploadProfileImage,
  getMyCV, updateMyCV,
  getAllSkills, getMySkills, addSkill, removeSkill
} from '../../api/studentApi';
import { getUniversities } from '../../api/publicApi';
import { getMediaUrl } from '../../api/axios';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileRef = useRef();

  const [profile, setProfile] = useState({ full_name: '', wilaya: '' });
  const [cv, setCV] = useState({ university: '', academic_year: '', summary: '', github: '', portfolio: '' });
  const [universities, setUniversities] = useState([]);
  const [allSkills, setAllSkills] = useState([]);
  const [mySkills, setMySkills] = useState([]);
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [uploadingImg, setUploadingImg] = useState(false);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const [profRes, cvRes, uniRes, allSkRes, mySkRes] = await Promise.all([
        getStudentProfile(),
        getMyCV(),
        getUniversities(),
        getAllSkills(),
        getMySkills(),
      ]);
      setProfile(profRes.data);
      
      setCV({
        university: cvRes.data.university?.id || '',
        academic_year: cvRes.data.academic_year || '',
        summary: cvRes.data.bio || '',
        github: cvRes.data.github_link || '',
        portfolio: cvRes.data.portfolio_link || ''
      });

      setUniversities(uniRes.data);
      setAllSkills(allSkRes.data);
      setMySkills(mySkRes.data);
      setProfileImage(profRes.data.profile_image || null);
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
      const cvPayload = {
        university: cv.university || null,
        academic_year: cv.academic_year || '',
        bio: cv.summary || '',
        github_link: cv.github || '',
        portfolio_link: cv.portfolio || ''
      };

      await Promise.all([
        updateStudentProfile({ full_name: profile.full_name, wilaya: profile.wilaya }),
        updateMyCV(cvPayload),
      ]);
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

  const handleAddSkill = async (skill) => {
    if (mySkills.find(s => s.skill === skill.id)) return;
    try {
      await addSkill(skill.id);
      await loadSkills();
    } catch (err) {
      console.error('Add skill failed', err);
    }
  };

  const handleRemoveSkill = async (skillEntryId) => {
    try {
      await removeSkill(skillEntryId);
      await loadSkills();
    } catch (err) {
      console.error('Remove skill failed', err);
    }
  };

  const loadSkills = async () => {
    const res = await getMySkills();
    setMySkills(res.data);
  };

  const mySkillIds = mySkills.map(s => s.skill);
  const availableSkills = allSkills.filter(s => !mySkillIds.includes(s.id));

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
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">My Profile</h1>
            <p className="text-gray-500 font-bold mt-1">Manage your personal info, CV, and skills</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-10">

          {/* AVATAR SECTION */}
          <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm p-10">
            <h2 className="text-xl font-black text-gray-900 mb-8 tracking-tight">Profile Photo</h2>
            <div className="flex items-center gap-8">
              <div className="relative group">
                <div className="w-28 h-28 rounded-[28px] bg-indigo-50 border-4 border-white shadow-xl overflow-hidden flex items-center justify-center">
                  {uploadingImg ? (
                    <Loader2 className="animate-spin text-indigo-600" size={32} />
                  ) : profileImage ? (
                    <img src={getMediaUrl(profileImage)} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl font-black text-indigo-600">
                      {(profile.full_name || user?.email || 'S')[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="absolute -bottom-2 -right-2 w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg hover:bg-indigo-700 transition-all"
                >
                  <Camera size={18} />
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </div>
              <div>
                <p className="font-black text-gray-900 text-xl">{profile.full_name || 'Your Name'}</p>
                <p className="text-gray-500 font-bold text-sm mt-1">{user?.email}</p>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-3">
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
                  <input
                    className="w-full pl-12 pr-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl font-bold text-gray-900 focus:bg-white focus:border-indigo-600 focus:outline-none transition-all"
                    placeholder="e.g. Algiers"
                    value={profile.wilaya || ''}
                    onChange={e => setProfile({ ...profile, wilaya: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* CV / ACADEMIC INFO */}
          <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm p-10">
            <h2 className="text-xl font-black text-gray-900 mb-8 tracking-tight">Academic Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[2px]">University</label>
                <div className="relative group">
                  <BookOpen className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                  <select
                    className="w-full pl-12 pr-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl font-bold text-gray-900 focus:bg-white focus:border-indigo-600 focus:outline-none transition-all appearance-none"
                    value={cv.university || ''}
                    onChange={e => setCV({ ...cv, university: e.target.value })}
                  >
                    <option value="">Select university</option>
                    {universities.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[2px]">Academic Year</label>
                <select
                  className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl font-bold text-gray-900 focus:bg-white focus:border-indigo-600 focus:outline-none transition-all appearance-none"
                  value={cv.academic_year || ''}
                  onChange={e => setCV({ ...cv, academic_year: e.target.value })}
                >
                  <option value="">Select year</option>
                  {['1st year', '2nd year', '3rd year', '4th year', '5th year', 'Master 1', 'Master 2'].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2 mb-6">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[2px]">Professional Summary</label>
              <textarea
                className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl font-bold text-gray-900 focus:bg-white focus:border-indigo-600 focus:outline-none transition-all min-h-[120px] resize-none"
                placeholder="Briefly describe your interests and goals..."
                value={cv.summary || ''}
                onChange={e => setCV({ ...cv, summary: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[2px]">GitHub URL</label>
                <div className="relative group">
                  <GitBranch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                  <input
                    type="url"
                    className="w-full pl-12 pr-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl font-bold text-gray-900 focus:bg-white focus:border-indigo-600 focus:outline-none transition-all"
                    placeholder="https://github.com/username"
                    value={cv.github || ''}
                    onChange={e => setCV({ ...cv, github: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[2px]">Portfolio URL</label>
                <div className="relative group">
                  <Globe className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                  <input
                    type="url"
                    className="w-full pl-12 pr-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl font-bold text-gray-900 focus:bg-white focus:border-indigo-600 focus:outline-none transition-all"
                    placeholder="https://yourportfolio.com"
                    value={cv.portfolio || ''}
                    onChange={e => setCV({ ...cv, portfolio: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SKILLS */}
          <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm p-10">
            <h2 className="text-xl font-black text-gray-900 mb-8 tracking-tight">Skills</h2>

            {/* My skills */}
            <div className="flex flex-wrap gap-3 mb-8 min-h-[48px]">
              {mySkills.length === 0 && (
                <p className="text-gray-400 font-bold text-sm">No skills added yet. Add some below.</p>
              )}
              {mySkills.map(s => {
                const skill = allSkills.find(sk => sk.id === s.skill);
                return (
                  <span key={s.id} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-2xl text-xs font-black uppercase tracking-widest border border-indigo-100">
                    {skill?.name || s.skill}
                    <button type="button" onClick={() => handleRemoveSkill(s.id)} className="hover:text-rose-500 transition-colors">
                      <X size={14} />
                    </button>
                  </span>
                );
              })}
            </div>

            {/* Available skills */}
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-4">Add Skills</p>
              <div className="flex flex-wrap gap-2">
                {availableSkills.map(skill => (
                  <button
                    type="button"
                    key={skill.id}
                    onClick={() => handleAddSkill(skill)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 rounded-2xl text-xs font-black uppercase tracking-widest border border-gray-100 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-all"
                  >
                    <Plus size={12} />
                    {skill.name}
                  </button>
                ))}
                {availableSkills.length === 0 && allSkills.length > 0 && (
                  <p className="text-gray-400 font-bold text-sm flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-500" /> All skills added!
                  </p>
                )}
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
