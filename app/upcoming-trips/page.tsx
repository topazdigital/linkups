import Link from 'next/link'
import { ArrowRight, CalendarDays, Users } from 'lucide-react'
import { PageFrame, SectionTitle } from '@/components/site-shell'
import { ConversionTools } from '@/components/conversion-tools'

const trips = [['15 Nov 2026', 'Maasai Mara Migration Weekend', '3 days · 2 nights', 'KES 24,800 pp', '8 seats left'], ['05 Dec 2026', 'Mombasa Festive Beach Escape', '4 days · 3 nights', 'KES 18,500 pp', '12 seats left'], ['20 Jan 2027', 'Samburu Overland Adventure', '3 days · 2 nights', 'KES 16,000 pp', '6 seats left']]
export default function UpcomingTrips() { return <PageFrame><section className="page-hero"><div><span className="eyebrow orange-text">Join the journey</span><h1>Upcoming trips</h1><p>Meet good people, see remarkable places and join a ready-to-go LinkUps adventure.</p></div></section><main className="upcoming-page"><SectionTitle eyebrow="Save your seat" title="Trips with dates, details and room to explore" /><div className="trip-list">{trips.map(([date, name, duration, price, seats]) => <article className="trip-row" key={name}><div className="trip-date"><CalendarDays /><strong>{date}</strong></div><div><h2>{name}</h2><p>{duration} · {seats}</p></div><strong className="trip-price">{price}</strong><Link className="button orange" href="/plan">Join this trip <ArrowRight /></Link></article>)}</div><ConversionTools /></main></PageFrame> }
