import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(scriptDir, "..");
const distDir = path.join(appDir, "dist/public");
const config = JSON.parse(
  await readFile(path.join(appDir, "src/lib/seo-data.json"), "utf8"),
);
const baseUrl = (process.env.VITE_SITE_URL || config.site.url).replace(/\/+$/, "");
const htmlTemplate = await readFile(path.join(distDir, "index.html"), "utf8");

const pages = [
  ...Object.entries(config.pages).map(([route, entry]) => ({ route, entry })),
  ...Object.entries(config.destinations).map(([slug, entry]) => ({
    route: `/destinations/${slug}`,
    entry,
  })),
  ...Object.entries(config.adventures).map(([slug, entry]) => ({
    route: `/adventures/${slug}`,
    entry,
  })),
];

function absoluteUrl(route) {
  return new URL(route.startsWith("/") ? route : `/${route}`, `${baseUrl}/`).toString();
}

function imagePath(route) {
  if (route === "/") return "/og/home.jpg";
  return `/og/${route.replace(/^\/|\/$/g, "").replaceAll("/", "-").replace(/[^a-z0-9-]/gi, "")}.jpg`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeJson(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function getStructuredData(route, entry) {
  const canonical = absoluteUrl(route);
  const organizationId = `${baseUrl}/#organization`;
  const websiteId = `${baseUrl}/#website`;
  const heading = entry.title.split("|")[0].trim();
  const segments = route.split("/").filter(Boolean);
  const breadcrumbs = [{ name: "Home", url: absoluteUrl("/") }];
  if (segments.length > 1) {
    const parentRoute = `/${segments[0]}`;
    const parent = config.pages[parentRoute];
    breadcrumbs.push({
      name: parent
        ? parent.title.split("|")[0].trim()
        : segments[0].replaceAll("-", " "),
      url: absoluteUrl(parentRoute),
    });
  }
  if (route !== "/") breadcrumbs.push({ name: heading, url: canonical });

  const mainEntity =
    entry.schemaType === "TouristTrip" ||
    entry.schemaType === "TouristDestination"
      ? {
          "@type": entry.schemaType,
          name: heading,
          description: entry.description,
          url: canonical,
          provider: { "@id": organizationId },
        }
      : undefined;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TravelAgency",
        "@id": organizationId,
        name: config.site.name,
        url: baseUrl,
        logo: {
          "@type": "ImageObject",
          url: absoluteUrl("/images/linkups-logo.png"),
        },
        telephone: "+254726843677",
        email: "linkupsadventures@gmail.com",
        areaServed: { "@type": "Country", name: "Kenya" },
        sameAs: ["https://www.instagram.com/linkupsadventures/"],
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        name: config.site.name,
        url: baseUrl,
        inLanguage: "en-KE",
        publisher: { "@id": organizationId },
      },
      {
        "@type": ["AboutPage", "ContactPage", "CollectionPage"].includes(
          entry.schemaType,
        )
          ? entry.schemaType
          : "WebPage",
        "@id": `${canonical}#webpage`,
        name: entry.title,
        description: entry.description,
        url: canonical,
        inLanguage: "en-KE",
        isPartOf: { "@id": websiteId },
        primaryImageOfPage: {
          "@type": "ImageObject",
          url: absoluteUrl(imagePath(route)),
        },
        ...(mainEntity ? { mainEntity } : {}),
      },
      ...(entry.index && breadcrumbs.length > 1
        ? [
            {
              "@type": "BreadcrumbList",
              itemListElement: breadcrumbs.map((item, index) => ({
                "@type": "ListItem",
                position: index + 1,
                name: item.name,
                item: item.url,
              })),
            },
          ]
        : []),
    ],
  };
}

