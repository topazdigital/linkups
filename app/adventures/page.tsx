import { PageFrame, Hero, SectionTitle, TourGrid, siteImages } from '@/components/site-shell'

export default function AdventuresPage() {
  return <PageFrame><Hero eyebrow="Featured adventures" title={<>Find your next <em>adventure.</em></>} description="From wild safaris and epic road trips to beach escapes, camping nights and unforgettable group experiences." image={siteImages.mara} /><section className="packages"><SectionTitle eyebrow="Handpicked experiences" title="Adventure packages for every kind of traveller" /><TourGrid /></section><section className="custom-trip" style={{ backgroundImage: `linear-gradient(90deg, rgba(0,44,36,.92), rgba(0,44,36,.45)), url(${siteImages.camp})` }}><div><SectionTitle eyebrow="Need something different?" title="Let's create your adventure." /><p>Share your dates, group size and dream destination. Our team will build a custom itinerary around you.</p><a className="button orange" href="/plan">Start planning</a></div></section></PageFrame>
}
