import React, { useState } from 'react';
import { X, Download, Share2, Copy, CheckCircle2, Sparkles, Send, ExternalLink, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

const API_BASE = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
  ? ''
  : (import.meta.env.VITE_API_BASE_URL || 'http://150.136.214.192');

export default function PlaycardModal({ job, onClose }) {
  const [copied, setCopied] = useState(false);
  const [posting, setPosting] = useState(false);
  const [postResult, setPostResult] = useState(null);
  const [pageId, setPageId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [showConfig, setShowConfig] = useState(false);

  if (!job) return null;

  const playcardUrl = `${API_BASE}/api/jobs/${job.id}/playcard.png`;

  const caption = `🚀 NEW OPPORTUNITY ALERT: ${job.title}

🏢 Company: ${job.company_name}
📍 Location: ${job.location || 'Worldwide Remote'} (${job.job_type || 'Remote'})
💰 Salary: {job.salary_range || 'Competitive Global Compensation'}
🏷 Category: ${job.category || 'Tech'}

👉 APPLY ONLINE & VIEW FULL DETAILS:
https://globalhireai.vercel.app

🌐 Explore 190+ Verified Worldwide Remote Jobs:
https://globalhireai.vercel.app

#GlobalHireAI #RemoteJobs #TechCareers #Hiring #WorkFromAnywhere`;

  const handleCopyCaption = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(caption);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownloadImage = () => {
    const a = document.createElement('a');
    a.href = playcardUrl;
    a.download = `GlobalHire_${job.company_name}_${job.id}_playcard.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePostToFacebook = async () => {
    setPosting(true);
    setPostResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/jobs/${job.id}/post-facebook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page_id: pageId || undefined, access_token: accessToken || undefined })
      });
      const data = await res.json();
      setPostResult(data);
      if (data.status === 'success') {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#00DF81', '#1877F2', '#0A241B']
        });
      }
    } catch (err) {
      setPostResult({ status: 'error', detail: err.message });
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-4xl bg-[#ECEEE9] border border-black/[0.08] rounded-[32px] p-6 sm:p-8 shadow-2xl max-h-[92vh] overflow-y-auto text-[#17261F]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-2xl bg-white hover:bg-slate-100 text-[#57685E] shadow-sm transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-xl bg-[#0A241B] text-[#00DF81] flex items-center justify-center font-bold">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-lg font-black text-[#17261F]">Facebook & Social Playcard Generator</h3>
            <p className="text-xs text-[#6C7A72]">Auto-rendered 1080x1080 high-contrast social flyer ready for auto-posting</p>
          </div>
        </div>

        {/* Main Content Grid: Preview on Left, Actions & Caption on Right */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-6">
          
          {/* Left: Real-time Rendered Playcard Image */}
          <div className="md:col-span-6 flex flex-col items-center">
            <div className="w-full aspect-square rounded-[28px] overflow-hidden shadow-xl border border-black/[0.08] bg-[#0A241B] relative group">
              <img 
                src={playcardUrl} 
                alt="Job Social Playcard" 
                className="w-full h-full object-cover transition-transform group-hover:scale-[1.02] duration-300"
              />
            </div>
            
            <button
              onClick={handleDownloadImage}
              className="mt-3.5 w-full py-2.5 px-4 rounded-2xl bg-white hover:bg-slate-50 border border-black/[0.06] text-xs font-bold text-[#17261F] flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <Download className="w-4 h-4 text-[#0A5734]" />
              <span>Download 1080x1080 High-Res PNG</span>
            </button>
          </div>

          {/* Right: Caption + Direct Facebook Post */}
          <div className="md:col-span-6 flex flex-col justify-between space-y-4">
            
            {/* Caption Preview Box */}
            <div className="bg-white p-4 rounded-2xl border border-black/[0.06] shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#17261F]">Formatted Facebook Caption</span>
                <button
                  onClick={handleCopyCaption}
                  className="px-2.5 py-1 rounded-xl bg-[#E3F9ED] text-[#0A5734] text-[11px] font-bold flex items-center gap-1 hover:bg-[#D4F5E2] transition-colors"
                >
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-[#00DF81]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Caption'}</span>
                </button>
              </div>

              <textarea
                readOnly
                rows="7"
                value={caption}
                className="w-full p-2.5 rounded-xl bg-[#F4F6F2] text-[11px] text-[#3D4D43] font-sans leading-relaxed focus:outline-none resize-none"
              ></textarea>
            </div>

            {/* Facebook API Auto-Post Card */}
            <div className="bg-[#0A241B] text-white p-5 rounded-2xl shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-[#1877F2] text-white flex items-center justify-center font-bold text-xs">
                    f
                  </div>
                  <span className="text-xs font-bold text-white">Facebook Page Auto-Poster</span>
                </div>
                <button
                  onClick={() => setShowConfig(!showConfig)}
                  className="text-[10px] text-emerald-300 hover:underline font-mono"
                >
                  {showConfig ? 'Hide Config' : 'Page Tokens'}
                </button>
              </div>

              {showConfig && (
                <div className="space-y-2 pt-2 border-t border-white/10 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-300 block mb-1">Facebook Page ID</label>
                    <input
                      type="text"
                      placeholder="e.g. 104829104928"
                      value={pageId}
                      onChange={(e) => setPageId(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-white/10 text-white placeholder-slate-400 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-300 block mb-1">Page Access Token</label>
                    <input
                      type="password"
                      placeholder="EAA..."
                      value={accessToken}
                      onChange={(e) => setAccessToken(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-white/10 text-white placeholder-slate-400 text-xs focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handlePostToFacebook}
                disabled={posting}
                className="w-full py-2.5 rounded-2xl bg-[#00DF81] hover:bg-[#2EF8A0] text-[#0A241B] font-extrabold text-xs flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(0,223,129,0.3)] transition-all active:scale-95 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{posting ? 'Publishing to Facebook...' : 'Publish to Facebook Page'}</span>
              </button>

              {postResult && (
                <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                  postResult.status === 'success' 
                    ? 'bg-emerald-500/20 text-emerald-300' 
                    : 'bg-amber-500/20 text-amber-200'
                }`}>
                  {postResult.status === 'success' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Post Live on Facebook! ID: {postResult.post_id}</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>{postResult.message || 'Configure Page ID & Token to publish directly.'}</span>
                    </>
                  )}
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}

