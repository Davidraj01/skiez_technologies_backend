import SiteSettings, { PAGE_KEYS } from "../models/SiteSettings.js";
import Blog from "../models/Blog.js";
import asyncHandler from "../middleware/asyncHandler.js";

// Static public routes of the website (path -> settings page key, if any)
const STATIC_ROUTES = [
  { path: "/", key: "home", priority: "1.0", changefreq: "weekly" },
  { path: "/services", key: "services", priority: "0.9", changefreq: "monthly" },
  { path: "/about", key: "about", priority: "0.8", changefreq: "monthly" },
  { path: "/contact", key: "contact", priority: "0.8", changefreq: "yearly" },
  { path: "/blogs", key: "blogs", priority: "0.8", changefreq: "weekly" },
  { path: "/gallery", key: "gallery", priority: "0.5", changefreq: "monthly" },
  { path: "/privacy", priority: "0.2", changefreq: "yearly" },
  { path: "/terms", priority: "0.2", changefreq: "yearly" },
];

// Bots used by AI assistants / AI search (GEO)
const AI_BOTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
  "Bytespider",
  "meta-externalagent",
];

const escapeXml = (s = "") =>
  String(s).replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]);

const baseUrl = (settings) => (settings.siteUrl || "").replace(/\/+$/, "");

// ---------- Settings ----------

export const getPublicSettings = asyncHandler(async (req, res) => {
  const settings = await SiteSettings.getSingleton();
  res.set("Cache-Control", "public, max-age=300");
  res.json(settings);
});

export const getAdminSettings = asyncHandler(async (req, res) => {
  res.json(await SiteSettings.getSingleton());
});

export const updateSettings = asyncHandler(async (req, res) => {
  const settings = await SiteSettings.getSingleton();
  const body = req.body || {};
  const str = (v) => (typeof v === "string" ? v.trim() : undefined);
  const list = (v) =>
    Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean) : undefined;

  if (str(body.siteUrl) !== undefined) {
    const url = str(body.siteUrl).replace(/\/+$/, "");
    if (url && !/^https?:\/\/[^\s/]+\.[^\s]+$/i.test(url)) {
      return res.status(400).json({ message: "Website address must look like https://www.example.com" });
    }
    settings.siteUrl = url;
  }
  if (str(body.siteName) !== undefined) settings.siteName = str(body.siteName);
  if (str(body.defaultOgImage) !== undefined) settings.defaultOgImage = str(body.defaultOgImage);
  if (str(body.llmsIntro) !== undefined) settings.llmsIntro = str(body.llmsIntro);
  if (typeof body.allowAiCrawlers === "boolean") settings.allowAiCrawlers = body.allowAiCrawlers;

  if (body.business && typeof body.business === "object") {
    const b = body.business;
    for (const f of [
      "legalName", "description", "founder", "foundingYear", "phone", "email",
      "streetAddress", "city", "region", "postalCode", "country", "areaServed",
    ]) {
      if (str(b[f]) !== undefined) settings.business[f] = str(b[f]);
    }
    if (list(b.services)) settings.business.services = list(b.services);
    if (list(b.sameAs)) settings.business.sameAs = list(b.sameAs);
  }

  if (body.pages && typeof body.pages === "object") {
    for (const key of PAGE_KEYS) {
      const p = body.pages[key];
      if (!p) continue;
      for (const f of ["title", "description", "keywords"]) {
        if (str(p[f]) !== undefined) settings.pages[key][f] = str(p[f]);
      }
    }
  }

  await settings.save();
  res.json(settings);
});

// ---------- Crawler files ----------

export const sitemapXml = asyncHandler(async (req, res) => {
  const settings = await SiteSettings.getSingleton();
  const base = baseUrl(settings);
  if (!base) return res.status(503).type("text/plain").send("Set the website address in Admin → SEO first.");

  const blogs = await Blog.find({ published: true, "seo.noindex": { $ne: true } })
    .select("slug updatedAt")
    .sort({ updatedAt: -1 });

  const urls = [
    ...STATIC_ROUTES.map((r) => ({ loc: base + r.path, changefreq: r.changefreq, priority: r.priority })),
    ...blogs.map((b) => ({
      loc: `${base}/blogs/${b.slug}`,
      lastmod: b.updatedAt.toISOString().slice(0, 10),
      changefreq: "monthly",
      priority: "0.7",
    })),
  ];

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls
      .map(
        (u) =>
          `  <url><loc>${escapeXml(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}` +
          `<changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`
      )
      .join("\n") +
    "\n</urlset>\n";

  res.set("Cache-Control", "public, max-age=3600").type("application/xml").send(xml);
});

export const robotsTxt = asyncHandler(async (req, res) => {
  const settings = await SiteSettings.getSingleton();
  const base = baseUrl(settings);
  const lines = ["User-agent: *", "Allow: /", "Disallow: /admin", ""];

  if (!settings.allowAiCrawlers) {
    for (const bot of AI_BOTS) lines.push(`User-agent: ${bot}`, "Disallow: /", "");
  }
  if (base) lines.push(`Sitemap: ${base}/sitemap.xml`);

  res.set("Cache-Control", "public, max-age=3600").type("text/plain").send(lines.join("\n") + "\n");
});

// llms.txt — a plain-Markdown summary of the site for AI assistants (https://llmstxt.org)
export const llmsTxt = asyncHandler(async (req, res) => {
  const settings = await SiteSettings.getSingleton();
  const base = baseUrl(settings);
  const b = settings.business;
  const link = (path) => (base ? base + path : path);

  const blogs = await Blog.find({ published: true, "seo.noindex": { $ne: true } })
    .select("title slug excerpt seo.metaDescription")
    .sort({ createdAt: -1 })
    .limit(50);

  const address = [b.streetAddress, b.city, b.region, b.postalCode, b.country === "IN" ? "India" : b.country]
    .filter(Boolean)
    .join(", ");

  const out = [
    `# ${settings.siteName}`,
    "",
    `> ${settings.llmsIntro}`,
    "",
    "## Key facts",
    `- Legal name: ${b.legalName}`,
    b.foundingYear && `- Founded: ${b.foundingYear}${b.founder ? ` by ${b.founder}` : ""}`,
    address && `- Location: ${address}`,
    b.areaServed && `- Serves: ${b.areaServed}`,
    b.phone && `- Phone: ${b.phone}`,
    b.email && `- Email: ${b.email}`,
    b.services?.length && `- Services: ${b.services.join(", ")}`,
    "",
    "## Pages",
    ...STATIC_ROUTES.filter((r) => r.key).map((r) => {
      const p = settings.pages[r.key];
      return `- [${p.title || r.path}](${link(r.path)}): ${p.description}`;
    }),
    "",
  ];

  if (blogs.length) {
    out.push("## Blog");
    for (const post of blogs) {
      out.push(`- [${post.title}](${link(`/blogs/${post.slug}`)}): ${post.seo?.metaDescription || post.excerpt}`);
    }
    out.push("");
  }

  if (b.sameAs?.length) {
    out.push("## Official profiles", ...b.sameAs.map((u) => `- ${u}`), "");
  }

  res
    .set("Cache-Control", "public, max-age=3600")
    .type("text/plain; charset=utf-8")
    .send(out.filter((l) => l !== false && l !== undefined && l !== 0).join("\n"));
});
