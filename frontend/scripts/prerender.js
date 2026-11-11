// Static Prerender & SEO Generator for GlobalHire AI
// Runs after `vite build` to generate static HTML, sitemap.xml, and robots.txt

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, '../dist');
const PUBLIC_DIR = path.resolve(__dirname, '../public');
const API_BASE = 'http://150.136.214.192';
const SITE_URL = 'https://globalhireai.vercel.app';

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatSeoTitle(jobTitle, companyName) {
  const cleanTitle = (jobTitle || 'Remote Role').trim();
  const cleanCompany = (companyName || 'Company').trim();
  const brand = 'GlobalHire AI';

  // Format 1: "Job Title at Company | GlobalHire AI"
  const full = `${cleanTitle} at ${cleanCompany} | ${brand}`;
  if (full.length <= 58) return full;

  // Format 2: "Job Title at Company"
  const mid = `${cleanTitle} at ${cleanCompany}`;
  if (mid.length <= 58) return mid;

  // Format 3: Truncate title gracefully before "at Company"
  const maxTitleLen = Math.max(20, 54 - cleanCompany.length);
  return `${cleanTitle.slice(0, maxTitleLen).trim()}... at ${cleanCompany}`;
}

async function run() {
  console.log('🚀 Starting SEO Prerendering...');

  if (!fs.existsSync(DIST_DIR)) {
    console.error('Error: dist folder does not exist. Run vite build first.');
    process.exit(1);
  }

  const templateHtml = fs.readFileSync(path.join(DIST_DIR, 'index.html'), 'utf8');

  // 1. Fetch all live jobs across paginated endpoints (limit <= 100)
  let jobs = [];
  try {
    for (let page = 1; page <= 5; page++) {
      const res = await fetch(`${API_BASE}/api/jobs?page=${page}&limit=100`, {
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        const pageJobs = data.jobs || [];
        if (pageJobs.length === 0) break;
        jobs.push(...pageJobs);
        if (pageJobs.length < 100) break;
      } else {
        break;
      }
    }
    console.log(`✓ Fetched ${jobs.length} jobs across pages for static prerender.`);
  } catch (err) {
    console.warn('Warning: Could not fetch jobs from API, skipping job pages prerender:', err.message);
  }

  const sitemapUrls = [
    { loc: `${SITE_URL}/`, priority: '1.0', changefreq: 'hourly' },
    { loc: `${SITE_URL}/about`, priority: '0.7', changefreq: 'monthly' },
    { loc: `${SITE_URL}/contact`, priority: '0.7', changefreq: 'monthly' },
    { loc: `${SITE_URL}/privacy`, priority: '0.5', changefreq: 'monthly' },
    { loc: `${SITE_URL}/terms`, priority: '0.5', changefreq: 'monthly' }
  ];

  // 2. Prerender each individual job page at /jobs/[slug]/index.html
  const jobsDir = path.join(DIST_DIR, 'jobs');
  if (!fs.existsSync(jobsDir)) fs.mkdirSync(jobsDir, { recursive: true });

  for (const job of jobs) {
    const slug = `${slugify(job.title)}-${slugify(job.company_name)}-${job.id}`;
    const jobPageDir = path.join(jobsDir, slug);
    if (!fs.existsSync(jobPageDir)) fs.mkdirSync(jobPageDir, { recursive: true });

    const jobUrl = `${SITE_URL}/jobs/${slug}`;
    sitemapUrls.push({ loc: jobUrl, priority: '0.8', changefreq: 'daily' });

    // Dates for schema
    const postedDate = job.posted_at ? new Date(job.posted_at).toISOString() : new Date().toISOString();
    const validThroughDate = new Date(Date.now() + 90 * 86400000).toISOString();

    // BaseSalary if available
    let baseSalarySchema = undefined;
    if (job.salary_range && job.salary_range !== 'Competitive') {
      const nums = job.salary_range.match(/\d[\d,.]*/g);
      if (nums && nums.length > 0) {
        const val = parseFloat(nums[0].replace(/,/g, '')) * (job.salary_range.toLowerCase().includes('k') ? 1000 : 1);
        baseSalarySchema = {
          "@type": "MonetaryAmount",
          "currency": "USD",
          "value": {
            "@type": "QuantitativeValue",
            "value": val,
            "unitText": "YEAR"
          }
        };
      }
    }

    const jobPostingJsonLd = {
      "@context": "https://schema.org/",
      "@type": "JobPosting",
      "title": job.title,
      "description": escapeHtml(job.excerpt || job.title),
      "identifier": {
        "@type": "PropertyValue",
        "name": job.company_name,
        "value": String(job.id)
      },
      "datePosted": postedDate,
      "validThrough": validThroughDate,
      "employmentType": "FULL_TIME",
      "hiringOrganization": {
        "@type": "Organization",
        "name": job.company_name,
        "sameAs": SITE_URL,
        "logo": job.company_logo || `${SITE_URL}/og-image.png`
      },
      "jobLocationType": "TELECOMMUTE",
      "applicantLocationRequirements": {
        "@type": "Country",
        "name": job.country || "Worldwide"
      },
      ...(baseSalarySchema ? { "baseSalary": baseSalarySchema } : {}),
      "directApply": true
    };

    const shortTitle = formatSeoTitle(job.title, job.company_name);
    const jobDescription = `Apply for ${escapeHtml(job.title)} at ${escapeHtml(job.company_name)}. Remote opportunity (${escapeHtml(job.location || 'Worldwide')}). Salary: ${escapeHtml(job.salary_range || 'Competitive')}. Explore verified remote tech roles on GlobalHire AI.`;

    const prerenderedBody = `
      <div id="root">
        <main class="min-h-screen bg-[#ECEEE9] text-[#17261F] p-4 sm:p-8">
          <div class="max-w-4xl mx-auto bg-white rounded-3xl p-6 sm:p-10 border border-black/[0.08] shadow-sm">
            <nav class="text-xs text-[#6C7A72] mb-6 flex items-center gap-2">
              <a href="/" class="hover:underline font-bold text-[#0A241B]">GlobalHire AI</a>
              <span>/</span>
              <span>Jobs</span>
              <span>/</span>
              <span class="text-[#17261F] font-semibold">${escapeHtml(job.title)}</span>
            </nav>

            <header class="border-b border-black/[0.06] pb-6 mb-6">
              <div class="flex items-center gap-2 mb-2">
                <span class="px-2.5 py-1 rounded-full bg-[#E3F9ED] text-[#0A5734] font-bold text-xs">
                  ${escapeHtml(job.category || 'Remote Tech')}
                </span>
                <span class="px-2.5 py-1 rounded-full bg-slate-100 text-[#57685E] font-medium text-xs">
                  ${escapeHtml(job.job_type || 'Remote')}
                </span>
                ${job.salary_range ? `<span class="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 font-bold text-xs">${escapeHtml(job.salary_range)}</span>` : ''}
              </div>

              <h1 class="text-2xl sm:text-3xl font-black text-[#17261F]">${escapeHtml(job.title)}</h1>
              <p class="text-base font-bold text-[#57685E] mt-1 flex flex-wrap items-center gap-2">
                <span>${escapeHtml(job.company_name)}</span>
                <span>•</span>
                <span class="text-[#0A5734]">${escapeHtml(job.location || 'Worldwide Remote')}</span>
                <span>•</span>
                <a href="${escapeHtml(job.apply_url)}" target="_blank" rel="noopener noreferrer" class="text-xs text-[#0A5734] underline font-mono">
                  via ${escapeHtml(job.source_api || 'Remotive')} ↗
                </a>
              </p>

              <div class="mt-6 flex flex-wrap items-center gap-3">
                <a href="${escapeHtml(job.apply_url)}" target="_blank" rel="noopener noreferrer" class="px-6 py-3 rounded-2xl bg-[#00DF81] text-[#0A241B] font-extrabold text-xs sm:text-sm hover:bg-[#2EF8A0] transition-all shadow-md">
                  Apply on ${escapeHtml(job.source_api || 'Official Board')} →
                </a>
                <a href="/" class="px-5 py-3 rounded-2xl bg-[#F4F6F2] text-[#17261F] font-bold text-xs sm:text-sm hover:bg-slate-200 transition-all">
                  ← Back to All Remote Jobs
                </a>
              </div>
            </header>

            <article class="prose max-w-none text-sm text-[#3D4D43] leading-relaxed whitespace-pre-wrap">
              ${escapeHtml(job.excerpt || 'Verified worldwide remote opportunity aggregated by GlobalHire AI.')}
            </article>
          </div>
        </main>
      </div>
    `;

    let jobHtml = templateHtml
      .replace(/<title>.*?<\/title>/i, `<title>${shortTitle}</title>`)
      .replace(
        /<meta name="description" content=".*?" \/>/i,
        `<meta name="description" content="${jobDescription}" />`
      )
      .replace(
        /<link rel="canonical" href=".*?" \/>/i,
        `<link rel="canonical" href="${jobUrl}" />`
      )
      .replace(
        /<meta property="og:title" content=".*?" \/>/i,
        `<meta property="og:title" content="${shortTitle}" />`
      )
      .replace(
        /<meta property="og:description" content=".*?" \/>/i,
        `<meta property="og:description" content="${jobDescription}" />`
      )
      .replace(
        /<meta name="twitter:title" content=".*?" \/>/i,
        `<meta name="twitter:title" content="${shortTitle}" />`
      )
      .replace(
        /<meta name="twitter:description" content=".*?" \/>/i,
        `<meta name="twitter:description" content="${jobDescription}" />`
      )
      .replace(
        /<meta property="og:url" content=".*?" \/>/i,
        `<meta property="og:url" content="${jobUrl}" />`
      )
      .replace(
        /<div id="root"><\/div>/i,
        prerenderedBody + `\n<script type="application/ld+json">${JSON.stringify(jobPostingJsonLd)}</script>`
      );

    fs.writeFileSync(path.join(jobPageDir, 'index.html'), jobHtml, 'utf8');
  }

  // 3. Prerender initial jobs in homepage `dist/index.html` for Googlebot
  if (jobs.length > 0) {
    const initialCardsHtml = `
      <div id="root">
        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <header class="text-center max-w-3xl mx-auto mb-10">
            <h1 class="text-3xl sm:text-5xl font-black text-[#17261F] tracking-tight">Find Remote Jobs You Can Do From Anywhere</h1>
            <p class="text-sm sm:text-base text-[#57685E] mt-3">Explore ${jobs.length} worldwide remote jobs across tech, design, marketing, and support. Curated from trusted job boards with transparent salaries.</p>
          </header>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${jobs.slice(0, 18).map(j => `
              <article class="bg-white p-6 rounded-3xl border border-black/[0.06] shadow-sm flex flex-col justify-between">
                <div>
                  <div class="text-[11px] font-bold text-[#0A5734] uppercase tracking-wider mb-1">${escapeHtml(j.category || 'Tech')}</div>
                  <h2 class="text-base font-bold text-[#17261F]">
                    <a href="/jobs/${slugify(j.title)}-${slugify(j.company_name)}-${j.id}" class="hover:underline">${escapeHtml(j.title)}</a>
                  </h2>
                  <p class="text-xs font-semibold text-[#57685E] mt-1 flex flex-wrap items-center gap-1">
                    <span>${escapeHtml(j.company_name)}</span>
                    <span>•</span>
                    <span>${escapeHtml(j.location || 'Remote')}</span>
                    <span>•</span>
                    <a href="${escapeHtml(j.apply_url)}" target="_blank" rel="noopener noreferrer" class="text-[#0A5734] hover:underline font-mono text-[11px]">
                      via ${escapeHtml(j.source_api || 'Remotive')}
                    </a>
                  </p>
                  <p class="text-xs text-[#6C7A72] mt-2 line-clamp-2">${escapeHtml(j.excerpt || '')}</p>
                </div>
                <div class="mt-4 pt-3 border-t border-black/[0.05] flex items-center justify-between text-xs">
                  <span class="font-bold text-[#0A241B]">${escapeHtml(j.salary_range || 'Competitive')}</span>
                  <a href="/jobs/${slugify(j.title)}-${slugify(j.company_name)}-${j.id}" class="font-bold text-[#0A5734] hover:underline">View Role →</a>
                </div>
              </article>
            `).join('')}
          </div>
        </main>
      </div>
    `;

    const initialJobListingsJsonLd = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "itemListElement": jobs.slice(0, 20).map((j, idx) => ({
        "@type": "ListItem",
        "position": idx + 1,
        "url": `${SITE_URL}/jobs/${slugify(j.title)}-${slugify(j.company_name)}-${j.id}`,
        "name": `${j.title} at ${j.company_name}`
      }))
    };

    let updatedHomeHtml = templateHtml
      .replace(
        /<meta name="description" content=".*?" \/>/i,
        `<meta name="description" content="Find remote jobs you can do from anywhere. Explore ${jobs.length} active worldwide remote jobs across tech, design, and marketing. Curated from trusted job boards with transparent salaries." />`
      )
      .replace(
        /<meta property="og:description" content=".*?" \/>/i,
        `<meta property="og:description" content="Find remote jobs you can do from anywhere. Explore ${jobs.length} active worldwide remote jobs across tech, design, and marketing. Curated from trusted job boards with transparent salaries." />`
      )
      .replace(
        /<meta name="twitter:description" content=".*?" \/>/i,
        `<meta name="twitter:description" content="Find remote jobs you can do from anywhere. Explore ${jobs.length} active worldwide remote jobs across tech, design, and marketing. Curated from trusted job boards with transparent salaries." />`
      )
      .replace(
        /<div id="root"><\/div>/i,
        initialCardsHtml + `\n<script type="application/ld+json">${JSON.stringify(initialJobListingsJsonLd)}</script>`
      );
    fs.writeFileSync(path.join(DIST_DIR, 'index.html'), updatedHomeHtml, 'utf8');
    console.log('✓ Injected initial server-rendered job listings into dist/index.html');
  }

  // 4. Generate dynamic /sitemap.xml
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;
  fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), sitemapXml, 'utf8');
  if (fs.existsSync(PUBLIC_DIR)) {
    fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap.xml'), sitemapXml, 'utf8');
  }
  console.log(`✓ Generated sitemap.xml with ${sitemapUrls.length} verified URLs.`);

  // 5. Generate /robots.txt
  const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;
  fs.writeFileSync(path.join(DIST_DIR, 'robots.txt'), robotsTxt, 'utf8');
  if (fs.existsSync(PUBLIC_DIR)) {
    fs.writeFileSync(path.join(PUBLIC_DIR, 'robots.txt'), robotsTxt, 'utf8');
  }
  console.log('✓ Generated robots.txt pointing to sitemap.xml.');

  console.log('🎉 Static SEO prerendering completed successfully!');
}

run().catch(err => {
  console.error('Prerender error:', err);
  process.exit(1);
});
