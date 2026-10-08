'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Menu, X, ArrowRight } from 'lucide-react'

export const siteImages = {
  mara: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1400&q=85',
  coast: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=85',
  group: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1400&q=85',
  mountain: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=1400&q=85',
  camp: 'https://images.unsplash.com/photo-1504851149312-7a075b496cc7?auto=format&fit=crop&w=1400&q=85',
}

export function Logo({ light = false }: { light?: boolean }) {
  return <Link href="/" className="brand" style={light ? { color: '#fff' } : undefined}><span>LinkUps</span><small>ADVENTURES</small></Link>
}

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const [signedIn, setSignedIn] = useState(false)
  useEffect(() => { setSignedIn(document.cookie.includes('linkups_session=active')) }, [])
  const links = [['Adventures', '/adventures'], ['Destinations', '/destinations'], ['Upcoming Trips', '/upcoming-trips'], ['Group Travel', '/group-travel'], ['About Us', '/about'], ['Blog', '/blog'], ['Contact', '/contact']]
  function signOut() { document.cookie = 'linkups_session=; Max-Age=0; Path=/'; setSignedIn(false) }
  return <header className="site-header"><Logo /><nav className={open ? 'nav open' : 'nav'}>{links.map(([label, href]) => <Link href={href} key={href} onClick={() => setOpen(false)}>{label}</Link>)}</nav><div className="header-actions">{signedIn ? <button className="header-account header-button" onClick={signOut}>Sign out</button> : <><Link className="header-account" href="/login">Sign in</Link><Link className="header-account" href="/register">Register</Link></>}<Link className="button orange" href="/plan">Plan My Adventure <ArrowRight /></Link><button className="menu-button" aria-label="Toggle navigation" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button></div></header>
}

export function SiteFooter() {
  return <footer><div className="footer-main"><div><Logo light /><p>Where fun meets adventures.</p></div><div><strong>Explore</strong><Link href="/adventures">Adventures</Link><Link href="/destinations">Destinations</Link><Link href="/group-travel">Group Travel</Link><Link href="/blog">Blog</Link></div><div><strong>Contact</strong><a href="tel:0726843677">0726 843 677</a><a href="mailto:linkupsadventures@gmail.com">linkupsadventures@gmail.com</a><Link href="/contact">Send an enquiry</Link></div><div><strong>Account</strong><Link href="/login">Sign in</Link><Link href="/register">Create account</Link><Link href="/admin">Admin portal</Link></div><div><strong>Payments</strong><p>M-Pesa Till<br /><b>5139557</b></p></div></div><div className="footer-bottom"><span>© 2026 Linkups Adventures. All rights reserved.</span><span>Terms & Conditions · Cancellation Policy · Privacy Policy</span></div></footer>
}

import { ConversionTools } from './conversion-tools'

export function PageFrame({ children }: { children: React.ReactNode }) { return <><SiteHeader /><main>{children}</main><SiteFooter /><ConversionTools /></> }

export function Hero({ eyebrow, title, description, image }: { eyebrow: string; title: React.ReactNode; description: string; image: string }) {
  return <section className="hero" style={{ backgroundImage: `linear-gradient(90deg, rgba(1,44,37,.86), rgba(1,44,37,.14)), url(${image})` }}><div className="hero-copy"><span className="eyebrow orange-text">{eyebrow}</span><h1>{title}</h1><p>{description}</p><Link className="button orange" href="/plan">Plan my adventure <ArrowRight /></Link></div></section>
}

export function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) { return <div className="section-title"><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div> }

export function TourCard({ slug, name, price, image, detail }: { slug: string; name: string; price: string; image: string; detail: string }) {
  return <article className="package-card"><img src={image} alt={name} /><div className="package-body"><small>{detail}</small><h3>{name}</h3><strong>{price}</strong><Link className="button orange small" href={`/adventures/${slug}`}>View package <ArrowRight /></Link></div></article>
}

export const tours = [
  { slug: 'maasai-mara-villa-escape', name: 'Maasai Mara Villa Escape', price: 'From KES 24,800 pp', detail: '3 Days · 2 Nights', image: siteImages.mara },
  { slug: 'mombasa-beach-escape', name: 'Mombasa Beach Escape', price: 'From KES 12,800 pp', detail: '3 Days · 2 Nights', image: siteImages.coast },
  { slug: 'naivasha-adventure', name: 'Naivasha Adventure', price: 'From KES 5,500 pp', detail: '1 Day', image: siteImages.mountain },
  { slug: 'samburu-overland', name: 'Samburu Overland', price: 'From KES 16,000 pp', detail: '2 Days · 1 Night', image: siteImages.mara },
  { slug: 'girls-adventure-escape', name: "Girls' Adventure Escape", price: 'From KES 12,400 pp', detail: '3 Days · 2 Nights', image: siteImages.group },
]

export function TourGrid() { return <div className="package-grid">{tours.map((tour) => <TourCard key={tour.slug} {...tour} />)}</div> }
