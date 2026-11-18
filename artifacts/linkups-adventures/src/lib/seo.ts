import seoData from "./seo-data.json";

export type SeoEntry = {
  title: string;
  description: string;
  keywords: string[];
  imageSource: string;
  imageAlt: string;
  index: boolean;
  sitemap: boolean;
  schemaType: string;
};

type SeoConfig = {
  site: {
    name: string;
    url: string;
    locale: string;
    defaultTitle: string;
    defaultDescription: string;
    defaultKeywords: string[];
  };
  pages: Record<string, SeoEntry>;
  destinations: Record<string, SeoEntry>;
  adventures: Record<string, SeoEntry>;
};

const config = seoData as SeoConfig;
const configuredSiteUrl =
  import.meta.env.VITE_SITE_URL?.trim() || config.site.url;
export const siteUrl = configuredSiteUrl.replace(/\/+$/, "");

function normalizePath(path: string) {
  const pathname = path.split(/[?#]/, 1)[0] || "/";
  if (pathname === "/") return pathname;
  return pathname.replace(/\/+$/, "");
}

function titleFromSlug(slug: string) {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getSeoEntry(path: string): SeoEntry {
  const pathname = normalizePath(path);
  const staticPage = config.pages[pathname];
  if (staticPage) return staticPage;

  const adventureMatch = pathname.match(/^\/adventures\/([^/]+)$/);
  if (adventureMatch) {
    const adventure = config.adventures[decodeURIComponent(adventureMatch[1])];
    if (adventure) return adventure;
    const title = titleFromSlug(adventureMatch[1]);
    return {
      title: `${title} Kenya Adventure | LinkUps Adventures`,
      description: `Explore ${title} with LinkUps Adventures. Review trip details and contact our team for current rates, travel dates and booking support.`,
      keywords: [title, "Kenya adventure tours", "LinkUps Adventures"],
      imageSource: "/images/adventure-hero.webp",
      imageAlt: `${title} Kenya adventure with LinkUps`,
      index: false,
      sitemap: false,
      schemaType: "TouristTrip",
    };
  }

  const destinationMatch = pathname.match(/^\/destinations\/([^/]+)$/);
  if (destinationMatch) {
    const destination = config.destinations[decodeURIComponent(destinationMatch[1])];
    if (destination) return destination;
    const title = titleFromSlug(destinationMatch[1]);
    return {
      title: `${title} Kenya Travel Guide | LinkUps Adventures`,
      description: `Explore ${title}, Kenya with LinkUps Adventures. Find destination information and contact our team to plan a safari or custom trip.`,
      keywords: [title, "Kenya destinations", "Kenya safari tours"],
      imageSource: "/images/adventure-hero.webp",
      imageAlt: `${title} destination in Kenya`,
      index: false,
      sitemap: false,
      schemaType: "TouristDestination",
    };
  }

  return {
    title: config.site.defaultTitle,
    description: config.site.defaultDescription,
    keywords: config.site.defaultKeywords,
    imageSource: "/images/linkups-logo.png",
    imageAlt: `${config.site.name} logo`,
    index: false,
    sitemap: false,
    schemaType: "WebPage",
  };
}

export function absoluteSiteUrl(path: string) {
  return new URL(path.startsWith("/") ? path : `/${path}`, `${siteUrl}/`).toString();
}

export function socialImagePath(path: string) {
  const normalized = normalizePath(path);
  const filename =
    normalized === "/"
      ? "home"
      : normalized
          .replace(/^\/|\/$/g, "")
          .replaceAll("/", "-")
          .replace(/[^a-z0-9-]/gi, "");
  return `/og/${filename}.jpg`;
}

function labelFromTitle(title: string) {
  return title.split("|")[0].trim();
}

export function getPageStructuredData(path: string, entry: SeoEntry) {
  const pathname = normalizePath(path);
  const canonicalUrl = absoluteSiteUrl(pathname);
  const organizationId = `${siteUrl}/#organization`;
  const websiteId = `${siteUrl}/#website`;
  const imageUrl = absoluteSiteUrl(socialImagePath(pathname));
  const breadcrumbs = [{ name: "Home", url: absoluteSiteUrl("/") }];
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length > 1) {
    const parentPath = `/${segments[0]}`;
    const parentEntry = config.pages[parentPath];
    breadcrumbs.push({
      name: parentEntry ? labelFromTitle(parentEntry.title) : titleFromSlug(segments[0]),
      url: absoluteSiteUrl(parentPath),
    });
  }
  if (pathname !== "/") {
    breadcrumbs.push({ name: labelFromTitle(entry.title), url: canonicalUrl });
  }

  const mainEntity =
    entry.schemaType === "TouristTrip" || entry.schemaType === "TouristDestination"
      ? {
          "@type": entry.schemaType,
          name: labelFromTitle(entry.title),
          description: entry.description,
          url: canonicalUrl,
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
        url: siteUrl,
        logo: {
          "@type": "ImageObject",
          url: absoluteSiteUrl("/images/linkups-logo.png"),
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
        url: siteUrl,
        inLanguage: "en-KE",
        publisher: { "@id": organizationId },
      },
      {
        "@type": ["AboutPage", "ContactPage", "CollectionPage"].includes(
          entry.schemaType,
        )
          ? entry.schemaType
          : "WebPage",
        "@id": `${canonicalUrl}#webpage`,
        name: entry.title,
        description: entry.description,
        url: canonicalUrl,
        inLanguage: "en-KE",
        isPartOf: { "@id": websiteId },
        primaryImageOfPage: { "@type": "ImageObject", url: imageUrl },
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
