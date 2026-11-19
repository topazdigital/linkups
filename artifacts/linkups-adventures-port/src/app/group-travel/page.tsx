'use client'

import { useState, type FormEvent } from 'react'
import { ArrowRight, BriefcaseBusiness, CalendarDays, Check, Heart, Headphones, Mail, MapPin, Users, Sparkles, ShieldCheck } from 'lucide-react'
import { Link } from 'wouter'
import { PageFrame, siteImages } from '@/components/site-shell'
import { ApiRequestError, createEnquiry } from '@/lib/api'
import { SiteImage } from '@/components/site-image'

const groupTypes = [
  ['Friends', 'Adventure is better with your people.', siteImages.group, Users],
  ['Girls trips', 'Good vibes. Great memories.', siteImages.group, Heart],
  ['Birthdays & celebrations', 'Make it a trip to remember.', siteImages.coast, CalendarDays],
  ['Families', 'Quality time. New experiences.', siteImages.group, Users],
  ['Corporate groups', 'Build stronger teams through adventure.', siteImages.group, BriefcaseBusiness],
]
const benefits = [['Custom itineraries', "Tailored to your group's interests and budget.", Sparkles], ['Group discounts', 'More people, better rates.', Users], ['Hassle-free planning', 'We handle the details, you enjoy the journey.', ShieldCheck], ['Experienced team', 'On-ground support throughout your trip.', Headphones], ['Flexible options', 'From luxury to budget-friendly.', CalendarDays], ['Unforgettable moments', "Because it’s not just a trip, it’s an experience.", Heart]]
const stories = [['The team was amazing! Everything was coordinated and we didn’t have to worry about a thing.', 'Brenda K.'], ['Our girls trip to Naivasha was exactly what we needed. Fun, relaxing and full of memories.', 'Shiru M.'], ['Perfect for our family. The kids loved it, the adults relaxed, and everything ran smoothly.', 'James T.'], ['Our corporate retreat was a huge success. Great planning, amazing activities and a fantastic team.', 'George N.']]

export default function GroupTravelPage() {
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSending(true)
    setError('')
    const form = new FormData(event.currentTarget)
    const groupType = String(form.get('groupType') ?? '').trim()
    const destination = String(form.get('destination') ?? '').trim()
    const people = String(form.get('people') ?? '').trim()
    const travelDates = String(form.get('travelDates') ?? '').trim()
    const details = String(form.get('details') ?? '').trim()
    const message = [
      `Group type: ${groupType}`,
      `Preferred destination: ${destination}`,
      `Number of people: ${people}`,
      `Travel dates: ${travelDates}`,
      details ? `Additional details: ${details}` : '',
    ].filter(Boolean).join('\n')

    try {
      await createEnquiry({
        name: String(form.get('name') ?? '').trim(),
        phone: String(form.get('phone') ?? '').trim(),
        email: String(form.get('email') ?? '').trim(),
        service: 'Group travel',
        message,
      })
      setSent(true)
    } catch (reason) {
      setError(reason instanceof ApiRequestError ? reason.message : 'Your group enquiry could not be sent.')
    } finally {
      setSending(false)
    }
  }

  return <PageFrame><main className="group-page">
    <section className="group-hero" style={{ backgroundImage: "linear-gradient(90deg,rgba(0,35,29,.9),rgba(0,35,29,.18)),url('/images/group-travel-hero.webp')" }}><div className="group-hero-copy"><span className="orange-kicker">Group travel</span><h1>Bring your people.<br /><em>We&apos;ll handle the rest.</em></h1><p>Planning a trip for 5 people is one thing. Planning one for 15, 25 or 50 is another. We coordinate the transport, accommodation, activities, meals and experiences so your group can focus on having fun.</p><div className="group-feature-row"><span><Users /> Custom itineraries</span><span><BriefcaseBusiness /> Group discounts</span><span><Headphones /> Dedicated support</span><span><Sparkles /> Unforgettable experiences</span></div></div></section>
    <section className="group-types"><div className="group-heading"><span className="orange-kicker">Travel together, create lasting memories</span><h2>Adventure is better together.</h2><p>Whether it&apos;s a weekend getaway, a special celebration or a corporate retreat, we&apos;ve got you covered.</p></div><div className="group-type-grid">{groupTypes.map(([title, text, image, Icon]) => <Link href="/plan" className="group-type-card" key={title as string}><SiteImage src={image as string} alt="" /><div className="group-type-body"><span className="group-icon"><Icon /></span><h3>{title as string}</h3><p>{text as string}</p><ArrowRight /></div></Link>)}</div><Link href="/plan" className="button dark-button group-plan">Plan a group adventure <ArrowRight /></Link></section>
    <section className="group-why"><div className="group-why-copy"><span className="orange-kicker">Why choose LinkUps?</span><h2>Make memories, not spreadsheets.</h2><p>From the first idea to the final goodbye, our team makes group travel simple, personal and stress-free.</p><div className="benefit-grid">{benefits.map(([title, text, Icon]) => <div key={title as string}><Icon /><strong>{title as string}</strong><small>{text as string}</small></div>)}</div></div><div className="group-enquiry"><h2>Plan your group adventure</h2><p>Tell us a little about your group and what you&apos;re looking for.</p>{sent ? <div className="success-box" role="status">Thanks — your group enquiry has been saved. We&apos;ll contact you using the details you provided.</div> : <form onSubmit={submit}>
      <input name="name" aria-label="Your name" placeholder="Your name *" required minLength={2} maxLength={150} autoComplete="name" />
      <input name="phone" aria-label="Phone or WhatsApp" placeholder="Phone / WhatsApp *" required minLength={5} maxLength={30} autoComplete="tel" />
      <input name="email" aria-label="Email address" type="email" placeholder="Email address *" required maxLength={190} autoComplete="email" />
      <select name="groupType" aria-label="Type of group" defaultValue="" required><option value="" disabled>Type of group *</option><option>Friends</option><option>Family</option><option>Corporate</option><option>Celebration</option><option>Other</option></select>
      <input name="destination" aria-label="Destination or preferred location" placeholder="Destination / preferred location *" required maxLength={150} />
      <input name="people" aria-label="Number of people" type="number" min={5} max={200} placeholder="Number of people *" required />
      <input name="travelDates" aria-label="Travel dates" placeholder="Travel dates *" required maxLength={120} />
      <textarea name="details" aria-label="Additional details" placeholder="What are you looking for? (optional)" maxLength={7000} />
      {error && <div className="error-box" role="alert">{error}</div>}
      <button className="button orange" type="submit" disabled={sending}>{sending ? 'Sending…' : <>Send enquiry <ArrowRight /></>}</button>
    </form>}<a href="https://wa.me/254726843677" className="group-whatsapp">Chat with us on WhatsApp</a></div></section>
    <section className="group-stories"><div className="group-heading"><span className="orange-kicker">Group travel stories</span><h2>Real people. Real adventures.</h2><p>Here&apos;s what our group travellers have to say.</p></div><div className="story-grid">{stories.map(([quote, name]) => <article key={name}><div className="story-avatar">{name[0]}</div><p>“{quote}”</p><strong>— {name}</strong><span>★★★★★</span></article>)}</div></section>
    <section className="group-contact-strip" style={{ backgroundImage: `linear-gradient(90deg,rgba(0,35,29,.9),rgba(0,35,29,.35)),url(${siteImages.group})` }}><h2>Your next group adventure<br /><em>is just a message away.</em></h2><div><strong>Chat with us on WhatsApp</strong><b>0726 843 677</b><span><Mail /> linkupsadventures@gmail.com</span></div></section>
  </main></PageFrame>
}
