import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Save, BookOpen, Globe, Award,
  Plus, X, CheckCircle2, Loader2, Mail, MapPin, Calendar
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import {
  getMyCV, updateMyCV,
  getAllSkills, getMySkills, addSkill, removeSkill
} from '../../api/studentApi';
import { getMediaUrl } from '../../api/axios';

const ACADEMIC_YEARS = [
  { value: 'year_1', label: 'Year 1 (License 1)' },
  { value: 'year_2', label: 'Year 2 (License 2)' },
  { value: 'year_3', label: 'Year 3 (License 3)' },
  { value: 'year_4', label: 'Year 4 (Master 1)' },
  { value: 'year_5', label: 'Year 5 (Master 2)' },
  { value: 'doctorate', label: 'Doctorate' },
];

export default function DigitalCVPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [cv, setCV] = useState(null);
  const [allSkills, setAllSkills] = useState([]);
  const [mySkills, setMySkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [addingSkill, setAddingSkill] = useState(false);

  // Editable fields
  const [academicYear, setAcademicYear] = useState('');
  const [summary, setSummary] = useState('');
  const [github, setGithub] = useState('');
  const [portfolio, setPortfolio] = useState('');

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const [cvRes, allSkRes, mySkRes] = await Promise.all([
        getMyCV(),
        getAllSkills(),
        getMySkills(),
      ]);
      const data = cvRes.data;
      setCV(data);
      setAcademicYear(data.academic_year || '');
      setSummary(data.professional_summary || data.bio || '');
      setGithub(data.github_link || '');
      setPortfolio(data.portfolio_link || '');
      setAllSkills(allSkRes.data);
      setMySkills(mySkRes.data);
    } catch (err) {
      console.error('Failed to load CV', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSavedMsg('');
    try {
      await updateMyCV({
        academic_year: academicYear,
        professional_summary: summary,
        github_link: github,
        portfolio_link: portfolio,
      });
      setSavedMsg('CV saved successfully!');
      setTimeout(() => setSavedMsg(''), 3000);
    } catch (err) {
      console.error('Save failed', err);
    } finally {
      setSaving(false);
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

  const mySkillIds = mySkills.map(s => s.skill?.id);
  const availableSkills = allSkills.filter(s => !mySkillIds.includes(s.id));

  if (loading) return (
    <DashboardLayout role="student">
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    </DashboardLayout>
  );

  if (!cv) return null;

  return (
    <DashboardLayout role="student">
      <div className="p-8 lg:p-12 max-w-5xl mx-auto animate-fade-in pb-24">

        {/* HEADER */}
        <div className="flex items-center gap-6 mb-12">
          <button
            onClick={() => navigate('/student')}
            className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">Digital CV</h1>
            <p className="text-gray-500 font-bold mt-1">Manage your academic and professional profile</p>
          </div>
        </div>

        {/* CV PREVIEW + EDITOR */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

          {/* LEFT — CV PREVIEW CARD */}
          <div className="space-y-6">
            {/* Mini CV Card */}
            <div className="bg-white rounded-[32px] border border-gray-100 shadow-xl overflow-hidden">
              {/* Header bar */}
              <div className="bg-indigo-600 px-8 py-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 blur-3xl rounded-full translate-x-10 -translate-y-10"></div>
                <div className="flex items-start gap-5 relative z-10">
                  {/* Avatar */}
                  <div className="w-20 h-20 rounded-[20px] bg-white/20 backdrop-blur-md border-2 border-white/30 shadow-xl overflow-hidden flex items-center justify-center shrink-0">
                    {cv.profile_image ? (
                      <img src={getMediaUrl(cv.profile_image)} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl font-black text-white">{(cv.full_name || 'S')[0]}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-black text-white tracking-tight leading-tight">{cv.full_name || 'Your Name'}</h2>
                    <p className="text-indigo-200 font-medium text-sm mt-1 flex items-center gap-1.5">
                      <Mail size={14} /> {user?.email}
                    </p>
                    {cv.university && (
                      <p className="text-indigo-200 font-medium text-sm flex items-center gap-1.5 mt-0.5">
                        <BookOpen size={14} /> {cv.university.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-8 space-y-6">

                {/* Quick stats row */}
                <div className="grid grid-cols-2 gap-4">
                  {cv.university && (
                    <div className="bg-gray-50 rounded-2xl p-4">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">University</p>
                      <p className="text-sm font-black text-gray-900 leading-tight">{cv.university.name}</p>
                    </div>
                  )}
                  {academicYear && (
                    <div className="bg-gray-50 rounded-2xl p-4">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Academic Year</p>
                      <p className="text-sm font-black text-gray-900 leading-tight">
                        {ACADEMIC_YEARS.find(y => y.value === academicYear)?.label || academicYear}
                      </p>
                    </div>
                  )}
                  {cv.wilaya && (
                    <div className="bg-gray-50 rounded-2xl p-4">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Location</p>
                      <p className="text-sm font-black text-gray-900 leading-tight">{cv.wilaya}</p>
                    </div>
                  )}
                  {cv.date_of_birth && (
                    <div className="bg-gray-50 rounded-2xl p-4">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Birth Date</p>
                      <p className="text-sm font-black text-gray-900 leading-tight">
                        {new Date(cv.date_of_birth).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  )}
                </div>

                {/* Professional Summary */}
                {(summary || cv.professional_summary || cv.bio) && (
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Award size={12} /> Professional Summary
                    </p>
                    <p className="text-sm text-gray-600 font-medium leading-relaxed">
                      {summary || cv.professional_summary || cv.bio}
                    </p>
                  </div>
                )}

                {/* Links */}
                {(github || portfolio || cv.github_link || cv.portfolio_link) && (
                  <div className="flex flex-wrap gap-3">
                    {(github || cv.github_link) && (
                      <a
                        href={github || cv.github_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-800 transition-colors"
                      >
                        <Globe size={14} /> GitHub
                      </a>
                    )}
                    {(portfolio || cv.portfolio_link) && (
                      <a
                        href={portfolio || cv.portfolio_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-colors"
                      >
                        <Globe size={14} /> Portfolio
                      </a>
                    )}
                  </div>
                )}

                {/* Skills */}
                {mySkills.length > 0 && (
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {mySkills.map(s => (
                        <span key={s.id} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl font-black text-[10px] uppercase tracking-widest border border-indigo-100">
                          {s.skill?.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Stag.io Digital CV</span>
                <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Student Profile</span>
              </div>
            </div>

            {/* Note about university */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3.5 flex items-start gap-3">
              <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 shrink-0 mt-0.5">
                <BookOpen size={16} />
              </div>
              <p className="text-[11px] font-bold text-amber-800 leading-relaxed">
                Your university is automatically assigned based on your registration email and cannot be changed.
              </p>
            </div>
          </div>

          {/* RIGHT — EDITOR FORM */}
          <div className="space-y-8">
            <form onSubmit={handleSave} className="space-y-8">

              {/* Academic Year */}
              <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8">
                <h2 className="text-xl font-black text-gray-900 mb-6 tracking-tight">Academic Information</h2>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[2px]">Academic Year</label>
                    <select
                      className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl font-bold text-gray-900 focus:bg-white focus:border-indigo-600 focus:outline-none transition-all appearance-none"
                      value={academicYear}
                      onChange={e => setAcademicYear(e.target.value)}
                    >
                      <option value="">Select your year</option>
                      {ACADEMIC_YEARS.map(y => (
                        <option key={y.value} value={y.value}>{y.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[2px]">Professional Summary</label>
                    <textarea
                      className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl font-bold text-gray-900 focus:bg-white focus:border-indigo-600 focus:outline-none transition-all min-h-[140px] resize-none"
                      placeholder="Briefly describe your interests, goals, and what you're looking for..."
                      value={summary}
                      onChange={e => setSummary(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Links */}
              <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8">
                <h2 className="text-xl font-black text-gray-900 mb-6 tracking-tight">Links</h2>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[2px]">GitHub URL</label>
                    <div className="relative group">
                      <Globe className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                      <input
                        type="url"
                        className="w-full pl-12 pr-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl font-bold text-gray-900 focus:bg-white focus:border-indigo-600 focus:outline-none transition-all"
                        placeholder="https://github.com/username"
                        value={github}
                        onChange={e => setGithub(e.target.value)}
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
                        value={portfolio}
                        onChange={e => setPortfolio(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Save CV */}
              <div className="flex items-center gap-6">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-3 px-10 py-5 bg-indigo-600 text-white rounded-[24px] font-black uppercase tracking-widest text-sm shadow-2xl shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-1 transition-all disabled:opacity-70 disabled:translate-y-0"
                >
                  {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                  {saving ? 'Saving...' : 'Save CV'}
                </button>
                {savedMsg && (
                  <span className="flex items-center gap-2 text-emerald-600 font-black text-sm">
                    <CheckCircle2 size={18} /> {savedMsg}
                  </span>
                )}
              </div>
            </form>

            {/* Skills section */}
            <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8">
              <h2 className="text-xl font-black text-gray-900 mb-6 tracking-tight">Skills</h2>

              {/* My skills */}
              <div className="flex flex-wrap gap-3 mb-8 min-h-[44px]">
                {mySkills.length === 0 && (
                  <p className="text-gray-400 font-bold text-sm">No skills added yet.</p>
                )}
                {mySkills.map(s => (
                  <span key={s.id} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-2xl text-xs font-black uppercase tracking-widest border border-indigo-100">
                    {s.skill?.name}
                    <button type="button" onClick={() => handleRemoveSkill(s.id)} className="hover:text-rose-500 transition-colors">
                      <X size={14} />
                    </button>
                  </span>
                ))}
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
                    <p className="text-emerald-600 font-black text-sm flex items-center gap-2">
                      <CheckCircle2 size={16} /> All skills added!
                    </p>
                  )}
                  {allSkills.length === 0 && (
                    <p className="text-gray-400 font-bold text-sm">No skills available.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}