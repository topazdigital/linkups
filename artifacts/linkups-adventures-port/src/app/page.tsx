'use client'

import { Link } from 'wouter'
import { useEffect, useState, type ReactNode } from 'react'
import { ArrowRight, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, Compass, Globe2, MapPin, Menu, Pause, Play, Star, Users, X } from 'lucide-react'
import { AdventureCards } from '@/components/adventure-cards'
import { AdventureTypeCarousel } from '@/components/adventure-type-carousel'
import { Logo } from '@/components/site-shell'
import { EventCarousel } from '@/components/event-carousel'
import { AdventureQuiz, FloatingWhatsAppButton } from '@/components/conversion-tools'
import { ReviewsMedia } from '@/components/reviews-media'
import { getGetPublicSiteContentQueryKey, useGetPublicSiteContent } from '@workspace/api-client-react'
import { optimizedImageUrl, SiteImage } from '@/components/site-image'
import { resolveSiteImage } from '@/lib/site-image-catalog'

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

const vibes = [['Thrill Seeker', 'Rafting · Hiking · Action', '/images/trips/rapids-and-rush.jpg'], ['Beach Baby', 'Sun · Sand · Slow days', images.beach], ['Wild at Heart', 'Camping · Wildlife · Exploring', images.mara], ['Good Times Only', 'Friends · Laughs · Memories', images.group], ['Wildlife', 'Safari · Conservation · Nature', destinationHero], ['Family Time', 'Easy pace · Shared moments', images.group]]
const adventureTypes = [
  { name: 'Safari', image: images.mara },
  { name: 'Beach Escapes', image: images.beach },
  { name: 'Camping & Outdoors', image: images.package },
  { name: 'Road Trips', image: images.contact },
  { name: 'Group Escapes', image: images.group },
  { name: 'Couples & Family', image: images.beach },
]

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
  const [menuOpen, setMenuOpen] = useState(false)
  const links = [['Home', '/'], ['Adventures', '/adventures'], ['Destinations', '/destinations'], ['Group Travel', '/group-travel'], ['About Us', '/about'], ['Blog', '/blog'], ['Contact', '/contact']]

  return <header className="site-header">
    <Logo data-testid="link-home-brand" />
    <nav id="home-navigation" className={menuOpen ? 'nav open' : 'nav'} aria-label="Main navigation">
      {links.map(([item, href]) => <Link className={['/', '/adventures', '/destinations'].includes(href) ? 'bottom-nav-link' : undefined} key={item} href={href} onClick={() => setMenuOpen(false)} data-testid={`link-home-nav-${item.toLowerCase().replaceAll(' ', '-')}`}>{item}</Link>)}
    </nav>
    <button type="button" className="menu menu-button" aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={menuOpen} aria-controls="home-navigation" onClick={() => setMenuOpen((open) => !open)}>
      {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
    </button>
    <div className="header-actions">
      <Link className="button orange" data-testid="link-home-plan" href="/plan">Plan My Adventure</Link>
    </div>
  </header>
}

function SectionTitle({ eyebrow, title, light = false }: { eyebrow: string; title: string; light?: boolean }) { return <div className={`section-title ${light ? 'light' : ''}`}><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div> }

