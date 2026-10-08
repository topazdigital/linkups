'use client'

import { CalendarDays, Check, MapPin, Users } from 'lucide-react'
import { Link } from 'wouter'
import { AdventureCards } from '@/components/adventure-cards'
import { PageFrame } from '@/components/site-shell'
import { formatKes } from '@/lib/api'
import { useAdventures } from '@/lib/use-adventures'

export default function AdventureDetailPage({ slug }: { slug: string }) {
  const { adventures, loading, error } = useAdventures()

  if (loading) {
    return <PageFrame><section className="compare-page" role="status"><h1>Loading adventure…</h1></section></PageFrame>
  }
  if (error) {
    return <PageFrame><section className="compare-page" role="alert"><h1>Adventure listings are unavailable</h1><p>{error}</p><Link className="button orange" href="/contact">Contact our team</Link></section></PageFrame>
  }

  const adventure = adventures.find((item) => item.slug === slug)
  if (!adventure) {
    return <PageFrame><section className="compare-page"><h1>Adventure not found</h1><p>This trip may no longer be available.</p><Link className="button orange" href="/adventures">Browse adventures</Link></section></PageFrame>
  }

  const duration = `${adventure.durationDays} day${adventure.durationDays === 1 ? '' : 's'}${adventure.durationNights ? ` · ${adventure.durationNights} night${adventure.durationNights === 1 ? '' : 's'}` : ''}`
  return <PageFrame>
    <main className="tour-detail">
      <section className="tour-hero" style={{ backgroundImage: `linear-gradient(90deg,rgba(1,44,37,.9),rgba(1,44,37,.18)),url(${adventure.heroImageUrl || '/images/adventure-hero.png'})` }}>
        <div className="tour-hero-copy">
          <span className="eyebrow orange-text">Linkups Adventures · Kenya</span>
          <h1>{adventure.title}</h1>
          <p>{adventure.description || 'Wild places, thoughtful planning and new stories with your favourite people.'}</p>
          <div className="tour-meta"><span><CalendarDays /> {duration}</span><span><MapPin /> {adventure.category}</span><span><Users /> Group and private bookings</span></div>
        </div>
      </section>
      <section className="tour-content">
        <div className="tour-intro">
          <div>
            <span className="eyebrow">The experience</span>
            <h2>Same people.<br />New stories.</h2>
            <p>{adventure.description || 'This carefully planned experience brings together local knowledge, comfortable travel and the moments you came for. Our team will confirm dates and details with you.'}</p>
            <div className="tour-checks"><span><Check /> Flexible date planning</span><span><Check /> A team to guide your booking</span><span><Check /> Details confirmed before payment</span></div>
            <Link className="button orange" href={`/plan?tour=${encodeURIComponent(adventure.slug)}`}>Request a booking</Link>
          </div>
          <img className="tour-image" src={adventure.heroImageUrl || '/images/adventure-hero.png'} alt={adventure.title} />
        </div>
        <div className="itinerary">
          <span className="eyebrow">Your trip, thoughtfully planned</span>
          <h2>Plan the details with us</h2>
          <p>Send your preferred dates and group size. Our team will confirm the itinerary, availability and final price before you pay.</p>
          <div className="day-list">
            {Array.from({ length: Math.min(adventure.durationDays, 3) }, (_, index) => (
              <article className="day-card" key={index}>
                <b>Day {String(index + 1).padStart(2, '0')}</b>
                <h4>{index === 0 ? 'Arrival and settle in' : index === adventure.durationDays - 1 ? 'Return at your pace' : 'The main adventure'}</h4>
                <p>{index === 0 ? 'Meet your guide and settle into the experience.' : 'Explore with local support and time to make the trip your own.'}</p>
              </article>
            ))}
          </div>
        </div>
        <div className="booking-card"><div><h3>Ready to make it real?</h3><p>From {formatKes(adventure.price)} per person · final details confirmed by our team.</p></div><Link className="button orange" href={`/plan?tour=${encodeURIComponent(adventure.slug)}`}>Request a booking</Link></div>
      </section>
      <section className="packages"><h2>Other adventures you might like</h2><AdventureCards variant="package" limit={3} /></section>
    </main>
  </PageFrame>
}