function makeMetaTags(route, entry) {
  const canonical = absoluteUrl(route);
  const image = absoluteUrl(imagePath(route));
  const robots = entry.index ? "index, follow" : "noindex, follow";
  const keywords = entry.keywords.join(", ");
  const tags = [
    `<title>${escapeHtml(entry.title)}</title>`,
    `<meta name="description" content="${escapeHtml(entry.description)}" />`,
    `<meta name="keywords" content="${escapeHtml(keywords)}" />`,
    `<meta name="robots" content="${robots}" />`,
    `<meta name="author" content="${escapeHtml(config.site.name)}" />`,
    `<meta name="theme-color" content="#123c32" />`,
    `<link rel="canonical" href="${escapeHtml(canonical)}" />`,
    `<meta property="og:title" content="${escapeHtml(entry.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(entry.description)}" />`,
    `<meta property="og:url" content="${escapeHtml(canonical)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:locale" content="${escapeHtml(config.site.locale)}" />`,
    `<meta property="og:site_name" content="${escapeHtml(config.site.name)}" />`,
    `<meta property="og:image" content="${escapeHtml(image)}" />`,
    '<meta property="og:image:width" content="1200" />',
    '<meta property="og:image:height" content="630" />',
    `<meta property="og:image:alt" content="${escapeHtml(entry.imageAlt)}" />`,
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${escapeHtml(entry.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(entry.description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(image)}" />`,
    `<meta name="twitter:image:alt" content="${escapeHtml(entry.imageAlt)}" />`,
    `<script id="linkups-seo-jsonld" type="application/ld+json">${escapeJson(getStructuredData(route, entry))}</script>`,
  ];

  return tags.join("\n    ");
}

function removeExistingSeoTags(html) {
  const seoMetaNames = new Set([
    "description",
    "keywords",
    "robots",
    "author",
    "theme-color",
    "og:title",
    "og:description",
    "og:url",
    "og:type",
    "og:locale",
    "og:site_name",
    "og:image",
    "og:image:width",
    "og:image:height",
    "og:image:alt",
    "twitter:card",
    "twitter:title",
    "twitter:description",
    "twitter:image",
    "twitter:image:alt",
  ]);

  return html
    .replace(/<title\b[^>]*>[\s\S]*?<\/title>\s*/gi, "")
    .replace(/<meta\b[^>]*>\s*/gi, (tag) => {
      const key = tag.match(/\b(?:name|property)=["']([^"']+)["']/i)?.[1];
      return key && seoMetaNames.has(key.toLowerCase()) ? "" : tag;
    })
    .replace(/<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>\s*/gi, "")
    .replace(/<script\b(?=[^>]*application\/ld\+json)[^>]*>[\s\S]*?<\/script>\s*/gi, "");
}

for (const { route, entry } of pages) {
  const routeImagePath = path.join(
    appDir,
    "public",
    imagePath(route).replace(/^\//, ""),
  );
  try {
    await readFile(routeImagePath);
  } catch {
    throw new Error(`Missing social preview image for ${route}: ${routeImagePath}`);
  }

  const routeHtml = removeExistingSeoTags(htmlTemplate).replace(
    /<\/head>/i,
    `    ${makeMetaTags(route, entry)}\n  </head>`,
  );
  const relativeRoute = route.replace(/^\/|\/$/g, "");
  const outputPath = relativeRoute
    ? path.join(distDir, relativeRoute, "index.html")
    : path.join(distDir, "index.html");
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, routeHtml);
}

const sitemapRoutes = pages
  .filter(({ entry }) => entry.index && entry.sitemap)
  .map(({ route }) => route);
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...sitemapRoutes.map(
    (route) => `  <url><loc>${escapeHtml(absoluteUrl(route))}</loc></url>`,
  ),
  "</urlset>",
  "",
].join("\n");
await writeFile(path.join(distDir, "sitemap.xml"), sitemap);
await writeFile(
  path.join(distDir, "robots.txt"),
  [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin",
    "Disallow: /api/",
    "",
    `Sitemap: ${absoluteUrl("/sitemap.xml")}`,
    "",
  ].join("\n"),
);

console.log(
  `Generated crawler-ready HTML for ${pages.length} routes, robots.txt, and a sitemap with ${sitemapRoutes.length} public URLs.`,
);
