import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://linkupsadventures.com'
  const paths = ['', '/adventures', '/destinations', '/group-travel', '/about', '/blog', '/contact', '/plan', '/login', '/register']
  return paths.map((path) => ({ url: `${base}${path}`, lastModified: new Date(), changeFrequency: 'weekly', priority: path === '' ? 1 : 0.7 }))
}
