'use client'

import { ArrowRight, Camera, Play, Star } from 'lucide-react'

const reviews = [
  ['“The whole trip felt personal. Every detail was handled and our guide made Kenya unforgettable.”', 'Amina K.', 'Maasai Mara safari'],
  ['“LinkUps found the perfect balance of adventure and rest for our family. We are already planning the next one.”', 'David M.', 'Mombasa escape'],
  ['“Great communication, honest pricing and the kind of local knowledge you cannot get from a generic tour.”', 'Sarah W.', 'Group adventure'],
]

const moments = [
  ['/images/adventure-hero.png', 'Sunrise over the Mara'],
  ['/images/adventure-camp.png', 'Campfire stories'],
  ['/images/adventure-coast.png', 'Coastal days'],
]

export function ReviewsMedia() {
  return <section className="reviews-media" aria-labelledby="reviews-heading">
    <div className="section-row"><div className="section-title"><span className="eyebrow">Real people. Real adventures.</span><h2 id="reviews-heading">Stories from the road</h2></div><a className="text-link" href="https://instagram.com/linkupsadventures" target="_blank" rel="noreferrer">Follow our journey <Camera /></a></div>
    <div className="review-grid">{reviews.map(([quote, name, trip]) => <article className="review-card" key={name}><div className="review-stars" aria-label="5 out of 5 stars">{[1, 2, 3, 4, 5].map((star) => <Star key={star} fill="currentColor" />)}</div><blockquote>{quote}</blockquote><strong>{name}</strong><small>{trip}</small></article>)}</div>
    <div className="media-strip">{moments.map(([image, title]) => <a href="https://instagram.com/linkupsadventures" target="_blank" rel="noreferrer" key={title}><img src={image} alt={title} /><span><Play /> {title}</span></a>)}</div>
    <a className="button dark center" href="/contact">Share your LinkUps story <ArrowRight /></a>
  </section>
}

export function SiteStructuredData() {
  const data = { '@context': 'https://schema.org', '@type': 'TravelAgency', name: 'LinkUps Adventures', url: 'https://linkupsadventures.com', telephone: '+254726843677', email: 'linkupsadventures@gmail.com', areaServed: 'Kenya', sameAs: ['https://instagram.com/linkupsadventures'] }
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
}
