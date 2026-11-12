import React, { useState, useEffect } from 'react';
import { 
  X, Mail, GraduationCap, Briefcase, Sparkles, CheckCircle2, 
  User, Phone, Layers, Send, Award, ExternalLink, ArrowRight, Building2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { subscribeCandidate, logJobApply } from '../api';
import { useDirectLink } from '../useDirectLink';

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

export default function CandidateModal({ isOpen, onClose, targetJob = null }) {
  const { triggerDirectLink } = useDirectLink();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    education: 'BS Computer Science / Software Engineering',
    category: 'Software Dev',
    skills: 'Python, React, Remote Work',
    experience_level: 'Fresh Graduate / Student',
    preferred_job_type: 'Remote',
    resume_text: ''
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(3);

  // Load saved profile from localStorage if user applied previously
  useEffect(() => {
    if (isOpen) {
      setSuccess(false);
      setError(null);
      setCountdown(3);

      try {
        const saved = localStorage.getItem('globalhire_candidate_profile');
        if (saved) {
          const parsed = JSON.parse(saved);
          setFormData(prev => ({
            ...prev,
            ...parsed,
            category: targetJob?.category || parsed.category || 'Software Dev'
          }));
        } else if (targetJob?.category) {
          setFormData(prev => ({ ...prev, category: targetJob.category }));
        }
      } catch (e) {}
    }
  }, [isOpen, targetJob]);

  // Handle auto-redirect countdown if targetJob is set
  useEffect(() => {
    if (success && targetJob) {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            // Open official apply destination with session-capped Direct Link
            triggerDirectLink(targetJob.apply_url);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [success, targetJob]);

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

      // 1. Save candidate in database
      const res = await subscribeCandidate(payload);
      setResultData(res);

      // 2. Remember in localStorage for instant 1-click apply next time
      try {
        localStorage.setItem('globalhire_candidate_profile', JSON.stringify({
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          education: formData.education,
          skills: formData.skills,
          experience_level: formData.experience_level
        }));
      } catch (e) {}

      // 3. If applying for specific job, log the apply click
      if (targetJob?.id) {
        try {
          await logJobApply(targetJob.id);
        } catch (e) {}
      }

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

  const handleManualProceed = () => {
    if (targetJob) {
      triggerDirectLink(targetJob.apply_url);
    }
    onClose();
  };

  const handleReset = () => {
    setSuccess(false);
    setResultData(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-xl my-8 bg-white rounded-3xl shadow-2xl border border-black/[0.08] overflow-hidden text-[#17261F]">
        
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
            <span>{targetJob ? 'Fast-Track Job Application Gateway' : 'Automated Career Radar'}</span>
          </div>

          {targetJob ? (
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                Apply for {targetJob.title}
              </h2>
              <p className="text-xs sm:text-sm text-[#A3B8AC] mt-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#00DF81]" />
                <span>{targetJob.company}</span>
                <span>•</span>
                <span>Complete quick profile to continue to application</span>
              </p>
            </div>
          ) : (
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                Drop Your CV & Get Instant Job Alerts
              </h2>
              <p className="text-xs sm:text-sm text-[#A3B8AC] mt-1">
                Whenever a verified job matching your education arrives, you will receive an instant email alert!
              </p>
            </div>
          )}
        </div>

        {/* Success View */}
        {success ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-[#E3F9ED] text-[#0A5734] flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-[#00DF81]" />
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-[#17261F]">
                {targetJob ? 'Candidate Profile Saved! 🚀' : 'Profile Successfully Registered! 🎉'}
              </h3>
              
              {targetJob ? (
                <div className="mt-2 space-y-2 max-w-md mx-auto">
                  <p className="text-xs text-[#57685E]">
                    Your CV profile has been saved. You are being redirected to <strong>{targetJob.company}</strong>'s official job board in <strong className="text-emerald-700 font-mono text-sm">{countdown}s</strong>.
                  </p>
                  
                  <div className="p-4 rounded-2xl bg-[#E3F9ED] border border-[#BCE8D3] text-left text-xs text-[#0A5734] space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#00DF81]" />
                      Candidate Profile Verified
                    </p>
                    <p>Applicant: <strong>{formData.full_name}</strong> ({formData.email})</p>
                    <p>Degree: <strong>{formData.education}</strong></p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[#57685E] mt-2 max-w-md mx-auto">
                  Our system found{' '}
                  <strong className="text-[#0A5734] font-bold text-base">
                    {resultData?.immediate_matches_count || 0} active jobs
                  </strong>{' '}
                  matching your education and skills in our database.
                </p>
              )}
            </div>

            {targetJob ? (
              <div className="pt-2">
                <button
                  onClick={handleManualProceed}
                  className="w-full py-4 rounded-2xl font-extrabold text-xs sm:text-sm bg-[#00DF81] hover:bg-[#2EF8A0] text-[#0A241B] transition-all shadow-[0_4px_16px_rgba(0,223,129,0.4)] flex items-center justify-center gap-2 active:scale-95"
                >
                  <span>Proceed to {targetJob.company} Application Portal</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
                <p className="text-[11px] text-[#8C9B92] mt-2">
                  Click the button above if your browser blocks automatic popup tabs.
                </p>
              </div>
            ) : (
              <button
                onClick={handleReset}
                className="w-full py-3.5 rounded-2xl font-bold text-sm bg-[#0A241B] hover:bg-[#12382B] text-white transition-all shadow-md"
              >
                Done & Explore Current Jobs
              </button>
            )}
          </div>
        ) : (
          /* Form View */
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4 max-h-[75vh] overflow-y-auto">
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold">
                {error}
              </div>
            )}

            {targetJob && (
              <div className="p-3 rounded-2xl bg-[#F4F6F2] border border-black/[0.05] text-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#6C7A72] block">Target Role</span>
                  <span className="font-extrabold text-[#17261F]">{targetJob.title}</span>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-white border border-black/[0.06] text-[#0A5734]">
                  {targetJob.company}
                </span>
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
                  Email Address * (For Updates & Alerts)
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

            {/* Phone & Education */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#17261F] mb-1">
                  Phone / WhatsApp (Optional)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 w-4 h-4 text-[#8C9B92]" />
                  <input
                    type="tel"
                    placeholder="e.g. +92 300 1234567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-black/[0.1] bg-[#F9FAF8] text-xs font-medium focus:outline-none focus:border-[#00DF81] transition-all"
                  />
                </div>
              </div>

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
            </div>

            {/* Target Category & Experience */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#17261F] mb-1">
                  Primary Field / Discipline
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
                placeholder="e.g. Python, React, Teaching, SQL, Customer Service"
                value={formData.skills}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-black/[0.1] bg-[#F9FAF8] text-xs font-medium focus:outline-none focus:border-[#00DF81] transition-all"
              />
            </div>

            {/* CV / Resume Summary */}
            <div>
              <label className="block text-xs font-bold text-[#17261F] mb-1">
                CV / Experience Note (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Paste key achievements, LinkedIn URL, portfolio link, or brief intro..."
                value={formData.resume_text}
                onChange={(e) => setFormData({ ...formData, resume_text: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-black/[0.1] bg-[#F9FAF8] text-xs font-medium focus:outline-none focus:border-[#00DF81] transition-all resize-none"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl font-black text-xs sm:text-sm bg-[#00DF81] hover:bg-[#2EF8A0] text-[#0A241B] transition-all shadow-[0_4px_16px_rgba(0,223,129,0.4)] flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {loading ? (
                  <span>Saving Candidate Profile...</span>
                ) : targetJob ? (
                  <>
                    <span>Submit & Proceed to {targetJob.company} Application</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Register CV & Activate Job Alerts</span>
                  </>
                )}
              </button>
              
              <p className="text-[10px] text-center text-[#8C9B92] mt-2">
                🔒 Privacy guaranteed. Your profile is stored securely and never shared with spam networks.
              </p>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
