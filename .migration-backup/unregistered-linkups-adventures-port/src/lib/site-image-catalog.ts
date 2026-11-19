export type SiteImageSlot = {
  key: string
  label: string
  fallback: string
}

const slots = (
  entries: Array<[key: string, label: string, fallback: string]>,
): SiteImageSlot[] => entries.map(([key, label, fallback]) => ({ key, label, fallback }))

export const siteImageCatalog: Record<string, SiteImageSlot[]> = {
  home: slots([
    ['hero-accent', 'Homepage hero accent image', '/images/linkups-hero-monkey.webp'],
    ['experience-photo', 'LinkUps experience section', '/images/group-travel-hero.png'],
    ['custom-trip-banner', 'Custom trip banner', '/images/adventure-mountain.png'],
    ['destination-maasai-mara', 'Destination card: Maasai Mara', '/images/adventure-hero.png'],
    ['destination-amboseli', 'Destination card: Amboseli', '/images/adventure-mountain.png'],
    ['destination-samburu', 'Destination card: Samburu', '/images/adventure-hero.png'],
    ['destination-naivasha', 'Destination card: Naivasha', '/images/adventure-coast.png'],
    ['destination-mombasa', 'Destination card: Mombasa', '/images/adventure-coast.png'],
    ['destination-watamu', 'Destination card: Watamu', '/images/adventure-coast.png'],
    ['destination-malindi', 'Destination card: Malindi', '/images/adventure-hero.png'],
    ['destination-nanyuki', 'Destination card: Nanyuki', '/images/adventure-mountain.png'],
    ['type-safari', 'Adventure type: Safari', '/images/adventure-hero.png'],
    ['type-beach-escapes', 'Adventure type: Beach Escapes', '/images/adventure-coast.png'],
    ['type-camping-outdoors', 'Adventure type: Camping & Outdoors', '/images/adventure-camp.png'],
    ['type-road-trips', 'Adventure type: Road Trips', '/images/contact-hero.png'],
    ['type-group-escapes', 'Adventure type: Group Escapes', '/images/group-travel-hero.png'],
    ['type-couples-family', 'Adventure type: Couples & Family', '/images/adventure-coast.png'],
    ['vibe-thrill-seeker', 'Adventure vibe: Thrill Seeker', '/images/trips/rapids-and-rush.jpg'],
    ['vibe-beach-baby', 'Adventure vibe: Beach Baby', '/images/adventure-coast.png'],
    ['vibe-wild-at-heart', 'Adventure vibe: Wild at Heart', '/images/adventure-hero.png'],
    ['vibe-good-times-only', 'Adventure vibe: Good Times Only', '/images/group-travel-hero.png'],
    ['vibe-wildlife', 'Adventure vibe: Wildlife', '/images/adventure-mountain.png'],
    ['vibe-family-time', 'Adventure vibe: Family Time', '/images/group-travel-hero.png'],
  ]),
  about: slots([
    ['hero', 'About page hero', '/images/group-travel-hero.webp'],
    ['founder', 'Founder portrait', '/images/about-founder.png'],
    ['team-operations', 'Team photo: Operations', '/images/group-travel-hero.png'],
    ['team-safari-guides', 'Team photo: Safari guides', '/images/adventure-hero.png'],
    ['team-customer-support', 'Team photo: Customer support', '/images/about-founder.png'],
    ['team-trip-planners', 'Team photo: Trip planners', '/images/adventure-coast.png'],
    ['photo-strip-friends', 'Story gallery: Friends', '/images/group-travel-hero.png'],
    ['photo-strip-safari', 'Story gallery: Safari', '/images/adventure-hero.png'],
    ['photo-strip-camp', 'Story gallery: Camping', '/images/adventure-camp.png'],
    ['photo-strip-coast', 'Story gallery: Coast', '/images/adventure-coast.png'],
  ]),
  destinations: slots([
    ['hero', 'Destinations page hero', '/images/adventure-hero.webp'],
    ['destination-maasai-mara', 'Destination: Maasai Mara', '/images/adventure-hero.png'],
    ['destination-amboseli', 'Destination: Amboseli', '/images/adventure-mountain.png'],
    ['destination-mombasa', 'Destination: Mombasa', '/images/adventure-coast.png'],
    ['destination-naivasha', 'Destination: Naivasha', '/images/adventure-mountain.png'],
    ['destination-samburu', 'Destination: Samburu', '/images/adventure-hero.png'],
    ['destination-watamu', 'Destination: Watamu', '/images/adventure-coast.png'],
    ['package-maasai-mara-villa', 'Featured package: Maasai Mara Villa Escape', '/images/adventure-camp.png'],
    ['package-mombasa-beach', 'Featured package: Mombasa Beach Escape', '/images/adventure-coast.png'],
    ['package-naivasha-adventure', 'Featured package: Naivasha Adventure', '/images/adventure-mountain.png'],
    ['package-samburu-overland', 'Featured package: Samburu Overland', '/images/adventure-hero.png'],
    ['package-wild-hearts', 'Featured package: Wild Hearts Escape', '/images/adventure-camp.png'],
    ['package-girls-escape', 'Featured package: Girls’ Adventure Escape', '/images/group-travel-hero.png'],
  ]),
  'group-travel': slots([
    ['hero', 'Group travel hero', '/images/group-travel-hero.webp'],
    ['type-friends', 'Group type: Friends', '/images/group-travel-hero.png'],
    ['type-girls-trips', 'Group type: Girls trips', '/images/group-travel-hero.png'],
    ['type-birthdays-celebrations', 'Group type: Birthdays & celebrations', '/images/adventure-coast.png'],
    ['type-families', 'Group type: Families', '/images/group-travel-hero.png'],
    ['type-corporate-groups', 'Group type: Corporate groups', '/images/group-travel-hero.png'],
    ['contact-banner', 'Group travel contact banner', '/images/group-travel-hero.png'],
  ]),
  contact: slots([
    ['hero', 'Contact page hero', '/images/group-travel-hero.webp'],
    ['faq-image', 'Frequently asked questions image', '/images/contact-hero.png'],
  ]),
  blog: slots([
    ['hero', 'Blog page hero', '/images/adventure-mountain.webp'],
    ['post-maasai-mara', 'Article image: Maasai Mara bucket list', '/images/adventure-hero.png'],
    ['post-beach-getaway', 'Article image: Beach getaway', '/images/adventure-coast.png'],
    ['post-rafting', 'Article image: Rafting in Kenya', '/images/adventure-mountain.png'],
    ['post-girls-trip', 'Article image: Girls trip to Mombasa', '/images/group-travel-hero.png'],
    ['post-naivasha', 'Article image: Naivasha day trip', '/images/adventure-mountain.png'],
    ['post-camping', 'Article image: Camping guide', '/images/adventure-camp.png'],
  ]),
}

export function getSiteImageSlots(pageKey: string): SiteImageSlot[] {
  return siteImageCatalog[pageKey] ?? []
}

export function resolveSiteImage(
  imageOverrides: Record<string, string> | null | undefined,
  key: string,
  fallback: string,
): string {
  return imageOverrides?.[key]?.trim() || fallback
}
