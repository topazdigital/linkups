import { ArrowRight, Compass, Eye, Heart, Mountain, ShieldCheck, Sparkles, Users, Leaf, Star } from 'lucide-react'
import { PageFrame } from '@/components/site-shell'

const values = [
  ['Adventure', Mountain, 'We live for new experiences.'],
  ['Community', Users, 'We grow together, not just travel together.'],
  ['Excellence', Star, 'We go the extra mile for your comfort & safety.'],
  ['Sustainability', Leaf, 'We protect the places we love.'],
  ['Fun', Heart, 'Because every great journey should be a good time.'],
] as const
const team = [
  ['Operations Team', '/images/group-travel-hero.png', 'On ground. In your corner.'],
  ['Safari Guides', '/images/adventure-hero.png', 'Local knowledge. Real experiences.'],
  ['Customer Support', '/images/about-founder.png', 'Here for you, always.'],
  ['Trip Planners', '/images/adventure-coast.png', 'Turning your ideas into itineraries.'],
]

export default function AboutPage() {
  return <PageFrame>
    <main className="about-page">
      <section className="about-hero" style={{ backgroundImage: "linear-gradient(90deg,rgba(0,38,32,.86),rgba(0,38,32,.18)),url('/images/group-travel-hero.png')" }}>
        <div><span className="about-ribbon">About us</span><h1>We don&apos;t just plan trips.<br /><em>We create memories.</em></h1><p>LinkUps Adventures was created for people who don&apos;t just want to visit places — they want to experience them.</p><div className="about-hero-features"><span><Compass /> Adventure first</span><span><Users /> Community driven</span><span><Sparkles /> Authentic experiences</span><span><Star /> Luxury, wild &amp; youthful</span></div></div>
      </section>
      <section className="about-story"><div className="story-copy"><span className="orange-kicker">Our story</span><h2>It started with a love for adventure...</h2><p>LinkUps Adventures was born from a simple belief — that life is better when you explore it together. What started as a passion for travel, nature and good company has grown into a full-fledged adventure brand, creating unforgettable experiences for individuals, groups and corporate teams across Kenya and beyond.</p><p>We&apos;ve seen the joy, the excitement and the lifelong connections that come from exploring new places. And that&apos;s exactly what we&apos;re here to do — turn your travel dreams into real, thrilling experiences.</p><strong>Same people. New stories.</strong></div><figure className="founder-card"><img src="/images/about-founder.png" alt="LinkUps founder and travel guide" /><figcaption>Caroline Wanja<small>Founder &amp; CEO</small></figcaption></figure><div className="mission-card"><div><Compass /><h3>Our mission</h3><p>To create extraordinary travel experiences that connect people, explore destinations and inspire a deeper love for adventure.</p></div><div><Eye /><h3>Our vision</h3><p>To be Africa&apos;s leading adventure brand, known for unforgettable experiences, exceptional service and a vibrant community of explorers.</p></div></div></section>
      <section className="values-band"><h2>Our values</h2><div>{values.map(([label, Icon, text]) => <article key={label}><Icon /><h3>{label}</h3><p>{text}</p></article>)}</div></section>
      <section className="team-section"><div className="team-intro"><span className="orange-kicker">Meet the team</span><h2>A passionate team. One goal — your perfect adventure.</h2><p>Behind every successful trip is a team that cares. From planning and logistics to on-ground support, our team is dedicated to making your experience smooth, safe and unforgettable.</p><a href="/contact" className="button button-outline">Our team <ArrowRight /></a></div><div className="team-grid">{team.map(([name, image, text]) => <article key={name}><img src={image} alt={name} /><h3>{name}</h3><p>{text}</p></article>)}</div></section>
      <section className="about-photo-strip"><img src="/images/group-travel-hero.png" alt="Friends enjoying an adventure" /><img src="/images/adventure-hero.png" alt="Safari adventure" /><div><h2>Real people.<br />Real adventures.</h2><p>Follow our journey on Instagram @LinkUpsAdventures</p></div><img src="/images/adventure-camp.png" alt="Campfire adventure" /><img src="/images/adventure-coast.png" alt="Kenyan coast" /></section>
    </main>
  </PageFrame>
}
