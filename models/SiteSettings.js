import mongoose from "mongoose";

/**
 * Single document holding site-wide SEO / AEO / GEO settings, edited from the admin "SEO" tab.
 * Defaults mirror the website's existing content so the site is well-described out of the box.
 */
const pageSeoSchema = new mongoose.Schema(
  {
    title: { type: String, default: "", trim: true },
    description: { type: String, default: "", trim: true },
    keywords: { type: String, default: "", trim: true },
  },
  { _id: false }
);

export const PAGE_KEYS = ["home", "services", "about", "contact", "blogs", "gallery"];

const PAGE_DEFAULTS = {
  home: {
    title: "Skiez Technologies | Web & App Development in Chennai",
    description:
      "Skiez Technologies builds scalable websites, mobile apps and database solutions for E-Commerce, Healthcare, Education, Real Estate and B2B businesses.",
    keywords: "web development, mobile app development, software company Chennai, MERN, Flutter, digital marketing",
  },
  services: {
    title: "Services: Web, Mobile, UI/UX & AI | Skiez Technologies",
    description:
      "Web development, mobile apps, UI/UX design, cloud solutions, AI & machine learning and data analytics from Skiez Technologies.",
    keywords: "web development services, mobile app development, UI UX design, cloud solutions, AI development",
  },
  about: {
    title: "About Skiez Technologies | IT Solutions Since 2013",
    description:
      "Founded in 2013 by Dr. S. Davidraj, Skiez Technologies builds custom IT solutions: full stack development, UI/UX design, mobile apps and digital marketing.",
    keywords: "about Skiez Technologies, IT company Chengalpattu, software company Tamil Nadu",
  },
  contact: {
    title: "Contact Skiez Technologies | Chengalpattu / Chennai",
    description:
      "Have a project in mind? Contact Skiez Technologies at +91 82200 43041 or info@skiezdigital.com. Chengalpattu / Chennai, Tamil Nadu, India.",
    keywords: "contact Skiez Technologies, software company near me, Chennai web developers",
  },
  blogs: {
    title: "Blog | Insights & Updates from Skiez Technologies",
    description:
      "Thoughts, updates and practical guides on web development, mobile apps and digital marketing from the Skiez Technologies team.",
    keywords: "tech blog, web development blog, Skiez Technologies blog",
  },
  gallery: {
    title: "Gallery | Life & Work at Skiez Technologies",
    description:
      "Moments, events and work from the Skiez Technologies team in Chengalpattu / Chennai, Tamil Nadu: our people, projects and culture.",
    keywords: "Skiez Technologies gallery",
  },
};

// Earlier default wording. Documents still holding these exact strings are upgraded to the
// new defaults on load; anything the admin has edited is left untouched.
const LEGACY_DEFAULTS = {
  home: {
    title: "Skiez Technologies | Web, Mobile App & Digital Solutions in Chennai",
    description:
      "Skiez Technologies India Pvt Ltd builds scalable full-stack web, mobile app and database solutions for E-Commerce, Healthcare, Education, Real Estate and B2B businesses.",
  },
  services: { title: "Services | Web, Mobile, UI/UX, Cloud & AI | Skiez Technologies" },
  about: {
    title: "About Skiez Technologies | Innovative Digital Solutions Since 2013",
    description:
      "Founded in 2013 by Dr. S. Davidraj, Skiez Technologies provides scalable custom IT solutions: full stack development, UI/UX design, mobile apps and digital marketing.",
  },
  blogs: { description: "Thoughts, updates and ideas from the Skiez Technologies team." },
  gallery: { title: "Gallery | Skiez Technologies", description: "Moments and work from Skiez Technologies." },
};

const siteSettingsSchema = new mongoose.Schema(
  {
    // Public website address, used for canonical URLs, sitemap.xml and llms.txt
    // Live domain (editable in Admin → SEO)
    siteUrl: { type: String, default: "https://www.skieztechnologies.org", trim: true },
    siteName: { type: String, default: "Skiez Technologies", trim: true },
    defaultOgImage: { type: String, default: "", trim: true }, // social share image

    // Who the business is — LocalBusiness / Organization structured data (GEO "entity")
    business: {
      legalName: { type: String, default: "Skiez Technologies India Pvt Ltd", trim: true },
      description: {
        type: String,
        default:
          "Skiez Technologies builds scalable tech-driven solutions across Full-Stack Development, Mobile App Frameworks and Database Management for E-Commerce, Healthcare, Education, Real Estate and B2B.",
        trim: true,
      },
      founder: { type: String, default: "Dr. S. Davidraj", trim: true },
      foundingYear: { type: String, default: "2013", trim: true },
      phone: { type: String, default: "+91 82200 43041", trim: true },
      email: { type: String, default: "info@skiezdigital.com", trim: true },
      streetAddress: { type: String, default: "", trim: true },
      city: { type: String, default: "Chengalpattu", trim: true },
      region: { type: String, default: "Tamil Nadu", trim: true },
      postalCode: { type: String, default: "", trim: true },
      country: { type: String, default: "IN", trim: true },
      areaServed: { type: String, default: "India", trim: true },
      services: {
        type: [String],
        default: [
          "Web Development",
          "Mobile App Development",
          "UI/UX Design",
          "Cloud Solutions",
          "AI & Machine Learning",
          "Data Analytics",
          "Digital Marketing",
        ],
      },
      sameAs: {
        type: [String],
        default: [
          "https://www.instagram.com/skiez_technology/",
          "https://www.facebook.com/profile.php?id=61585777885464",
          "https://www.linkedin.com/company/144174665/",
        ],
      },
    },

    pages: {
      home: { type: pageSeoSchema, default: () => PAGE_DEFAULTS.home },
      services: { type: pageSeoSchema, default: () => PAGE_DEFAULTS.services },
      about: { type: pageSeoSchema, default: () => PAGE_DEFAULTS.about },
      contact: { type: pageSeoSchema, default: () => PAGE_DEFAULTS.contact },
      blogs: { type: pageSeoSchema, default: () => PAGE_DEFAULTS.blogs },
      gallery: { type: pageSeoSchema, default: () => PAGE_DEFAULTS.gallery },
    },

    // ---- AI search (GEO) ----
    allowAiCrawlers: { type: Boolean, default: true }, // GPTBot, ClaudeBot, PerplexityBot, Google-Extended…
    llmsIntro: {
      type: String,
      default:
        "Skiez Technologies India Pvt Ltd is a software development company in Chengalpattu / Chennai, Tamil Nadu, India, founded in 2013. It builds custom websites, mobile apps, UI/UX designs, cloud, AI and data solutions, and offers digital marketing.",
      trim: true,
    },
  },
  { timestamps: true }
);

// Always work with exactly one settings document
siteSettingsSchema.statics.getSingleton = async function () {
  let doc = await this.findOne();
  if (!doc) return this.create({});

  // One-time upgrade of untouched legacy default wording
  let changed = false;
  if (!doc.siteUrl) {
    doc.siteUrl = "https://www.skieztechnologies.org";
    changed = true;
  }
  for (const [key, fields] of Object.entries(LEGACY_DEFAULTS)) {
    for (const [field, oldValue] of Object.entries(fields)) {
      if (doc.pages?.[key]?.[field] === oldValue) {
        doc.pages[key][field] = PAGE_DEFAULTS[key][field];
        changed = true;
      }
    }
  }
  if (changed) await doc.save();
  return doc;
};

export default mongoose.model("SiteSettings", siteSettingsSchema);
