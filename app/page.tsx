'use client'

import { useState } from 'react'
import { ArrowRight, CalendarDays, Check, ChevronDown, Compass, Globe2, MapPin, Menu, Search, Star, Users, X } from 'lucide-react'

const logo = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-10-07%20at%2015.10.42-gDNkbyG07O4lpIJaPYZ9PVhgybo0Jj.jpeg'
const hero = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-10-07%20at%2015.17.27-Rr6eGOQM1vDIJHbGMlCFShQjg2dP2C.jpeg'
const destinationHero = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-10-07%20at%2015.17.28-kBRS1JVBEcXxMemBUnN16ZMzufhSN1.jpeg'
const images = {
  mara: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-10-07%20at%2015.17.28-kBRS1JVBEcXxMemBUnN16ZMzufhSN1.jpeg',
  beach: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-10-07%20at%2015.17.29%20%281%29-c0FOMtGEKYpDt1JldqOjP9IgTSy4Op.jpeg',
  group: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-10-07%20at%2015.17.29-nxp7xTqHJkdm9TEyyKgD08MHkZZXxt.jpeg',
  package: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-10-07%20at%2015.17.30.jpeg-KwbzP2owlt9h3KTd1tjEyYAerCZxVb.jpeg',
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
  return <header className="site-header"><a href="#top" className="brand"><img src={logo} alt="Linkups Adventures" /></a><nav className={open ? 'nav open' : 'nav'}>{['Home', 'Adventures', 'Destinations', 'Group Travel', 'About Us', 'Blog', 'Contact'].map((item) => <a key={item} href={`#${item.toLowerCase().replaceAll(' ', '-')}`} onClick={() => setOpen(false)}>{item}</a>)}</nav><div className="header-actions"><Search aria-label="Search" /><a className="button orange" href="#contact">Plan My Adventure</a><button className="menu-button" aria-label="Toggle navigation" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button></div></header>
}

function SectionTitle({ eyebrow, title, light = false }: { eyebrow: string; title: string; light?: boolean }) { return <div className={`section-title ${light ? 'light' : ''}`}><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div> }

export default function Page() {
  return <div id="top"><Header /><main>
    <section className="hero" style={{ backgroundImage: `linear-gradient(90deg, rgba(1,44,37,.82), rgba(1,44,37,.05)), url(${hero})` }}><div className="hero-copy"><span className="eyebrow orange-text">Explore Kenya</span><h1>Your next adventure <em>starts here.</em></h1><p>Safaris, beach escapes, camping, road trips and group adventures made for real people.</p><div className="hero-buttons"><a className="button orange" href="#adventures">Explore adventures <ArrowRight /></a><a className="button outline-light" href="#contact">Plan my adventure</a></div></div></section>
    <section className="adventure-types"><SectionTitle eyebrow="What kind of adventure are you looking for?" title="Find your kind of wild" /><div className="type-grid">{[['Safari', images.mara], ['Beach Escapes', images.beach], ['Camping & Outdoors', images.mara], ['Road Trips', destinationHero], ['Group Escapes', images.group], ['Couples & Family', images.beach]].map(([name, image]) => <a className="type-card" href="#adventures" key={name}><img src={image} alt="" /><div><strong>{name}</strong><small>Explore experiences</small></div></a>)}</div><a className="button dark center" href="#adventures">Explore all adventures <ArrowRight /></a></section>
    <section id="destinations" className="destinations"><div className="section-row"><SectionTitle eyebrow="Our destinations" title="Discover Kenya's best places" /><a href="#destinations" className="text-link">View all destinations <ArrowRight /></a></div><div className="destination-grid">{destinations.map(([name, detail, image]) => <a className="destination-card" href="#contact" key={name} style={{ backgroundImage: `linear-gradient(0deg, rgba(0,33,28,.82), transparent 65%), url(${image})` }}><div><h3>{name}</h3><p>{detail}</p><span>Explore <ArrowRight /></span></div></a>)}</div></section>
    <section id="adventures" className="experience"><div className="experience-copy"><SectionTitle eyebrow="More than a trip" title="It's a Linkups experience." /><p>We believe the best adventures are not just about where you go. They're about who you're with, what you experience and the stories you bring home.</p><a className="button dark" href="#contact">Why Linkups? <ArrowRight /></a></div><div className="experience-photo" style={{ backgroundImage: `url(${images.group})` }}><strong>Real people.<br />Real adventures.</strong></div></section>
    <section className="packages"><div className="section-row"><SectionTitle eyebrow="Featured adventures" title="Handpicked experiences" /><a href="#contact" className="text-link">View all packages <ArrowRight /></a></div><div className="package-grid">{[['Maasai Mara Villa Escape', 'From KES 24,800 pp', images.package], ['Mombasa Beach Escape', 'From KES 12,800 pp', images.beach], ['Naivasha Adventure', 'From KES 5,500 pp', images.beach], ['Samburu Overland', 'From KES 16,000 pp', images.mara]].map(([name, price, image]) => <article className="package-card" key={name}><img src={image} alt="" /><div className="package-body"><small>3 Days · 2 Nights</small><h3>{name}</h3><strong>{price}</strong><a className="button orange small" href="#contact">View package <ArrowRight /></a></div></article>)}</div></section>
    <section className="custom-trip" id="contact" style={{ backgroundImage: `linear-gradient(90deg, rgba(0,44,36,.92), rgba(0,44,36,.45)), url(${destinationHero})` }}><div><SectionTitle light eyebrow="Can't find exactly what you want?" title="Plan your custom trip" /><p>Tell us where you want to go, who you're travelling with, your dates and your budget. We'll build the experience around you.</p><a className="button orange" href="mailto:linkupsadventures@gmail.com">Start planning <ArrowRight /></a></div><div className="benefits">{['Custom itineraries', 'Group & family trips', 'Flexible budgets', 'Dedicated support'].map((item) => <span key={item}><Check /> {item}</span>)}</div></section>
    <section className="trust"><div><Star /><strong>Trusted by adventurers</strong><p>Thoughtful planning, local expertise and memories that last.</p></div><div><Users /><strong>For every traveller</strong><p>Solo explorers, couples, families, friends and teams.</p></div><div><Compass /><strong>Kenya, your way</strong><p>From savannahs to coastlines, discover more with Linkups.</p></div></section>
  </main><footer><div className="footer-main"><div><img src={logo} alt="Linkups Adventures" /><p>Where fun meets adventures.</p></div><div><strong>Explore</strong><a href="#adventures">Adventures</a><a href="#destinations">Destinations</a><a href="#contact">Group Travel</a><a href="#contact">About Us</a></div><div><strong>Contact</strong><a href="tel:0726843677">0726 843 677</a><a href="mailto:linkupsadventures@gmail.com">linkupsadventures@gmail.com</a><a href="#contact">@LinkupsAdventures</a></div><div><strong>Follow us</strong><div className="socials"><Globe2 /><Star /><Compass /></div></div><div><strong>Payments</strong><p>M-Pesa Till<br /><b>5139557</b></p></div></div><div className="footer-bottom"><span>© 2026 Linkups Adventures. All rights reserved.</span><span>Terms & Conditions　 Cancellation Policy　 Privacy Policy</span></div></footer></div>
}

export { CalendarDays, MapPin, ChevronDown }
