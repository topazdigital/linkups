import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { PageFrame, Hero, SectionTitle, siteImages } from '@/components/site-shell'
import { destinations } from '@/lib/destinations'

const destinationCards = destinations.map(({ name, description, image, slug }) => [name, description, image, slug])
export default function DestinationsPage(){return <PageFrame><Hero eyebrow="Explore Kenya" title={<>Iconic destinations.<br /><em>Unforgettable experiences.</em></>} description="Discover places with a story, from savannahs and mountains to the Indian Ocean coast." image={siteImages.mountain}/><section className="destinations"><SectionTitle eyebrow="Our destinations" title="Where will your story take you?"/><div className="destination-grid">{destinationCards.map(([name,detail,image,slug])=><Link className="destination-card" href={`/destinations/${slug}`} key={slug} style={{backgroundImage:`linear-gradient(0deg,rgba(0,33,28,.85),transparent 65%),url(${image})`}}><div><h3>{name}</h3><p>{detail}</p><span>Explore <ArrowRight/></span></div></Link>)}</div></section></PageFrame>}
