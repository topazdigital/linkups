import { useEffect } from "react";
import { useLocation } from "wouter";
import { applyPageSeo } from "@/lib/seo";

export function SeoManager() {
  const [location] = useLocation();

  useEffect(() => {
    const pathname = location.split(/[?#]/, 1)[0] || "/";
    applyPageSeo(pathname);
  }, [location]);

  return null;
}
