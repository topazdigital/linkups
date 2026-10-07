import Link from 'next/link'
import { ArrowRight, Check, MapPin, Sparkles } from 'lucide-react'
import { notFound } from 'next/navigation'
import { PageFrame, SectionTitle } from '@/components/site-shell'
import { destinations, getDestination } from '@/lib/destinations'

export function generateStaticParams() { return destinations.map(({ slug }) => ({ slug })) }

export default async function DestinationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const destination = getDestination(slug)
  if (!destination) notFound()
  return <PageFrame><main className="destination-detail"><section className="destination-detail-hero" style={{ backgroundImage: `linear-gradient(90deg,rgba(0,33,28,.88),rgba(0,33,28,.18)),url(${destination.image})` }}><div><span className="eyebrow orange-text">Explore Kenya · {destination.region}</span><h1>{destination.name}</h1><p>{destination.tagline}</p><div className="destination-location"><MapPin /> {destination.region}</div></div></section><section className="destination-detail-body"><div className="destination-story"><SectionTitle eyebrow="Your kind of wild" title={destination.tagline}/><p>{destination.description}</p><p>We’ll shape the days around your pace, from the first coffee to the last sunset. Choose a thoughtful LinkUps itinerary or let our local team build a private escape around what you want to feel.</p><div className="destination-highlights">{destination.highlights.map((highlight) => <span key={highlight}><Check /> {highlight}</span>)}</div><Link className="button orange" href="/plan">Plan this destination <ArrowRight /></Link></div><aside className="destination-quick-card"><span className="eyebrow">Why go</span><Sparkles /><h3>{destination.bestFor}</h3><p>Tell us your dates and we’ll recommend the right stays, route and experiences.</p><Link className="text-link" href="/contact">Talk to a trip planner <ArrowRight /></Link></aside></section><section className="destination-next"><SectionTitle eyebrow="Keep exploring" title="More places to make memories."/><div className="destination-related-grid">{destinations.filter((item) => item.slug !== slug).slice(0, 3).map((item) => <Link href={`/destinations/${item.slug}`} className="destination-related-card" key={item.slug} style={{ backgroundImage: `linear-gradient(0deg,rgba(0,33,28,.85),transparent 70%),url(${item.image})` }}><span>{item.region}</span><h3>{item.name}</h3><ArrowRight /></Link>)}</div></section></main></PageFrame>
}
