'use client'

import { Link } from 'wouter'
import { ArrowRight, CalendarDays, Compass, Home, MapPin, UserRound } from 'lucide-react'
import { useGetAuthSession } from '@workspace/api-client-react'
import { useLocation } from 'wouter'
import { optimizedImageUrl, SiteImage } from '@/components/site-image'

export const siteImages = {
  mara: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1100&q=70',
  coast: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1100&q=70',
  group: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1100&q=70',
  mountain: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=1100&q=70',
  camp: 'https://images.unsplash.com/photo-1504851149312-7a075b496cc7?auto=format&fit=crop&w=1100&q=70',
}

type LogoProps = {
  light?: boolean
  className?: string
  'data-testid'?: string
}

export function Logo({ light = false, className = '', 'data-testid': testId }: LogoProps) {
  return <Link href="/" className={`brand logo-mark ${className}`.trim()} style={light ? { color: '#fff' } : undefined} aria-label="LinkUps Adventures home" data-testid={testId}><SiteImage src="/images/linkups-logo.png" alt="LinkUps Adventures" loading="eager" /></Link>
}

export function SiteHeader() {
  const links = [['Adventures', '/adventures'], ['Destinations', '/destinations'], ['Upcoming Trips', '/upcoming-trips'], ['Compare Trips', '/compare'], ['Travel Guide', '/travel-guide'], ['Group Travel', '/group-travel'], ['About Us', '/about'], ['Blog', '/blog'], ['Contact', '/contact']]
  return (
    <header className="site-header">
      <Logo />
      <nav className="nav" aria-label="Main navigation">
        {links.map(([label, href]) => (
          <Link href={href} key={href}>{label}</Link>
        ))}
      </nav>
      <div className="header-actions">
        <Link className="button orange" href="/plan">
          Plan My Adventure <ArrowRight />
        </Link>
      </div>
    </header>
  )
}

export function MobileBottomNav() {
  const [location] = useLocation()
  const session = useGetAuthSession()
  const accountHref = session.data?.authenticated
    ? session.data.role === 'admin'
      ? '/admin'
      : '/dashboard'
    : '/login'
  const tabs = [
    { label: 'Home', href: '/', Icon: Home },
    { label: 'Adventures', href: '/adventures', Icon: Compass },
    { label: 'Places', href: '/destinations', Icon: MapPin },
    { label: 'Plan', href: '/plan', Icon: CalendarDays },
    { label: 'My account', href: accountHref, Icon: UserRound },
  ]

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
      {tabs.map(({ label, href, Icon }) => {
        const isActive = href === '/'
          ? location === '/'
          : location === href || location.startsWith(`${href}/`)

        return (
          <Link
            className={isActive ? 'mobile-tab active' : 'mobile-tab'}
            href={href}
            key={label}
            aria-label={label}
            aria-current={isActive ? 'page' : undefined}
            data-testid={`mobile-nav-${label.toLowerCase().replaceAll(' ', '-')}`}
          >
            <Icon aria-hidden="true" />
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

export function SiteFooter() {
  return <footer><div className="footer-main"><div><Logo light /><p>Where fun meets adventures.</p></div><div><strong>Explore</strong><Link href="/adventures">Adventures</Link><Link href="/destinations">Destinations</Link><Link href="/group-travel">Group Travel</Link><Link href="/blog">Blog</Link></div><div><strong>Contact</strong><a href="tel:0726843677">0726 843 677</a><a href="mailto:linkupsadventures@gmail.com">linkupsadventures@gmail.com</a><Link href="/contact">Send an enquiry</Link></div><div><strong>Your LinkUps</strong><Link href="/login">Sign in</Link><Link href="/register">Create an account</Link></div><div><strong>Policies</strong><Link href="/terms">Terms &amp; Conditions</Link><Link href="/cancellation-policy">Cancellation Policy</Link><Link href="/privacy-policy">Privacy Policy</Link></div><div><strong>Payments</strong><p>M-Pesa Till<br /><b>5139557</b></p></div></div><div className="footer-bottom"><span>© 2026 Linkups Adventures. All rights reserved.</span><span>LinkUps Adventures · Kenya</span></div></footer>
}

import { ConversionTools } from './conversion-tools'

export function PageFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="site-frame">
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
      <ConversionTools />
    </div>
  )
}

export function Hero({ eyebrow, title, description, image }: { eyebrow: string; title: React.ReactNode; description: string; image: string }) {
  return <section className="hero" style={{ backgroundImage: `linear-gradient(90deg, rgba(1,44,37,.86), rgba(1,44,37,.14)), url(${optimizedImageUrl(image)})` }}><div className="hero-copy"><span className="eyebrow orange-text">{eyebrow}</span><h1>{title}</h1><p>{description}</p><Link className="button orange" href="/plan">Plan my adventure <ArrowRight /></Link></div></section>
}

export function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) { return <div className="section-title"><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div> }

export function TourCard({ slug, name, price, image, detail }: { slug: string; name: string; price: string; image: string; detail: string }) {
  return <article className="package-card"><SiteImage src={image} alt={name} /><div className="package-body"><small>{detail}</small><h3>{name}</h3><strong>{price}</strong><Link className="button orange small" href={`/adventures/${slug}`}>View package <ArrowRight /></Link></div></article>
}

export const tours = [
  { slug: 'maasai-mara-villa-escape', name: 'Maasai Mara Villa Escape', price: 'From KES 24,800 pp', detail: '3 Days · 2 Nights', image: siteImages.mara },
  { slug: 'mombasa-beach-escape', name: 'Mombasa Beach Escape', price: 'From KES 12,800 pp', detail: '3 Days · 2 Nights', image: siteImages.coast },
  { slug: 'naivasha-adventure', name: 'Naivasha Adventure', price: 'From KES 5,500 pp', detail: '1 Day', image: siteImages.mountain },
  { slug: 'samburu-overland', name: 'Samburu Overland', price: 'From KES 16,000 pp', detail: '2 Days · 1 Night', image: siteImages.mara },
  { slug: 'girls-adventure-escape', name: "Girls' Adventure Escape", price: 'From KES 12,400 pp', detail: '3 Days · 2 Nights', image: siteImages.group },
]

export function TourGrid() { return <div className="package-grid">{tours.map((tour) => <TourCard key={tour.slug} {...tour} />)}</div> }
