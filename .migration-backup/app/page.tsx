'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight, CalendarDays, Check, ChevronDown, Compass, Globe2, MapPin, Menu, Search, Star, Users, X } from 'lucide-react'
import { AdventureQuiz } from '@/components/conversion-tools'
import { ReviewsMedia } from '@/components/reviews-media'

const hero = '/images/group-travel-hero.png'
const destinationHero = '/images/adventure-mountain.png'
const images = {
  mara: '/images/adventure-hero.png',
  beach: '/images/adventure-coast.png',
  group: '/images/group-travel-hero.png',
  package: '/images/adventure-camp.png',
  mountain: '/images/adventure-mountain.png',
  contact: '/images/contact-hero.png',
}

const vibes = [['Thrill Seeker', 'Rafting · Hiking · Action', 'https://images.unsplash.com/photo-1530789253388-582c481c54b0?auto=format&fit=crop&w=500&q=85'], ['Beach Baby', 'Sun · Sand · Slow days', images.beach], ['Wild at Heart', 'Camping · Wildlife · Exploring', images.mara], ['Good Times Only', 'Friends · Laughs · Memories', images.group], ['Wildlife', 'Safari · Conservation · Nature', destinationHero], ['Family Time', 'Easy pace · Shared moments', images.group]]

const destinations = [
  ['Maasai Mara', 'Wildlife · Game Drives · Luxury Stays', images.mara],
  ['Amboseli', 'Elephants · Kilimanjaro Views · Culture', destinationHero],
  ['Samburu', 'Unique Wildlife · River Activities · Culture', images.mara],
  ['Naivasha', "Boat Rides · Hell's Gate · Hot Springs", images.beach],
  ['Mombasa', 'Beaches · Water Sports · Nightlife', images.beach],
  ['Watamu', 'Snorkeling · Marine Life · Relaxation', images.beach],
  ['Malindi', 'Sand Dunes · Island Vibes', images.mara],
  ['Nanyuki', 'Mount Kenya · Hiking · Nature', destinationHero],
]

function Header() {
  const [open, setOpen] = useState(false)
  const [signedIn, setSignedIn] = useState(false)
  useEffect(() => { setSignedIn(document.cookie.includes('linkups_session=active')) }, [])
  function signOut() { document.cookie = 'linkups_session=; Max-Age=0; Path=/'; setSignedIn(false) }
  return <header className="site-header"><a href="#top" className="brand" aria-label="Linkups Adventures home"><span>LinkUps</span><small>ADVENTURES</small></a><nav className={open ? 'nav open' : 'nav'}>{[['Home', '/'], ['Adventures', '/adventures'], ['Destinations', '/destinations'], ['Group Travel', '/group-travel'], ['About Us', '/about'], ['Blog', '/blog'], ['Contact', '/contact']].map(([item, href]) => <Link key={item} href={href} onClick={() => setOpen(false)}>{item}</Link>)}</nav><div className="header-actions"><Search aria-label="Search" />{signedIn ? <button className="header-account header-button" onClick={signOut}>Sign out</button> : <><Link className="header-account" href="/login">Sign in</Link><Link className="header-account" href="/register">Register</Link></>}<a className="button orange" href="/plan">Plan My Adventure</a><button className="menu-button" aria-label="Toggle navigation" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button></div></header>
}

function SectionTitle({ eyebrow, title, light = false }: { eyebrow: string; title: string; light?: boolean }) { return <div className={`section-title ${light ? 'light' : ''}`}><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div> }

