import { useState, type FormEvent } from 'react'
import { Link } from 'wouter'
import { ArrowRight, CalendarDays, Check, ChevronRight, Clock3, MapPin, MessageCircle, ShieldCheck, Sparkles, Users, X } from 'lucide-react'
import { PageFrame } from '@/components/site-shell'
import { destinations, getDestination } from '@/lib/destinations'
import { ApiRequestError, createBooking } from '@/lib/api'
import { optimizedImageUrl, SiteImage } from '@/components/site-image'
import { useSiteImageOverrides } from '@/lib/use-site-image-overrides'

const itinerary = [
  ['Day 1', 'Nairobi to Maasai Mara', 'Depart Nairobi · arrive at the lodge · afternoon game drive · dinner and bonfire'],
  ['Day 2', 'Full day safari', 'Early morning game drive · breakfast · optional balloon safari · afternoon game drive · dinner and relaxation'],
  ['Day 3', 'Return to Nairobi', 'Optional morning game drive · breakfast · depart for Nairobi · arrive by late afternoon'],
]

export default function DestinationPage({ slug }: { slug: string }) {
  const { getImage } = useSiteImageOverrides('destinations')
  const destination = getDestination(slug)
  if (!destination) return <PageFrame><section className="compare-page"><h1>Destination not found</h1><p>This destination may no longer be available.</p><Link className="button orange" href="/destinations">Browse destinations</Link></section></PageFrame>
  const destinationImage = getImage(`destination-${destination.slug}`, destination.image)
  const gallery = [destinationImage, destinationImage, destinationImage, destinationImage, destinationImage]
  return <PageFrame><main className="destination-package">
    <section className="package-hero" style={{ backgroundImage: `linear-gradient(90deg,rgba(0,40,34,.88),rgba(0,40,34,.1)),url(${optimizedImageUrl(destination.image)})` }}>
      <div className="package-hero-copy"><span className="package-pill">Featured destination</span><span className="eyebrow">LinkUps Adventures</span><h1>{destination.name}<br /><em>Villa Escape</em></h1><p>{destination.description} Unforgettable moments with your favourite people.</p><div className="package-meta"><span><CalendarDays /> 3 Days / 2 Nights</span><span><MapPin /> {destination.name}</span><span><Users /> 8–16 Pax (sharing)</span></div></div><div className="package-price"><small>From</small><strong>KES 24,800</strong><span>per person</span></div>
    </section>
    <nav className="package-tabs" aria-label="Package sections"><a href="#overview">Overview</a><a href="#itinerary">Itinerary</a><a href="#included">Inclusions</a><a href="#gallery">Gallery</a><a href="#booking">Book now</a><a className="whatsapp-tab" href="https://wa.me/254726843677"><MessageCircle /> Chat on WhatsApp</a></nav>
    <section id="overview" className="package-overview"><div className="experience-copy"><span className="eyebrow orange-text">The experience</span><h2>Escape to the wild side of luxury.</h2><p>This carefully planned adventure blends the thrill of safari with the comfort of a private villa, giving you the perfect mix of nature, relaxation and fun.</p><p>Spend your days on game drives, enjoy breathtaking sunsets, unwind by the pool, and create memories that will last a lifetime with your crew.</p><div className="feature-icons"><span><Sparkles />Private villa<br />with pool</span><span><MapPin />Game drives<br />in land cruisers</span><span><Check />Delicious<br />meals</span><span><Clock3 />Bonfire nights<br />& entertainment</span></div></div><div id="gallery" className="package-gallery"><SiteImage className="gallery-main" src={gallery[0]} alt={`${destination.name} wildlife`} /><div className="gallery-side"><SiteImage src={gallery[1]} alt="Lodge at sunset" /><SiteImage src={gallery[2]} alt="Safari vehicle" /></div><div className="gallery-strip">{gallery.slice(2).map((image, index) => <SiteImage key={`${image}-${index}`} src={image} alt="Safari experience" />)}</div></div></section>
    <section className="package-lower"><article id="itinerary" className="itinerary-panel"><h2><CalendarDays /> Your itinerary</h2><div className="timeline">{itinerary.map(([day, title, detail], index) => <div className="timeline-item" key={day}><b>{index + 1}</b><div><strong>{day} – {title}</strong><p>{detail}</p></div></div>)}</div><div className="script-signoff">Same people. New stories.</div></article><div id="included" className="inclusion-stack"><article className="included"><h3><Check /> What&apos;s included</h3>{['Transport in a 4x4 Land Cruiser','4-bedroom villa (shared)','Private pool & lounge area','All meals (HB)','Game drives and park fees','Professional guide'].map(item => <p key={item}><Check /> {item}</p>)}</article><article className="not-included"><h3><X /> What&apos;s not included</h3>{['International flights','Balloon safari (extra cost)','Personal expenses','Travel insurance','Tips & gratuities'].map(item => <p key={item}><X /> {item}</p>)}</article></div><BookingCard destinationName={destination.name} /></section>
    <section className="related-packages"><h2>Other amazing trips you might like</h2><div>{destinations.filter(item => item.slug !== slug).slice(0, 4).map(item => <Link href={`/destinations/${item.slug}`} key={item.slug}><SiteImage src={item.image} alt={item.name} /><strong>{item.name}</strong><small>From KES 12,800 pp</small><span>View package <ArrowRight /></span></Link>)}</div></section>
  </main></PageFrame>
}

