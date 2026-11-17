'use client'

import { CalendarDays, Check, MapPin, Users } from 'lucide-react'
import { Link } from 'wouter'
import { AdventureCards } from '@/components/adventure-cards'
import { PageFrame } from '@/components/site-shell'
import { formatAdventurePrice } from '@/lib/api'
import { useAdventures } from '@/lib/use-adventures'
import './trip-detail.css'

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
  const galleryImages = adventure.galleryImageUrls.filter((image) => image !== adventure.heroImageUrl)
  const priceLabel = formatAdventurePrice(adventure)
  return <PageFrame>
    <main className="tour-detail">
      <section className="tour-hero" data-testid="section-adventure-hero" style={{ backgroundImage: `linear-gradient(90deg,rgba(1,44,37,.9),rgba(1,44,37,.18)),url(${adventure.heroImageUrl || '/images/adventure-hero.png'})` }}>
        <div className="tour-hero-copy">
          <span className="eyebrow orange-text">Linkups Adventures · Kenya</span>
          <h1>{adventure.title}</h1>
          {adventure.tagline && <p className="tour-tagline">{adventure.tagline}</p>}
          <p>{adventure.description || 'Wild places, thoughtful planning and new stories with your favourite people.'}</p>
          <div className="tour-meta"><span><CalendarDays /> {duration}</span><span><MapPin /> {adventure.destinationName || adventure.category}</span><span><Users /> Group and private bookings</span></div>
        </div>
      </section>
      <section className="tour-content">
        <div className="tour-intro" data-testid="section-adventure-overview">
          <div>
            <span className="eyebrow">The experience</span>
            <h2>{adventure.destinationName ? `Discover ${adventure.destinationName}.` : 'Same people.'}<br />New stories.</h2>
            <p>{adventure.description || 'This carefully planned experience brings together local knowledge, comfortable travel and the moments you came for. Our team will confirm dates and details with you.'}</p>
            {adventure.accommodation && <p className="tour-accommodation"><strong>Stay:</strong> {adventure.accommodation}</p>}
            {adventure.highlights.length > 0 && <div className="tour-highlights"><h3>Trip highlights</h3><ul>{adventure.highlights.map((item, index) => <li key={`${item}-${index}`}><Check />{item}</li>)}</ul></div>}
            <div className="tour-checks"><span><Check /> Flexible date planning</span><span><Check /> A team to guide your booking</span><span><Check /> Details confirmed before payment</span></div>
            <Link className="button orange" href={`/plan?tour=${encodeURIComponent(adventure.slug)}`}>Request a booking</Link>
          </div>
          <img className="tour-image" data-testid="img-adventure-main" src={adventure.heroImageUrl || '/images/adventure-hero.png'} alt={`${adventure.title} main trip image`} />
        </div>
        {galleryImages.length > 0 && <section className="trip-gallery" aria-label={`${adventure.title} photo gallery`} data-testid="gallery-adventure">
          <div><span className="eyebrow">A closer look</span><h2>Trip gallery</h2></div>
          <div className="trip-gallery-grid">{galleryImages.map((image, index) => <img src={image} alt={`${adventure.title} gallery photo ${index + 1}`} key={`${image}-${index}`} data-testid={`img-adventure-gallery-${index + 1}`} />)}</div>
        </section>}
        <section className="itinerary" data-testid="section-adventure-itinerary">
          <span className="eyebrow">Your trip, thoughtfully planned</span>
          <h2>Itinerary</h2>
          <p>Timing and activities can vary with weather, road conditions, tides and supplier availability. We’ll confirm the current plan with you before booking.</p>
          <div className="day-list">
            {adventure.itinerary.map((day, index) => <article className="day-card" key={`${day.day}-${index}`} data-testid={`card-itinerary-${index + 1}`}>
              <b>{day.day}</b>
              <h4>{day.title}</h4>
              <ul>{day.details.map((detail, detailIndex) => <li key={`${detail}-${detailIndex}`}>{detail}</li>)}</ul>
            </article>)}
          </div>
        </section>
        <section className="trip-inclusions" data-testid="section-adventure-package-details">
          <article className="trip-info-card included-card">
            <h2>What’s included</h2>
            {adventure.included.length ? <ul>{adventure.included.map((item, index) => <li key={`${item}-${index}`}><Check />{item}</li>)}</ul> : <p>Package inclusions will be confirmed with your quotation.</p>}
          </article>
          <article className="trip-info-card excluded-card">
            <h2>Not included</h2>
            {adventure.excluded.length ? <ul>{adventure.excluded.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul> : <p>Ask our team to confirm any additional costs.</p>}
          </article>
          {adventure.optionalActivities.length > 0 && <article className="trip-info-card optional-card">
            <h2>Optional experiences</h2>
            <ul>{adventure.optionalActivities.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul>
          </article>}
        </section>
        {adventure.idealFor.length > 0 && <p className="trip-ideal-for"><strong>Great for:</strong> {adventure.idealFor.join(' · ')}</p>}
        <div className="booking-card" data-testid="card-adventure-booking">
          <div><h3>Ready to make it real?</h3><p>{priceLabel === 'Price on request' ? priceLabel : `${priceLabel} per person`}</p>{adventure.pricingNote && <small>{adventure.pricingNote}</small>}</div>
          <Link className="button orange" href={`/plan?tour=${encodeURIComponent(adventure.slug)}`}>Request a booking</Link>
        </div>
      </section>
      <section className="packages"><h2>Other adventures you might like</h2><AdventureCards variant="package" limit={3} /></section>
    </main>
  </PageFrame>
}
