// Dynamic Sitemap Generator for GlobalHire AI (Vercel Serverless Function)
// Dynamically fetches all live jobs from backend and returns XML sitemap with 1-hour CDN caching

export default async function handler(req, res) {
  const BACKEND_URL = process.env.VITE_API_URL || 'http://150.136.214.192';
  const SITE_URL = 'https://globalhireai.vercel.app';

  function slugify(text) {
    return String(text || '')
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 80);
  }

  function escapeXml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  let jobs = [];
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const response = await fetch(`${BACKEND_URL}/api/jobs?limit=500`, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeout);
    if (response.ok) {
      const data = await response.json();
      jobs = Array.isArray(data) ? data : (data.jobs || []);
    }
  } catch (err) {
    console.error('Error fetching jobs for dynamic sitemap:', err);
  }

  const staticUrls = [
    { loc: `${SITE_URL}/`, changefreq: 'daily', priority: '1.0' },
    { loc: `${SITE_URL}/about`, changefreq: 'monthly', priority: '0.8' },
    { loc: `${SITE_URL}/privacy`, changefreq: 'monthly', priority: '0.6' },
    { loc: `${SITE_URL}/terms`, changefreq: 'monthly', priority: '0.6' },
    { loc: `${SITE_URL}/contact`, changefreq: 'monthly', priority: '0.7' }
  ];

  const jobUrls = jobs.map(j => {
    const slug = `${slugify(j.title)}-${slugify(j.company_name)}-${j.id}`;
    return {
      loc: `${SITE_URL}/jobs/${slug}`,
      changefreq: 'weekly',
      priority: '0.9'
    };
  });

  const allUrls = [...staticUrls, ...jobUrls];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(u => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(xml);
}
