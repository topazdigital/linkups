'use client'

import { useState } from 'react'
import { ArrowRight, CheckCircle2, ExternalLink, Save } from 'lucide-react'

const trips = [
  ['Samburu Overland', '12–13 Oct 2026', 'KES 16,000', 'Seats available'],
  ['Mombasa Escape', '25–27 Oct 2026', 'KES 12,800', 'Almost full'],
  ['Naivasha Adventure', '02 Nov 2026', 'KES 5,500', 'Available'],
  ['Masai Mara Escape', '15–16 Nov 2026', 'KES 24,800', 'Available'],
]

export function UpcomingTrips() {
  return <div className="admin-section"><div className="admin-toolbar"><div><h3>Upcoming trips</h3><p>Publish dates, capacity, pricing and booking status shown on the storefront.</p></div><button className="admin-primary"><Save /> Save trip</button></div><div className="admin-table-card"><table className="admin-table"><thead><tr><th>Trip</th><th>Date</th><th>Price</th><th>Status</th><th>Action</th></tr></thead><tbody>{trips.map((trip) => <tr key={trip[0]}>{trip.map((value, index) => <td key={value}>{index === 3 ? <span className="status confirmed">{value}</span> : value}</td>)}<td><button className="admin-secondary">Edit</button></td></tr>)}</tbody></table></div><div className="admin-form-grid"><Field label="Trip name"/><Field label="Departure date"/><Field label="Price"/><Field label="Seats available"/><Field label="Join/enquiry URL" full/><Field label="Trip description" full area/></div></div>
}

export function FrontendGuide() {
  const [saved, setSaved] = useState(false)
  const sections = [
    ['Homepage', 'Hero, Find Your Adventure cards, Signature Adventures, trust statement, vibe quiz, upcoming trips, WhatsApp CTA'],
    ['Destinations', 'Hero, category filters, destination cards, featured packages, travel essentials, custom trips'],
    ['Adventure detail', 'Price, itinerary, inclusions, exclusions, booking form, preferred date and WhatsApp message'],
    ['Group travel', 'Group types, benefits, enquiry form, budget, transport and accommodation requirements'],
    ['About us', 'Story, founder, mission, vision, values, team and real-adventure media strip'],
    ['Contact', 'Contact details, enquiry form, visit section, FAQ and WhatsApp action'],
  ]
  return <div className="admin-section"><div className="admin-toolbar"><div><h3>Frontend content guide</h3><p>One place for the team to know exactly which storefront sections are editable.</p></div><button className="admin-primary" onClick={() => setSaved(true)}><Save /> Save guide</button></div>{saved && <div className="success-box"><CheckCircle2 /> Frontend content checklist saved.</div>}<div className="admin-settings-grid">{sections.map(([title, content]) => <article className="admin-setting-card" key={title}><h4>{title}</h4><p>{content}</p><button className="admin-secondary">Edit section <ArrowRight /></button></article>)}</div><div className="panel"><div className="panel-head"><div><h3>Quick links</h3><p>Open the public page while editing content.</p></div></div><div className="admin-actions"><a className="admin-secondary" href="/" target="_blank" rel="noreferrer">Open homepage <ExternalLink /></a><a className="admin-secondary" href="/destinations" target="_blank" rel="noreferrer">Open destinations <ExternalLink /></a><a className="admin-secondary" href="/upcoming-trips" target="_blank" rel="noreferrer">Open upcoming trips <ExternalLink /></a></div></div></div>
}

function Field({ label, area, full = false }: { label: string; area?: boolean; full?: boolean }) { return <label className={'admin-field' + (full ? ' full' : '')}>{label}<small>Visible on the live website</small>{area ? <textarea className="admin-textarea" placeholder={'Enter ' + label.toLowerCase()} /> : <input className="admin-input" placeholder={'Enter ' + label.toLowerCase()} />}</label> }
