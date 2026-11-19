import { siteImages } from '@/components/site-shell'

export const destinations = [
  { slug: 'maasai-mara', name: 'Maasai Mara', region: 'South-west Kenya', tagline: 'Where the wild writes the itinerary.', description: 'Golden grasslands, dramatic sunsets and close encounters with Kenya’s most iconic wildlife.', image: siteImages.mara, highlights: ['Big five game drives', 'Maasai culture', 'Luxury tented stays'], bestFor: 'Wildlife, first-time safari and slow mornings' },
  { slug: 'amboseli', name: 'Amboseli', region: 'Kajiado County', tagline: 'Elephants beneath the mountain.', description: 'Wide-open plains, enormous herds and unforgettable views of Mount Kilimanjaro.', image: siteImages.mountain, highlights: ['Kilimanjaro views', 'Elephant herds', 'Community visits'], bestFor: 'Photography, families and scenic safaris' },
  { slug: 'mombasa', name: 'Mombasa', region: 'Kenya Coast', tagline: 'Salt air, Swahili soul.', description: 'Trade city energy, warm Indian Ocean water and a coastline made for switching off.', image: siteImages.coast, highlights: ['Old Town walks', 'Beach days', 'Swahili food'], bestFor: 'Beach escapes, culture and easy-going weekends' },
  { slug: 'naivasha', name: 'Naivasha', region: 'Great Rift Valley', tagline: 'Breathe deeper in the Rift.', description: 'Lake breezes, volcanic landscapes and a refreshing mix of outdoor adventures.', image: siteImages.mountain, highlights: ['Boat rides', 'Hell’s Gate cycling', 'Hot springs'], bestFor: 'Short breaks, couples and active travellers' },
  { slug: 'samburu', name: 'Samburu', region: 'Northern Kenya', tagline: 'A wilder kind of quiet.', description: 'Rugged hills, river country and rare northern species in a landscape unlike anywhere else.', image: siteImages.mara, highlights: ['Unique wildlife', 'Samburu culture', 'River adventures'], bestFor: 'Repeat safari travellers and curious explorers' },
  { slug: 'watamu', name: 'Watamu', region: 'Kilifi County', tagline: 'Find your blue horizon.', description: 'A relaxed marine playground for barefoot mornings, reef days and golden evenings.', image: siteImages.coast, highlights: ['Snorkelling', 'Marine life', 'Quiet beaches'], bestFor: 'Rest, romance and ocean-loving families' },
]

export function getDestination(slug: string) { return destinations.find((destination) => destination.slug === slug) }