function HomeHero({ images: heroImages, mode, title, description, accentImage }: { images: string[]; mode: 'static' | 'slideshow'; title: ReactNode; description: string; accentImage: string }) {
  const slides = heroImages.length ? heroImages : [hero]
  const [activeIndex, setActiveIndex] = useState(0)
  const [interactionPaused, setInteractionPaused] = useState(false)
  const [manualPaused, setManualPaused] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const isSlideshow = mode === 'slideshow' && slides.length > 1
  const safeIndex = activeIndex % slides.length

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => setReducedMotion(preference.matches)
    updatePreference()
    preference.addEventListener('change', updatePreference)
    return () => preference.removeEventListener('change', updatePreference)
  }, [])

  useEffect(() => {
    if (!isSlideshow || interactionPaused || manualPaused || reducedMotion) return
    const timer = window.setInterval(() => setActiveIndex((index) => (index + 1) % slides.length), 6000)
    return () => window.clearInterval(timer)
  }, [interactionPaused, isSlideshow, manualPaused, reducedMotion, slides.length])

  function moveSlide(offset: number) {
    setActiveIndex((index) => (index + offset + slides.length) % slides.length)
  }

  return (
    <div className="home-hero-stage">
      <section
        className="hero home-hero"
        data-testid="section-home-hero"
        role={isSlideshow ? 'group' : undefined}
        aria-label={isSlideshow ? 'Homepage hero slideshow' : undefined}
        aria-roledescription={isSlideshow ? 'carousel' : undefined}
        onMouseEnter={() => setInteractionPaused(true)}
        onMouseLeave={() => setInteractionPaused(false)}
        onFocus={() => setInteractionPaused(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setInteractionPaused(false)
        }}
      >
        {slides.map((image, index) => (
          <div
            aria-hidden="true"
            className={`home-hero-background ${index === safeIndex ? 'active' : ''}`}
            key={`${image}-${index}`}
          ><SiteImage src={image} alt="" loading={index === safeIndex ? 'eager' : 'lazy'} fetchPriority={index === safeIndex ? 'high' : 'auto'} /></div>
        ))}
        <div className="home-hero-shade" aria-hidden="true" />
        <img
          className="home-hero-popout"
          src={optimizedImageUrl(accentImage)}
          alt=""
          aria-hidden="true"
          loading="eager"
          fetchPriority="high"
          draggable={false}
          data-testid="img-home-hero-popout"
        />
        <div className="hero-copy">
          <span className="eyebrow orange-text">Explore Kenya</span>
          <h1 data-testid="text-home-hero-title">{title}</h1>
          <p data-testid="text-home-hero-subtitle">{description}</p>
          <div className="hero-buttons">
            <a className="button orange" data-testid="link-home-explore-adventures" href="/adventures">Explore adventures <ArrowRight /></a>
            <a className="button outline-light" data-testid="link-home-hero-plan" href="/plan">Plan my adventure</a>
          </div>
        </div>
        {isSlideshow && (
          <div className="home-hero-controls" aria-label="Homepage hero slideshow controls">
            <button type="button" aria-label="Previous hero image" onClick={() => moveSlide(-1)}><ChevronLeft /></button>
            <div className="home-hero-dots" aria-label="Choose a hero image">
              {slides.map((image, index) => (
                <button
                  type="button"
                  key={`${image}-dot-${index}`}
                  aria-label={`Show hero image ${index + 1}`}
                  aria-pressed={index === safeIndex}
                  className={index === safeIndex ? 'active' : ''}
                  onClick={() => setActiveIndex(index)}
                />
              ))}
            </div>
            <button type="button" aria-label="Next hero image" onClick={() => moveSlide(1)}><ChevronRight /></button>
            <button
              type="button"
              aria-label={manualPaused ? 'Resume slideshow' : 'Pause slideshow'}
              aria-pressed={manualPaused}
              onClick={() => setManualPaused((paused) => !paused)}
            >
              {manualPaused ? <Play /> : <Pause />}
            </button>
          </div>
        )}
      </section>
    </div>
  )
}

