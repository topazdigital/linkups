import { useEffect } from "react";
import { useLocation } from "wouter";
import {
  absoluteSiteUrl,
  getPageStructuredData,
  getSeoEntry,
  socialImagePath,
} from "@/lib/seo";

function setMeta(attribute: "name" | "property", key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(
    `meta[${attribute}="${key}"]`,
  );
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.content = content;
}

function setCanonical(href: string) {
  let element = document.head.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]',
  );
  if (!element) {
    element = document.createElement("link");
    element.rel = "canonical";
    document.head.appendChild(element);
  }
  element.href = href;
}

export function SeoManager() {
  const [location] = useLocation();

  useEffect(() => {
    const pathname = location.split(/[?#]/, 1)[0] || "/";
    const entry = getSeoEntry(pathname);
    const canonical = absoluteSiteUrl(pathname);
    const image = absoluteSiteUrl(socialImagePath(pathname));
    const robots = entry.index ? "index, follow" : "noindex, follow";

    document.title = entry.title;
    document.documentElement.lang = "en";
    setMeta("name", "description", entry.description);
    setMeta("name", "keywords", entry.keywords.join(", "));
    setMeta("name", "robots", robots);
    setMeta("name", "author", "LinkUps Adventures");
    setMeta("name", "theme-color", "#123c32");
    setMeta("property", "og:title", entry.title);
    setMeta("property", "og:description", entry.description);
    setMeta("property", "og:url", canonical);
    setMeta("property", "og:type", "website");
    setMeta("property", "og:locale", "en_KE");
    setMeta("property", "og:site_name", "LinkUps Adventures");
    setMeta("property", "og:image", image);
    setMeta("property", "og:image:width", "1200");
    setMeta("property", "og:image:height", "630");
    setMeta("property", "og:image:alt", entry.imageAlt);
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", entry.title);
    setMeta("name", "twitter:description", entry.description);
    setMeta("name", "twitter:image", image);
    setMeta("name", "twitter:image:alt", entry.imageAlt);
    setCanonical(canonical);

    document.getElementById("linkups-seo-jsonld")?.remove();
    const structuredData = document.createElement("script");
    structuredData.id = "linkups-seo-jsonld";
    structuredData.type = "application/ld+json";
    structuredData.textContent = JSON.stringify(
      getPageStructuredData(pathname, entry),
    ).replace(/</g, "\\u003c");
    document.head.appendChild(structuredData);
  }, [location]);

  return null;
}
