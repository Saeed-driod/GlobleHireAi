// Static Prerender & SEO Generator for GlobalHire AI
// Runs after `vite build` to generate static HTML for jobs, categories, legal pages, spa.html fallback, and robots.txt
// Live sitemap.xml is dynamically served via Vercel rewrite -> backend /api/sitemap

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

function stripHtmlClean(str) {
  if (!str) return '';
  return String(str)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const VALID_COUNTRY_MAP = {
  'us': 'United States',
  'usa': 'United States',
  'united states': 'United States',
  'uk': 'United Kingdom',
  'united kingdom': 'United Kingdom',
  'canada': 'Canada',
  'germany': 'Germany',
  'ireland': 'Ireland',
  'australia': 'Australia',
  'india': 'India',
  'pakistan': 'Pakistan',
  'france': 'France',
  'netherlands': 'Netherlands',
  'spain': 'Spain',
  'sweden': 'Sweden',
  'italy': 'Italy',
  'brazil': 'Brazil',
  'poland': 'Poland',
  'portugal': 'Portugal',
  'singapore': 'Singapore',
  'uae': 'United Arab Emirates',
  'united arab emirates': 'United Arab Emirates'
};

function resolveValidCountry(locStr) {
  const clean = String(locStr || '').trim().toLowerCase();
  if (!clean) return null;
  return VALID_COUNTRY_MAP[clean] || null;
}

function formatSeoTitle(jobTitle, companyName) {
  const cleanTitle = (jobTitle || 'Remote Role').trim();
  const cleanCompany = (companyName || 'Company').trim();
  const brand = 'GlobalHire AI';

  const full = `${cleanTitle} at ${cleanCompany} | ${brand}`;
  if (full.length <= 60) return full;

  const mid = `${cleanTitle} at ${cleanCompany}`;
  if (mid.length <= 60) return mid;

  const maxTitleLen = Math.max(20, 56 - cleanCompany.length);
  return `${cleanTitle.slice(0, maxTitleLen).trim()}... at ${cleanCompany}`;
}

function replaceMetaAndCanonical(html, { title, description, url, image }) {
  const safeTitle = escapeHtml(title);
  const safeDesc = escapeHtml(description);
  const safeUrl = escapeHtml(url);
  const safeImg = escapeHtml(image || `${SITE_URL}/og-image.png`);

  return html
    .replace(/<title>.*?<\/title>/i, `<title>${safeTitle}</title>`)
    .replace(/<meta name="description" content=".*?" \/>/i, `<meta name="description" content="${safeDesc}" />`)
    .replace(/<link rel="canonical" href=".*?" \/>/i, `<link rel="canonical" href="${safeUrl}" />`)
    .replace(/<meta property="og:title" content=".*?" \/>/i, `<meta property="og:title" content="${safeTitle}" />`)
    .replace(/<meta property="og:description" content=".*?" \/>/i, `<meta property="og:description" content="${safeDesc}" />`)
    .replace(/<meta property="og:url" content=".*?" \/>/i, `<meta property="og:url" content="${safeUrl}" />`)
    .replace(/<meta property="og:image" content=".*?" \/>/i, `<meta property="og:image" content="${safeImg}" />`)
    .replace(/<meta name="twitter:title" content=".*?" \/>/i, `<meta name="twitter:title" content="${safeTitle}" />`)
    .replace(/<meta name="twitter:description" content=".*?" \/>/i, `<meta name="twitter:description" content="${safeDesc}" />`)
    .replace(/<meta name="twitter:image" content=".*?" \/>/i, `<meta name="twitter:image" content="${safeImg}" />`);
}

const CATEGORY_PAGES = [
  {
    slug: 'remote-software-dev-jobs',
    category: 'Software Dev',
    title: 'Remote Software Developer Jobs Worldwide | GlobalHire AI',
    description: 'Browse verified remote software engineering, frontend, backend, and full-stack developer jobs you can work from anywhere.',
    intro: 'Explore curated remote software engineering opportunities across Python, TypeScript, React, Go, Java, and backend architecture from trusted global teams.'
  },
  {
    slug: 'remote-ai-data-jobs',
    category: 'AI / Data',
    title: 'Remote AI, Machine Learning & Data Jobs | GlobalHire AI',
    description: 'Discover worldwide remote AI engineer, machine learning, data scientist, and analytics roles with transparent hiring.',
    intro: 'Find verified remote careers in artificial intelligence, LLM engineering, data pipelines, and quantitative data science hiring globally.'
  },
  {
    slug: 'remote-devops-cloud-jobs',
    category: 'DevOps / Cloud',
    title: 'Remote DevOps, SRE & Cloud Jobs Worldwide | GlobalHire AI',
    description: 'Apply to remote DevOps, Site Reliability Engineering (SRE), Kubernetes, and Cloud security openings worldwide.',
    intro: 'Explore remote cloud architecture, Kubernetes, AWS/GCP infrastructure, platform engineering, and security operations roles.'
  },
  {
    slug: 'remote-design-jobs',
    category: 'Design',
    title: 'Remote UI/UX & Product Design Jobs | GlobalHire AI',
    description: 'Curated remote UI/UX designer, product design, brand design, and creative tech openings from remote-first companies.',
    intro: 'Browse verified work-from-anywhere roles for product designers, UX researchers, design systems specialists, and visual artists.'
  },
  {
    slug: 'remote-marketing-jobs',
    category: 'Marketing',
    title: 'Remote Digital Marketing & Growth Jobs | GlobalHire AI',
    description: 'Find remote SEO, performance marketing, content strategy, and product marketing jobs from global SaaS companies.',
    intro: 'Discover remote marketing, SEO growth, paid acquisition, and content creation roles with global remote teams.'
  },
  {
    slug: 'remote-customer-support-jobs',
    category: 'Customer Support',
    title: 'Remote Customer Support & Success Jobs | GlobalHire AI',
    description: 'Work-from-anywhere customer support, technical support, and customer success specialist jobs worldwide.',
    intro: 'Explore vetted remote customer success, technical helpdesk, and client onboarding careers across global timezones.'
  },
  {
    slug: 'remote-management-jobs',
    category: 'Management',
    title: 'Remote Product & Project Management Jobs | GlobalHire AI',
    description: 'Worldwide remote product manager, technical program manager, and operations leadership vacancies.',
    intro: 'Browse remote product management, agile delivery, localization leadership, and engineering management roles.'
  }
];

const LEGAL_PAGES = [
  {
    slug: 'about',
    title: 'About Us — GlobalHire AI Remote Tech Jobs Radar',
    description: 'Learn how GlobalHire AI aggregates verified worldwide remote tech, design, and support jobs from trusted job boards.',
    heading: 'About GlobalHire AI',
    body: `<p>GlobalHire AI is a worldwide remote career radar designed to help software engineers, designers, marketers, and support professionals discover verified work-from-anywhere jobs without spam.</p><p>We aggregate, normalize, and verify open positions from trusted global job boards including Remotive, Jobicy, Arbeitnow, and Himalayas—enabling direct applications on official employer boards.</p>`
  },
  {
    slug: 'contact',
    title: 'Contact & Support — GlobalHire AI',
    description: 'Contact GlobalHire AI support team for job posting inquiries, partnerships, or feedback.',
    heading: 'Contact & Support',
    body: `<p>Have questions, feedback, or want to feature an authentic remote job opening on GlobalHire AI?</p><p>Email: <a href="mailto:support@globalhireai.vercel.app" class="text-[#0A5734] underline">support@globalhireai.vercel.app</a></p><p>Operations: 100% Remote Worldwide</p>`
  },
  {
    slug: 'privacy',
    title: 'Privacy Policy — GlobalHire AI',
    description: 'Read GlobalHire AI privacy policy covering candidate job alert profiles, cookies, and third-party application links.',
    heading: 'Privacy Policy',
    body: `<p><strong>Information We Collect:</strong> When you subscribe for personalized CV job match alerts, we collect only your provided contact information, skills, and degree category. We never sell personal candidate data.</p><p><strong>Direct Application Links:</strong> Clicking Apply routes you directly to the verified source board or employer ATS. Browser bookmarks and dark mode settings remain in local storage on your device.</p>`
  },
  {
    slug: 'terms',
    title: 'Terms of Service — GlobalHire AI',
    description: 'Review GlobalHire AI terms of service for using our remote job listings and alerts platform.',
    heading: 'Terms of Service',
    body: `<p><strong>Platform Purpose:</strong> GlobalHire AI is an informational remote job discovery platform. We never charge job seekers application fees.</p><p><strong>Listing Accuracy:</strong> Compensation, location eligibility, and hiring status are governed by each respective employer and source board.</p>`
  }
];

async function run() {
  console.log('🚀 Starting Enhanced SEO Prerendering...');

  if (!fs.existsSync(DIST_DIR)) {
    console.error('Error: dist folder does not exist. Run vite build first.');
    process.exit(1);
  }

  const templateHtml = fs.readFileSync(path.join(DIST_DIR, 'index.html'), 'utf8');

  // 1. Save clean SPA fallback (`dist/spa.html`) WITHOUT hardcoded homepage canonical
  //    so non-prerendered `/jobs/...` pages don't tell Googlebot canonical=/ before React Helmet runs!
  const spaFallbackHtml = templateHtml
    .replace(/<link rel="canonical" href=".*?" \/>\s*/i, '');
  fs.writeFileSync(path.join(DIST_DIR, 'spa.html'), spaFallbackHtml, 'utf8');
  console.log('✓ Created clean SPA fallback dist/spa.html (no conflicting root canonical).');

  // 2. Fetch up to 600 live remote jobs WITH full descriptions in resilient 25-job batches
  async function fetchJsonWithRetry(url, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const res = await fetch(url, {
          headers: { 'Accept': 'application/json', 'Accept-Encoding': 'gzip, deflate' },
          signal: AbortSignal.timeout(20000)
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
      } catch (err) {
        if (attempt === retries) throw err;
        await new Promise(r => setTimeout(r, 800 * attempt));
      }
    }
  }

  let jobs = [];
  try {
    for (let page = 1; page <= 24; page++) {
      const data = await fetchJsonWithRetry(`${API_BASE}/api/jobs?page=${page}&limit=25&include_full_description=true`);
      const pageJobs = data.jobs || [];
      if (pageJobs.length === 0) break;
      jobs.push(...pageJobs);
      if (pageJobs.length < 25) break;
    }
    console.log(`✓ Fetched ${jobs.length} remote jobs with full descriptions for static prerender.`);
  } catch (err) {
    console.warn(`Warning: Partial/failed job fetch after ${jobs.length} jobs:`, err.message);
  }

  // 3. Prerender each individual job page at /jobs/[slug]/index.html with FULL description & valid JobPosting schema
  const jobsDir = path.join(DIST_DIR, 'jobs');
  if (!fs.existsSync(jobsDir)) fs.mkdirSync(jobsDir, { recursive: true });

  for (const job of jobs) {
    const slug = `${slugify(job.title)}-${slugify(job.company_name)}-${job.id}`;
    const jobPageDir = path.join(jobsDir, slug);
    if (!fs.existsSync(jobPageDir)) fs.mkdirSync(jobPageDir, { recursive: true });

    const jobUrl = `${SITE_URL}/jobs/${slug}`;
    const postedDate = job.posted_at ? new Date(job.posted_at).toISOString() : new Date().toISOString();
    const validThroughDate = new Date(Date.now() + 45 * 86400000).toISOString();
    const fullPlainDesc = stripHtmlClean(job.description || job.excerpt || job.title);
    const validCountry = resolveValidCountry(job.country) || resolveValidCountry(job.location);

    let baseSalarySchema = undefined;
    if (job.salary_range && job.salary_range !== 'Competitive') {
      const nums = job.salary_range.match(/\d[\d,.]*/g);
      if (nums && nums.length > 0) {
        const val = parseFloat(nums[0].replace(/,/g, '')) * (job.salary_range.toLowerCase().includes('k') ? 1000 : 1);
        if (!Number.isNaN(val) && val > 0) {
          baseSalarySchema = {
            "@type": "MonetaryAmount",
            "currency": "USD",
            "value": { "@type": "QuantitativeValue", "value": val, "unitText": "YEAR" }
          };
        }
      }
    }

    const jobPostingJsonLd = {
      "@context": "https://schema.org/",
      "@type": "JobPosting",
      "title": job.title,
      "description": fullPlainDesc || job.title,
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
        "logo": job.company_logo || `${SITE_URL}/og-image.png`
      },
      "jobLocationType": "TELECOMMUTE",
      ...(validCountry ? { "applicantLocationRequirements": { "@type": "Country", "name": validCountry } } : {}),
      ...(baseSalarySchema ? { "baseSalary": baseSalarySchema } : {}),
      "directApply": false
    };

    const shortTitle = formatSeoTitle(job.title, job.company_name);
    const metaDesc = `${job.title} at ${job.company_name} (${job.location || 'Worldwide Remote'}). ${fullPlainDesc.slice(0, 110)}...`.slice(0, 158);
    const paragraphsHtml = fullPlainDesc
      .split(/\n{2,}|\n/)
      .filter(p => p.trim().length > 0)
      .map(p => `<p class="mb-3">${escapeHtml(p.trim())}</p>`)
      .join('');

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
                <span class="px-2.5 py-1 rounded-full bg-[#E3F9ED] text-[#0A5734] font-bold text-xs">${escapeHtml(job.category || 'Remote Tech')}</span>
                <span class="px-2.5 py-1 rounded-full bg-slate-100 text-[#57685E] font-medium text-xs">${escapeHtml(job.job_type || 'Remote')}</span>
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
                <a href="${escapeHtml(job.apply_url)}" target="_blank" rel="noopener noreferrer" class="px-6 py-3 rounded-2xl bg-[#00DF81] text-[#0A241B] font-extrabold text-xs sm:text-sm">
                  Apply on ${escapeHtml(job.source_api || 'Official Board')} →
                </a>
                <a href="/" class="px-5 py-3 rounded-2xl bg-[#F4F6F2] text-[#17261F] font-bold text-xs sm:text-sm">
                  ← Back to All Remote Jobs
                </a>
              </div>
            </header>
            <article class="prose max-w-none text-sm text-[#3D4D43] leading-relaxed">
              ${paragraphsHtml}
            </article>
          </div>
        </main>
      </div>
    `;

    let jobHtml = replaceMetaAndCanonical(templateHtml, {
      title: shortTitle,
      description: metaDesc,
      url: jobUrl,
      image: job.company_logo || `${SITE_URL}/og-image.png`
    }).replace(
      /<div id="root"><\/div>/i,
      prerenderedBody + `\n<script type="application/ld+json">${JSON.stringify(jobPostingJsonLd)}</script>`
    );

    fs.writeFileSync(path.join(jobPageDir, 'index.html'), jobHtml, 'utf8');
  }
  console.log(`✓ Prerendered ${jobs.length} individual job pages with full descriptions & valid Google Jobs schema.`);

  // 4. Prerender 7 SEO Category Landing Pages
  for (const catPage of CATEGORY_PAGES) {
    const catDir = path.join(DIST_DIR, catPage.slug);
    if (!fs.existsSync(catDir)) fs.mkdirSync(catDir, { recursive: true });

    const catJobs = jobs.filter(j => (j.category || '').toLowerCase() === catPage.category.toLowerCase()).slice(0, 24);
    const catUrl = `${SITE_URL}/${catPage.slug}`;
    const catJsonLd = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": catPage.title,
      "itemListElement": catJobs.map((j, idx) => ({
        "@type": "ListItem",
        "position": idx + 1,
        "url": `${SITE_URL}/jobs/${slugify(j.title)}-${slugify(j.company_name)}-${j.id}`,
        "name": `${j.title} at ${j.company_name}`
      }))
    };

    const catBody = `
      <div id="root">
        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <nav class="text-xs text-[#6C7A72] mb-4"><a href="/" class="font-bold text-[#0A241B] hover:underline">Home</a> / <span>${escapeHtml(catPage.category)}</span></nav>
          <header class="max-w-3xl mb-10">
            <h1 class="text-3xl sm:text-4xl font-black text-[#17261F]">${escapeHtml(catPage.category)} Remote Jobs</h1>
            <p class="text-sm sm:text-base text-[#57685E] mt-2">${escapeHtml(catPage.intro)}</p>
          </header>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${catJobs.map(j => `
              <article class="bg-white p-6 rounded-3xl border border-black/[0.06] shadow-sm">
                <h2 class="text-base font-bold text-[#17261F]">
                  <a href="/jobs/${slugify(j.title)}-${slugify(j.company_name)}-${j.id}" class="hover:underline">${escapeHtml(j.title)}</a>
                </h2>
                <p class="text-xs font-semibold text-[#57685E] mt-1">${escapeHtml(j.company_name)} • ${escapeHtml(j.location || 'Remote')}</p>
                <p class="text-xs text-[#6C7A72] mt-2 line-clamp-2">${escapeHtml(j.excerpt || '')}</p>
              </article>
            `).join('')}
          </div>
        </main>
      </div>
    `;

    const catHtml = replaceMetaAndCanonical(templateHtml, {
      title: catPage.title,
      description: catPage.description,
      url: catUrl
    }).replace(
      /<div id="root"><\/div>/i,
      catBody + `\n<script type="application/ld+json">${JSON.stringify(catJsonLd)}</script>`
    );

    fs.writeFileSync(path.join(catDir, 'index.html'), catHtml, 'utf8');
  }
  console.log(`✓ Prerendered ${CATEGORY_PAGES.length} SEO category landing pages.`);

  // 5. Prerender Legal Pages (/about, /contact, /privacy, /terms) with dedicated canonicals
  for (const page of LEGAL_PAGES) {
    const dir = path.join(DIST_DIR, page.slug);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const pageUrl = `${SITE_URL}/${page.slug}`;
    const body = `
      <div id="root">
        <main class="max-w-3xl mx-auto px-4 py-12">
          <nav class="text-xs text-[#6C7A72] mb-6"><a href="/" class="font-bold text-[#0A241B] hover:underline">← Back to GlobalHire AI Jobs</a></nav>
          <article class="bg-white p-8 rounded-3xl border border-black/[0.08] space-y-4">
            <h1 class="text-3xl font-black text-[#17261F]">${escapeHtml(page.heading)}</h1>
            <div class="text-sm text-[#3D4D43] space-y-3 leading-relaxed">${page.body}</div>
          </article>
        </main>
      </div>
    `;
    const html = replaceMetaAndCanonical(templateHtml, {
      title: page.title,
      description: page.description,
      url: pageUrl
    }).replace(/<div id="root"><\/div>/i, body);
    fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');
  }
  console.log(`✓ Prerendered ${LEGAL_PAGES.length} legal & trust pages with unique canonicals.`);

  // 6. Prerender homepage `dist/index.html` with category links + initial jobs
  if (jobs.length > 0) {
    const categoryLinksHtml = CATEGORY_PAGES.map(
      c => `<a href="/${c.slug}" class="px-3 py-1 rounded-full bg-white text-xs font-semibold text-[#0A5734] border border-black/10">${escapeHtml(c.category)}</a>`
    ).join(' ');

    const initialCardsHtml = `
      <div id="root">
        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <header class="text-center max-w-3xl mx-auto mb-10">
            <h1 class="text-3xl sm:text-5xl font-black text-[#17261F] tracking-tight">Find Remote Jobs You Can Do From Anywhere</h1>
            <p class="text-sm sm:text-base text-[#57685E] mt-3">Explore worldwide remote jobs across tech, design, marketing, and support. Curated from trusted job boards with transparent salaries.</p>
            <nav aria-label="Categories" class="flex flex-wrap justify-center gap-2 mt-4">${categoryLinksHtml}</nav>
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
          <footer class="mt-12 text-center text-xs text-[#6C7A72]">
            <a href="/about">About Us</a> • <a href="/contact">Contact</a> • <a href="/privacy">Privacy Policy</a> • <a href="/terms">Terms</a>
          </footer>
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

    const updatedHomeHtml = templateHtml.replace(
      /<div id="root"><\/div>/i,
      initialCardsHtml + `\n<script type="application/ld+json">${JSON.stringify(initialJobListingsJsonLd)}</script>`
    );
    fs.writeFileSync(path.join(DIST_DIR, 'index.html'), updatedHomeHtml, 'utf8');
    console.log('✓ Injected homepage SSR listings, category links, and legal links into dist/index.html.');
  }

  // 7. Ensure static sitemap.xml is NOT placed in dist/ or public/ so Vercel rewrite -> live backend /api/sitemap always runs!
  for (const stalePath of [path.join(DIST_DIR, 'sitemap.xml'), path.join(PUBLIC_DIR, 'sitemap.xml')]) {
    if (fs.existsSync(stalePath)) {
      fs.unlinkSync(stalePath);
      console.log(`✓ Removed static ${stalePath} so dynamic live /api/sitemap takes effect.`);
    }
  }

  // 8. Generate /robots.txt
  const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;
  fs.writeFileSync(path.join(DIST_DIR, 'robots.txt'), robotsTxt, 'utf8');
  if (fs.existsSync(PUBLIC_DIR)) {
    fs.writeFileSync(path.join(PUBLIC_DIR, 'robots.txt'), robotsTxt, 'utf8');
  }
  console.log('✓ Generated robots.txt pointing to live sitemap.xml.');
  console.log('🎉 Enhanced SEO prerendering completed successfully!');
}

run().catch(err => {
  console.error('Prerender error:', err);
  process.exit(1);
});