function BookingCard({ destinationName }: { destinationName: string }) {
  const [reference, setReference] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSending(true)
    setError('')
    const form = new FormData(event.currentTarget)
    const travellers = Number(form.get('travellers') ?? 8)
    const specialRequests = [
      `Package: ${destinationName} Villa Escape`,
      `Group size requested: ${travellers}`,
      String(form.get('specialRequests') ?? '').trim(),
    ].filter(Boolean).join('\n')

    try {
      const result = await createBooking({
        fullName: String(form.get('fullName') ?? '').trim(),
        email: String(form.get('email') ?? '').trim(),
        phone: String(form.get('phone') ?? '').trim(),
        adventureSlug: null,
        travelDate: String(form.get('travelDate') ?? '') || null,
        travellers,
        specialRequests,
      })
      setReference(result.reference)
    } catch (reason) {
      setError(reason instanceof ApiRequestError ? reason.message : 'Your booking request could not be sent.')
    } finally {
      setSending(false)
    }
  }

  return <aside id="booking" className="booking-panel">
    <h2>Book this adventure</h2>
    <p>Secure your spot. Let&apos;s make it happen!</p>
    {reference ? <div className="success-box" role="status"><strong>Booking request received</strong><p>Your reference is {reference}. We&apos;ll confirm availability and final pricing before you pay.</p></div> : <form onSubmit={submit}>
      <input name="fullName" aria-label="Full name" autoComplete="name" placeholder="Full Name *" required minLength={2} maxLength={150} />
      <input name="phone" aria-label="Phone or WhatsApp" autoComplete="tel" placeholder="Phone / WhatsApp *" required minLength={5} maxLength={30} />
      <input name="email" aria-label="Email address" autoComplete="email" type="email" placeholder="Email Address *" required maxLength={190} />
      <input name="travelDate" aria-label="Preferred travel date" type="date" />
      <label htmlFor="destination-travellers">Number of travellers (8–16)</label>
      <input id="destination-travellers" name="travellers" aria-label="Number of travellers" type="number" min={8} max={16} defaultValue={8} required />
      <textarea name="specialRequests" aria-label="Special requests" placeholder="Special Requests (optional)" maxLength={7900} />
      {error && <div className="error-box" role="alert">{error}</div>}
      <button type="submit" disabled={sending}>{sending ? 'Sending…' : <>Reserve my spot <ArrowRight /></>}</button>
    </form>}
    <a className="booking-whatsapp" href="https://wa.me/254726843677"><MessageCircle /> Chat on WhatsApp</a>
    <div className="booking-trust"><span><ShieldCheck />Secure booking</span><span><CalendarDays />Flexible dates</span><span><Users />Expert support</span></div>
  </aside>
}
