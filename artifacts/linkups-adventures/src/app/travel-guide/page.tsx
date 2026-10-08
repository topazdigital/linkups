import { CheckCircle2, CreditCard, FileText, HeartPulse, ShieldCheck } from 'lucide-react'
import { PageFrame } from '@/components/site-shell'

const essentials = [
  ['Visa information', 'Check entry requirements and passport validity before you travel.', FileText],
  ['Travel insurance', 'We recommend cover for medical care, delays and adventure activities.', ShieldCheck],
  ['Packing tips', 'Bring light layers, comfortable shoes, sun protection and a reusable bottle.', CheckCircle2],
  ['Health & safety', 'Ask your travel clinic about current recommendations before departure.', HeartPulse],
  ['Payment options', 'M-Pesa, card and confirmed payment plans are available during booking.', CreditCard],
]

export default function TravelGuidePage() {
  return <PageFrame><main className="guide-page"><section className="guide-hero"><span className="eyebrow orange-text">Travel essentials</span><h1>Plan with confidence.</h1><p>Everything you need to know before your Kenya adventure, from visas and insurance to packing and payments.</p></section><section className="guide-grid">{essentials.map(([title, text, Icon]) => <article className="guide-card" key={title as string}><Icon /><h2>{title as string}</h2><p>{text as string}</p><a href="/contact">Ask our team →</a></article>)}</section><section className="guide-notes"><div><span className="eyebrow">Before you book</span><h2>Clear details. No surprises.</h2><p>Every itinerary includes what is covered, what to bring, cancellation terms and the payment schedule. We will talk you through the details before you confirm.</p></div><div className="guide-list"><p>✓ Park fees and activities are listed clearly</p><p>✓ Airport transfers can be arranged</p><p>✓ Dietary and accessibility requests are welcome</p><p>✓ Custom itineraries can fit your dates and budget</p></div></section></main></PageFrame>
}
