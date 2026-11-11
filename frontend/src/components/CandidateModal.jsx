import React, { useState } from 'react';
import { X, Mail, GraduationCap, Briefcase, Sparkles, CheckCircle2, User, Phone, Layers, Send, Award } from 'lucide-react';
import confetti from 'canvas-confetti';
import { subscribeCandidate } from '../api';

const EDUCATION_OPTIONS = [
  "BS Computer Science / Software Engineering",
  "BS Information Technology (IT)",
  "BBA / MBA / Finance & Accounting",
  "Bachelor of Arts (BA / Fine Arts)",
  "Engineering (Electrical / Civil / Mechanical)",
  "Intermediate / FSC / ICS / D.Com",
  "Matriculation (High School)",
  "Master / MS / MPhil",
  "Diploma / Self-Taught Developer"
];

const CATEGORY_OPTIONS = [
  "All Categories",
  "Software Dev",
  "AI/Data",
  "Design",
  "Marketing",
  "Customer Support",
  "Management"
];

export default function CandidateModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    education: 'BS Computer Science / Software Engineering',
    category: 'Software Dev',
    skills: 'Python, React, AI',
    experience_level: 'Fresh Graduate / Student',
    preferred_job_type: 'Remote',
    resume_text: ''
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const skillsArray = formData.skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        ...formData,
        category: formData.category === 'All Categories' ? 'All' : formData.category,
        skills: skillsArray
      };

      const res = await subscribeCandidate(payload);
      setResultData(res);
      setSuccess(true);
      setLoading(false);

      try {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#00DF81', '#10B981', '#0A241B']
        });
      } catch (err) {}
    } catch (err) {
      setError(err.message || "Failed to submit profile. Please try again.");
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSuccess(false);
    setResultData(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl my-8 bg-white rounded-3xl shadow-2xl border border-black/[0.08] overflow-hidden">
        
        {/* Header */}
        <div className="bg-[#0A241B] px-6 py-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00DF81]/15 text-[#00DF81] text-[11px] font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Automated Career Radar</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-white">
            Drop Your CV & Get Instant Job Alerts
          </h2>
          <p className="text-xs sm:text-sm text-[#A3B8AC] mt-1">
            Whenever a verified worldwide job matching your education arrives, you will automatically receive an email alert!
          </p>
        </div>

        {/* Success View */}
        {success ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-[#E3F9ED] text-[#0A5734] flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10 text-[#00DF81]" />
            </div>

            <h3 className="text-xl font-extrabold text-[#17261F]">
              Profile Successfully Registered! 🎉
            </h3>
            
            <p className="text-sm text-[#57685E] mt-2 max-w-md mx-auto">
              Our automated 24/7 job scraper already found{' '}
              <strong className="text-[#0A5734] font-bold text-base">
                {resultData?.immediate_matches_count || 0} active jobs
              </strong>{' '}
              matching your education and skills in our database.
            </p>

            <div className="mt-5 p-4 rounded-2xl bg-[#F5F7F3] border border-black/[0.06] text-left text-xs text-[#57685E] space-y-1.5">
              <p>📩 <strong>Confirmation:</strong> Email alert will be dispatched to <strong>{formData.email}</strong></p>
              <p>🎓 <strong>Education Radar:</strong> {formData.education}</p>
              <p>⚡ <strong>Auto-Pilot Status:</strong> Active 24/7. Whenever a new role is scraped from Remotive, Arbeitnow, or Himalayas, you'll be notified first!</p>
            </div>

            <button
              onClick={handleReset}
              className="mt-6 w-full py-3.5 rounded-2xl font-bold text-sm bg-[#0A241B] hover:bg-[#12382B] text-white transition-all shadow-md"
            >
              Done & Explore Current Jobs
            </button>
          </div>
        ) : (
          /* Form View */
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4 max-h-[75vh] overflow-y-auto">
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold">
                {error}
              </div>
            )}

            {/* Full Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#17261F] mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-[#8C9B92]" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ali Khan"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-black/[0.1] bg-[#F9FAF8] text-xs font-medium focus:outline-none focus:border-[#00DF81] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17261F] mb-1">
                  Email Address * (For Job Alerts)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-[#8C9B92]" />
                  <input
                    type="email"
                    required
                    placeholder="you@gmail.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-black/[0.1] bg-[#F9FAF8] text-xs font-medium focus:outline-none focus:border-[#00DF81] transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Education / Qualification */}
            <div>
              <label className="block text-xs font-bold text-[#17261F] mb-1">
                Highest Education / Degree *
              </label>
              <div className="relative">
                <GraduationCap className="absolute left-3.5 top-3 w-4 h-4 text-[#8C9B92]" />
                <select
                  value={formData.education}
                  onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                  className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-black/[0.1] bg-[#F9FAF8] text-xs font-medium focus:outline-none focus:border-[#00DF81] transition-all appearance-none"
                >
                  {EDUCATION_OPTIONS.map((edu, idx) => (
                    <option key={idx} value={edu}>{edu}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Target Category & Experience */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#17261F] mb-1">
                  Interested Field / Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/[0.1] bg-[#F9FAF8] text-xs font-medium focus:outline-none focus:border-[#00DF81] transition-all"
                >
                  {CATEGORY_OPTIONS.map((cat, idx) => (
                    <option key={idx} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17261F] mb-1">
                  Experience Level
                </label>
                <select
                  value={formData.experience_level}
                  onChange={(e) => setFormData({ ...formData, experience_level: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/[0.1] bg-[#F9FAF8] text-xs font-medium focus:outline-none focus:border-[#00DF81] transition-all"
                >
                  <option value="Fresh Graduate / Student">Fresh Graduate / Student</option>
                  <option value="1-2 Years">1-2 Years Junior</option>
                  <option value="3-5 Years">3-5 Years Mid-Level</option>
                  <option value="5+ Years Senior">5+ Years Senior Specialist</option>
                </select>
              </div>
            </div>

            {/* Skills */}
            <div>
              <label className="block text-xs font-bold text-[#17261F] mb-1">
                Key Skills / Tools (Comma separated)
              </label>
              <input
                type="text"
                placeholder="e.g. Python, React, Customer Support, Graphic Design, Teaching, SEO"
                value={formData.skills}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-black/[0.1] bg-[#F9FAF8] text-xs font-medium focus:outline-none focus:border-[#00DF81] transition-all"
              />
              <p className="text-[10px] text-[#6C7A72] mt-1">
                Our AI engine scans job titles & descriptions for these exact keywords.
              </p>
            </div>

            {/* Phone (Optional) & Job Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#17261F] mb-1">
                  WhatsApp / Phone (Optional)
                </label>
                <input
                  type="text"
                  placeholder="+92 300 1234567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/[0.1] bg-[#F9FAF8] text-xs font-medium focus:outline-none focus:border-[#00DF81] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17261F] mb-1">
                  Job Preference
                </label>
                <select
                  value={formData.preferred_job_type}
                  onChange={(e) => setFormData({ ...formData, preferred_job_type: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/[0.1] bg-[#F9FAF8] text-xs font-medium focus:outline-none focus:border-[#00DF81] transition-all"
                >
                  <option value="Remote">100% Worldwide Remote</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Any">Any Opportunity</option>
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl font-extrabold text-xs text-[#0A241B] bg-[#00DF81] hover:bg-[#2EF8A0] transition-all shadow-[0_4px_14px_rgba(0,223,129,0.35)] flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {loading ? (
                  <span>Registering Profile...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Activate AI Job Radar & Get Email Alerts</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