export default function Page() {
  return <div id="top"><Header /><main>
    <section className="hero" style={{ backgroundImage: `linear-gradient(90deg, rgba(1,44,37,.82), rgba(1,44,37,.05)), url(${hero})` }}><div className="hero-copy"><span className="eyebrow orange-text">Explore Kenya</span><h1>Your next adventure <em>starts here.</em></h1><p>Safaris, beach escapes, camping, road trips and group adventures made for real people.</p><div className="hero-buttons"><a className="button orange" href="/adventures">Explore adventures <ArrowRight /></a><a className="button outline-light" href="/plan">Plan my adventure</a></div></div></section>
    <section className="adventure-types"><SectionTitle eyebrow="What kind of adventure are you looking for?" title="Find your kind of wild" /><div className="type-grid">{[['Safari', images.mara], ['Beach Escapes', images.beach], ['Camping & Outdoors', images.package], ['Road Trips', images.contact], ['Group Escapes', images.group], ['Couples & Family', images.beach]].map(([name, image]) => <a className="type-card" href="/adventures" key={name}><img src={image} alt="" /><div><strong>{name}</strong><small>Explore experiences</small></div></a>)}</div><a className="button dark center" href="/adventures">Explore all adventures <ArrowRight /></a></section>
    <section id="destinations" className="destinations"><div className="section-row"><SectionTitle eyebrow="Our destinations" title="Discover Kenya's best places" /><Link href="/destinations" className="text-link">View all destinations <ArrowRight /></Link></div><div className="destination-grid">{destinations.map(([name, detail, image]) => <Link className="destination-card" href={`/destinations/${name.toLowerCase().replaceAll(' ', '-')}`} key={name} style={{ backgroundImage: `linear-gradient(0deg, rgba(0,33,28,.82), transparent 65%), url(${image})` }}><div><h3>{name}</h3><p>{detail}</p><span>Explore <ArrowRight /></span></div></Link>)}</div></section>
    <section id="adventures" className="experience"><div className="experience-copy"><SectionTitle eyebrow="More than a trip" title="It's a Linkups experience." /><p>We believe the best adventures are not just about where you go. They're about who you're with, what you experience and the stories you bring home.</p><a className="button dark" href="/plan">Why Linkups? <ArrowRight /></a></div><div className="experience-photo" style={{ backgroundImage: `url(${images.group})` }}><strong>Real people.<br />Real adventures.</strong></div></section>
    <section className="packages"><div className="section-row"><SectionTitle eyebrow="Featured adventures" title="Handpicked experiences" /><a href="/plan" className="text-link">View all packages <ArrowRight /></a></div><div className="package-grid">{[['Maasai Mara Villa Escape', 'From KES 24,800 pp', images.package], ['Mombasa Beach Escape', 'From KES 12,800 pp', images.beach], ['Naivasha Adventure', 'From KES 5,500 pp', images.contact], ['Samburu Overland', 'From KES 16,000 pp', images.mountain], ['Wild Hearts Escape', 'From KES 24,400 pp', images.mara], ['Girls’ Adventure Escape', 'From KES 12,400 pp', images.group]].map(([name, price, image]) => <article className="package-card" key={name}><img src={image} alt="" /><div className="package-body"><small>3 Days · 2 Nights</small><h3>{name}</h3><strong>{price}</strong><a className="button orange small" href="/plan">View package <ArrowRight /></a></div></article>)}</div></section>
    <section className="vibe-section"><div className="section-row"><SectionTitle eyebrow="What's your adventure vibe?" title="Find your kind of fun" /><Link href="/compare" className="text-link">Find my adventure <ArrowRight /></Link></div><p className="vibe-intro">Tell us how you want to feel. We&apos;ll help you find where to go.</p><div className="vibe-grid">{vibes.map(([name, detail, image]) => <Link href="/adventures" className="vibe-card" key={name}><img src={image} alt={name} /><strong>{name}</strong><small>{detail}</small></Link>)}</div><Link className="button dark center" href="/?quiz=1">Find my adventure <ArrowRight /></Link></section>
    <section className="upcoming-home"><div className="section-row"><SectionTitle eyebrow="Upcoming trips" title="Your next story is waiting" /><Link href="/upcoming-trips" className="text-link">See all upcoming trips <ArrowRight /></Link></div><div className="upcoming-home-grid">{[['Samburu Overland','12–15 Oct 2026','From KES 16,000',images.mara],['Mombasa Escape','23–25 Oct 2026','From KES 12,800',images.beach],['Naivasha Adventure','06 Nov 2026','From KES 5,500',images.beach],['Maasai Mara Escape','18–21 Nov 2026','From KES 24,800',images.mara]].map(([name,date,price,image]) => <article className="upcoming-home-card" key={name}><img src={image} alt={name} /><div><h3>{name}</h3><small>{date}</small><strong>{price}</strong><Link href={`/plan?trip=${encodeURIComponent(name)}`} className="button orange small">Join this trip <ArrowRight /></Link></div></article>)}</div></section>
    <section className="custom-trip" id="contact" style={{ backgroundImage: `linear-gradient(90deg, rgba(0,44,36,.92), rgba(0,44,36,.45)), url(${destinationHero})` }}><div><SectionTitle light eyebrow="Can't find exactly what you want?" title="Plan your custom trip" /><p>Tell us where you want to go, who you're travelling with, your dates and your budget. We'll build the experience around you.</p><a className="button orange" href="mailto:linkupsadventures@gmail.com">Start planning <ArrowRight /></a></div><div className="benefits">{['Custom itineraries', 'Group & family trips', 'Flexible budgets', 'Dedicated support'].map((item) => <span key={item}><Check /> {item}</span>)}</div></section>
    <AdventureQuiz /><ReviewsMedia /><section className="trust"><div><Star /><strong>Trusted by adventurers</strong><p>Thoughtful planning, local expertise and memories that last.</p></div><div><Users /><strong>For every traveller</strong><p>Solo explorers, couples, families, friends and teams.</p></div><div><Compass /><strong>Kenya, your way</strong><p>From savannahs to coastlines, discover more with Linkups.</p></div></section>
  </main><footer><div className="footer-main"><div><Link href="/" className="footer-brand">LinkUps <small>ADVENTURES</small></Link><p>Where fun meets adventures.</p></div><div><strong>Explore</strong><Link href="/adventures">Adventures</Link><Link href="/destinations">Destinations</Link><Link href="/group-travel">Group Travel</Link><Link href="/about">About Us</Link></div><div><strong>Contact</strong><a href="tel:0726843677">0726 843 677</a><a href="mailto:linkupsadventures@gmail.com">linkupsadventures@gmail.com</a><Link href="/contact">@LinkupsAdventures</Link></div><div><strong>Follow us</strong><div className="socials"><Globe2 /><Star /><Compass /></div></div><div><strong>Payments</strong><p>M-Pesa Till<br /><b>5139557</b></p></div></div><div className="footer-bottom"><span>© 2026 Linkups Adventures. All rights reserved.</span><span>Terms & Conditions　 Cancellation Policy　 Privacy Policy</span></div></footer></div>
}

export { CalendarDays, MapPin, ChevronDown }