export default function Page() {
  const homeContent = useGetPublicSiteContent('home', { query: { queryKey: getGetPublicSiteContentQueryKey('home'), retry: false } })
  const publishedHome = homeContent.data?.isPublished ? homeContent.data : undefined
  const getImage = (key: string, fallback: string) => resolveSiteImage(publishedHome?.imageOverrides, key, fallback)
  const heroImages = publishedHome?.heroImages?.length
    ? publishedHome.heroImages
    : [publishedHome?.heroImageUrl || hero]
  const homeAdventureTypes = adventureTypes.map((item) => ({
    ...item,
    image: getImage(`type-${item.name.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}`, item.image),
  }))
  const homeVibes = vibes.map(([name, detail, image]) => [
    name,
    detail,
    getImage(`vibe-${name.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}`, image),
  ] as const)
  const homeDestinations = destinations.map(([name, detail, image]) => [
    name,
    detail,
    getImage(`destination-${name.toLowerCase().replaceAll(' ', '-')}`, image),
  ] as const)
  const groupExperienceImage = getImage('experience-photo', images.group)
  const customTripImage = getImage('custom-trip-banner', destinationHero)
  return <div id="top"><Header /><main>
    <HomeHero
      images={heroImages}
      mode={publishedHome?.heroMode || 'static'}
      title={publishedHome?.heroTitle || <>Your next adventure <em>starts here.</em></>}
      description={publishedHome?.heroSubtitle || 'Safaris, beach escapes, camping, road trips and group adventures made for real people.'}
      accentImage={getImage('hero-accent', '/images/linkups-hero-monkey.webp')}
    />
    <section id="adventure-types" className="adventure-types">
      <SectionTitle eyebrow="What kind of adventure are you looking for?" title="Find your kind of wild" />
      <AdventureTypeCarousel items={homeAdventureTypes} />
      <a className="button dark center" href="/adventures">Explore all adventures <ArrowRight /></a>
    </section>
    <section id="destinations" className="destinations"><div className="section-row"><SectionTitle eyebrow="Our destinations" title="Discover Kenya's best places" /><Link href="/destinations" className="text-link">View all destinations <ArrowRight /></Link></div><div className="destination-grid">{homeDestinations.map(([name, detail, image]) => <Link className="destination-card" href={`/destinations/${name.toLowerCase().replaceAll(' ', '-')}`} key={name} style={{ backgroundImage: `linear-gradient(0deg, rgba(0,33,28,.82), transparent 65%), url("${optimizedImageUrl(image)}")` }}><div><h3>{name}</h3><p>{detail}</p><span>Explore <ArrowRight /></span></div></Link>)}</div></section>
    <section id="adventures" className="experience"><div className="experience-copy"><SectionTitle eyebrow="More than a trip" title="It's a Linkups experience." /><p>We believe the best adventures are not just about where you go. They're about who you're with, what you experience and the stories you bring home.</p><a className="button dark" href="/plan">Why Linkups? <ArrowRight /></a></div><div className="experience-photo" style={{ backgroundImage: `url("${optimizedImageUrl(groupExperienceImage)}")` }}><strong>Real people.<br />Real adventures.</strong></div></section>
    <section className="packages"><div className="section-row"><SectionTitle eyebrow="Featured adventures" title="Handpicked experiences" /><a href="/adventures" className="text-link">View all packages <ArrowRight /></a></div><AdventureCards variant="package" limit={6}/></section>
    <EventCarousel />
    <section id="adventure-vibes" className="vibe-section"><div className="section-row"><SectionTitle eyebrow="What's your adventure vibe?" title="Find your kind of fun" /><Link href="/adventures" className="text-link">Browse and compare trips <ArrowRight /></Link></div><p className="vibe-intro">Tell us how you want to feel. We&apos;ll help you find where to go.</p><div className="vibe-grid">{homeVibes.map(([name, detail, image]) => <Link href="/adventures" className="vibe-card" key={name}><SiteImage src={image} alt={name} /><strong>{name}</strong><small>{detail}</small></Link>)}</div><Link className="button dark center" href="/?quiz=1">Find my adventure <ArrowRight /></Link></section>
    <section id="travel-dates" className="upcoming-home"><div className="section-row"><SectionTitle eyebrow="Questions about travel dates?" title="We’ll help you find the right departure." /><Link href="/plan" className="text-link">Ask about a trip date <ArrowRight /></Link></div><p className="vibe-intro">Departure dates and availability are confirmed by our team when you send a booking request.</p></section>
    <section className="custom-trip" id="contact" style={{ backgroundImage: `linear-gradient(90deg, rgba(0,44,36,.92), rgba(0,44,36,.45)), url("${optimizedImageUrl(customTripImage)}")` }}><div><SectionTitle light eyebrow="Can't find exactly what you want?" title="Plan your custom trip" /><p>Tell us where you want to go, who you're travelling with, your dates and your budget. We'll build the experience around you.</p><a className="button orange" href="mailto:linkupsadventures@gmail.com">Start planning <ArrowRight /></a></div><div className="benefits">{['Custom itineraries', 'Group & family trips', 'Flexible budgets', 'Dedicated support'].map((item) => <span key={item}><Check /> {item}</span>)}</div></section>
    <AdventureQuiz /><ReviewsMedia /><section className="trust"><div><Star /><strong>Trusted by adventurers</strong><p>Thoughtful planning, local expertise and memories that last.</p></div><div><Users /><strong>For every traveller</strong><p>Solo explorers, couples, families, friends and teams.</p></div><div><Compass /><strong>Kenya, your way</strong><p>From savannahs to coastlines, discover more with Linkups.</p></div></section>
    </main><footer><div className="footer-main"><div><Logo light className="footer-brand" /><p>Where fun meets adventures.</p></div><div><strong>Explore</strong><Link href="/adventures">Adventures</Link><Link href="/destinations">Destinations</Link><Link href="/group-travel">Group Travel</Link><Link href="/about">About Us</Link></div><div><strong>Contact</strong><a href="tel:0726843677">0726 843 677</a><a href="mailto:linkupsadventures@gmail.com">linkupsadventures@gmail.com</a><Link href="/contact">@LinkupsAdventures</Link></div><div><strong>Your LinkUps</strong><Link href="/login">Sign in</Link><Link href="/register">Create an account</Link></div><div><strong>Follow us</strong><div className="socials"><Globe2 /><Star /><Compass /></div></div><div><strong>Policies</strong><Link href="/terms">Terms &amp; Conditions</Link><Link href="/cancellation-policy">Cancellation Policy</Link><Link href="/privacy-policy">Privacy Policy</Link></div><div><strong>Payments</strong><p>M-Pesa Till<br /><b>5139557</b></p></div></div><div className="footer-bottom"><span>© 2026 Linkups Adventures. All rights reserved.</span><span>LinkUps Adventures · Kenya</span></div></footer><FloatingWhatsAppButton /></div>
}

export { CalendarDays, MapPin, ChevronDown }
