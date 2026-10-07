'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowRight, CalendarDays, Check, ChevronDown, Compass, Globe2, MapPin, Menu, Search, Star, Users, X } from 'lucide-react'

const hero = 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=2000&q=85'
const destinationHero = 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=1600&q=85'
const images = {
  mara: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=900&q=85',
  beach: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=85',
  group: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=85',
  package: 'https://images.unsplash.com/photo-1549366021-9f761d450615?auto=format&fit=crop&w=900&q=85',
}

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
  return <header className="site-header"><a href="#top" className="brand" aria-label="Linkups Adventures home"><span>LinkUps</span><small>ADVENTURES</small></a><nav className={open ? 'nav open' : 'nav'}>{[['Home', '/'], ['Adventures', '/adventures'], ['Destinations', '/destinations'], ['Group Travel', '/group-travel'], ['About Us', '/about'], ['Blog', '/blog'], ['Contact', '/contact']].map(([item, href]) => <Link key={item} href={href} onClick={() => setOpen(false)}>{item}</Link>)}</nav><div className="header-actions"><Search aria-label="Search" /><a className="button orange" href="/plan">Plan My Adventure</a><button className="menu-button" aria-label="Toggle navigation" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button></div></header>
}

function SectionTitle({ eyebrow, title, light = false }: { eyebrow: string; title: string; light?: boolean }) { return <div className={`section-title ${light ? 'light' : ''}`}><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div> }

export default function Page() {
  return <div id="top"><Header /><main>
    <section className="hero" style={{ backgroundImage: `linear-gradient(90deg, rgba(1,44,37,.82), rgba(1,44,37,.05)), url(${hero})` }}><div className="hero-copy"><span className="eyebrow orange-text">Explore Kenya</span><h1>Your next adventure <em>starts here.</em></h1><p>Safaris, beach escapes, camping, road trips and group adventures made for real people.</p><div className="hero-buttons"><a className="button orange" href="/adventures">Explore adventures <ArrowRight /></a><a className="button outline-light" href="/plan">Plan my adventure</a></div></div></section>
    <section className="adventure-types"><SectionTitle eyebrow="What kind of adventure are you looking for?" title="Find your kind of wild" /><div className="type-grid">{[['Safari', images.mara], ['Beach Escapes', images.beach], ['Camping & Outdoors', images.mara], ['Road Trips', destinationHero], ['Group Escapes', images.group], ['Couples & Family', images.beach]].map(([name, image]) => <a className="type-card" href="/adventures" key={name}><img src={image} alt="" /><div><strong>{name}</strong><small>Explore experiences</small></div></a>)}</div><a className="button dark center" href="/adventures">Explore all adventures <ArrowRight /></a></section>
    <section id="destinations" className="destinations"><div className="section-row"><SectionTitle eyebrow="Our destinations" title="Discover Kenya's best places" /><Link href="/destinations" className="text-link">View all destinations <ArrowRight /></Link></div><div className="destination-grid">{destinations.map(([name, detail, image]) => <a className="destination-card" href="/plan" key={name} style={{ backgroundImage: `linear-gradient(0deg, rgba(0,33,28,.82), transparent 65%), url(${image})` }}><div><h3>{name}</h3><p>{detail}</p><span>Explore <ArrowRight /></span></div></a>)}</div></section>
    <section id="adventures" className="experience"><div className="experience-copy"><SectionTitle eyebrow="More than a trip" title="It's a Linkups experience." /><p>We believe the best adventures are not just about where you go. They're about who you're with, what you experience and the stories you bring home.</p><a className="button dark" href="/plan">Why Linkups? <ArrowRight /></a></div><div className="experience-photo" style={{ backgroundImage: `url(${images.group})` }}><strong>Real people.<br />Real adventures.</strong></div></section>
    <section className="packages"><div className="section-row"><SectionTitle eyebrow="Featured adventures" title="Handpicked experiences" /><a href="/plan" className="text-link">View all packages <ArrowRight /></a></div><div className="package-grid">{[['Maasai Mara Villa Escape', 'From KES 24,800 pp', images.package], ['Mombasa Beach Escape', 'From KES 12,800 pp', images.beach], ['Naivasha Adventure', 'From KES 5,500 pp', images.beach], ['Samburu Overland', 'From KES 16,000 pp', images.mara]].map(([name, price, image]) => <article className="package-card" key={name}><img src={image} alt="" /><div className="package-body"><small>3 Days · 2 Nights</small><h3>{name}</h3><strong>{price}</strong><a className="button orange small" href="/plan">View package <ArrowRight /></a></div></article>)}</div></section>
    <section className="custom-trip" id="contact" style={{ backgroundImage: `linear-gradient(90deg, rgba(0,44,36,.92), rgba(0,44,36,.45)), url(${destinationHero})` }}><div><SectionTitle light eyebrow="Can't find exactly what you want?" title="Plan your custom trip" /><p>Tell us where you want to go, who you're travelling with, your dates and your budget. We'll build the experience around you.</p><a className="button orange" href="mailto:linkupsadventures@gmail.com">Start planning <ArrowRight /></a></div><div className="benefits">{['Custom itineraries', 'Group & family trips', 'Flexible budgets', 'Dedicated support'].map((item) => <span key={item}><Check /> {item}</span>)}</div></section>
    <section className="trust"><div><Star /><strong>Trusted by adventurers</strong><p>Thoughtful planning, local expertise and memories that last.</p></div><div><Users /><strong>For every traveller</strong><p>Solo explorers, couples, families, friends and teams.</p></div><div><Compass /><strong>Kenya, your way</strong><p>From savannahs to coastlines, discover more with Linkups.</p></div></section>
  </main><footer><div className="footer-main"><div><Link href="/" className="footer-brand">LinkUps <small>ADVENTURES</small></Link><p>Where fun meets adventures.</p></div><div><strong>Explore</strong><Link href="/adventures">Adventures</Link><Link href="/destinations">Destinations</Link><Link href="/group-travel">Group Travel</Link><Link href="/about">About Us</Link></div><div><strong>Contact</strong><a href="tel:0726843677">0726 843 677</a><a href="mailto:linkupsadventures@gmail.com">linkupsadventures@gmail.com</a><Link href="/contact">@LinkupsAdventures</Link></div><div><strong>Follow us</strong><div className="socials"><Globe2 /><Star /><Compass /></div></div><div><strong>Payments</strong><p>M-Pesa Till<br /><b>5139557</b></p></div></div><div className="footer-bottom"><span>© 2026 Linkups Adventures. All rights reserved.</span><span>Terms & Conditions　 Cancellation Policy　 Privacy Policy</span></div></footer></div>
}

export { CalendarDays, MapPin, ChevronDown }
