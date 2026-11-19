import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Check, Scale, X } from 'lucide-react'
import { Link } from 'wouter'
import type { Adventure } from '@workspace/api-client-react'
import { formatAdventurePrice } from '@/lib/api'

type CompareContextValue = {
  selected: Adventure[]
  notice: string
  dialogOpen: boolean
  toggleTrip: (trip: Adventure) => void
  removeTrip: (id: number) => void
  clearTrips: () => void
  openDialog: () => void
  closeDialog: () => void
}

const CompareContext = createContext<CompareContextValue | null>(null)

export function CompareProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<Adventure[]>([])
  const [notice, setNotice] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  function toggleTrip(trip: Adventure) {
    if (selected.some((item) => item.id === trip.id)) {
      setSelected((current) => current.filter((item) => item.id !== trip.id))
      setNotice('')
      return
    }
    if (selected.length >= 2) {
      setNotice('Remove a trip before adding another.')
      return
    }
    setSelected((current) => current.some((item) => item.id === trip.id) ? current : [...current, trip])
    setNotice('')
  }

  function removeTrip(id: number) {
    setSelected((current) => current.filter((item) => item.id !== id))
    setNotice('')
    setDialogOpen(false)
  }

  function clearTrips() {
    setSelected([])
    setNotice('')
    setDialogOpen(false)
  }

  const value = useMemo(() => ({
    selected,
    notice,
    dialogOpen,
    toggleTrip,
    removeTrip,
    clearTrips,
    openDialog: () => {
      if (selected.length === 2) setDialogOpen(true)
    },
    closeDialog: () => setDialogOpen(false),
  }), [selected, notice, dialogOpen])

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>
}

function useCompareContext() {
  const value = useContext(CompareContext)
  if (!value) throw new Error('Trip comparison controls must be inside CompareProvider.')
  return value
}

export function TripCompareButton({ trip }: { trip: Adventure }) {
  const { selected, toggleTrip } = useCompareContext()
  const isSelected = selected.some((item) => item.id === trip.id)

  return (
    <button
      className="trip-compare-action"
      type="button"
      aria-pressed={isSelected}
      aria-label={`${isSelected ? 'Remove' : 'Add'} ${trip.title} ${isSelected ? 'from' : 'to'} trip comparison`}
      onClick={() => toggleTrip(trip)}
    >
      {isSelected ? <Check aria-hidden="true" /> : <Scale aria-hidden="true" />}
      {isSelected ? 'Added' : 'Compare'}
    </button>
  )
}

function durationLabel(trip: Adventure) {
  const days = `${trip.durationDays} day${trip.durationDays === 1 ? '' : 's'}`
  const nights = trip.durationNights > 0
    ? `${trip.durationNights} night${trip.durationNights === 1 ? '' : 's'}`
    : ''
  return nights ? `${days} · ${nights}` : days
}

export function TripCompareTray() {
  const { selected, notice, dialogOpen, removeTrip, clearTrips, openDialog, closeDialog } = useCompareContext()

  useEffect(() => {
    if (!dialogOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeDialog()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [dialogOpen, closeDialog])

  if (selected.length === 0) return null

  const rows: Array<[string, (trip: Adventure) => ReactNode]> = [
    ['Price', (trip) => <>{formatAdventurePrice(trip)}{trip.price > 0 || trip.priceUsd ? ' per person' : ''}</>],
    ['Duration', (trip) => durationLabel(trip)],
    ['Destination', (trip) => trip.destinationName || 'Kenya'],
    ['Adventure type', (trip) => trip.category],
    ['Stay', (trip) => trip.accommodation || 'Not listed'],
    ['Included', (trip) => trip.included.length
      ? <ul>{trip.included.map((item) => <li key={item}>{item}</li>)}</ul>
      : 'Details available from our team'],
  ]

  return <>
    <aside className="trip-compare-tray" aria-label="Trip comparison selection">
      <div className="trip-compare-tray-header">
        <strong>Compare trips</strong>
        <span className="trip-compare-tray-count">{selected.length} of 2 selected</span>
      </div>
      <div className="trip-compare-tray-list">
        {selected.map((trip) => (
          <div className="trip-compare-tray-item" key={trip.id}>
            <span>{trip.title}</span>
            <button type="button" aria-label={`Remove ${trip.title}`} onClick={() => removeTrip(trip.id)}>Remove</button>
          </div>
        ))}
      </div>
      <div className="trip-compare-tray-actions">
        <span className="trip-compare-tray-message" role="status" aria-live="polite">
          {notice || (selected.length < 2 ? 'Choose one more trip to compare.' : 'Your comparison is ready.')}
        </span>
        <button className="button orange" type="button" onClick={openDialog} disabled={selected.length !== 2}>Compare now</button>
        <button className="trip-compare-tray-clear" type="button" onClick={clearTrips}>Clear</button>
      </div>
    </aside>

    {dialogOpen && selected.length === 2 && (
      <div className="trip-compare-backdrop" onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeDialog()
      }}>
        <section className="trip-compare-dialog" role="dialog" aria-modal="true" aria-labelledby="trip-compare-title">
          <header className="trip-compare-dialog-header">
            <div><span className="eyebrow orange-text">Side-by-side</span><h2 id="trip-compare-title">Compare your trips</h2></div>
            <button className="trip-compare-dialog-close" type="button" aria-label="Close trip comparison" onClick={closeDialog}><X aria-hidden="true" /></button>
          </header>
          <div className="trip-compare-table-wrap">
            <table className="trip-compare-table">
              <thead><tr><th scope="col">Details</th>{selected.map((trip) => <th scope="col" key={trip.id}>{trip.title}</th>)}</tr></thead>
              <tbody>
                {rows.map(([label, render]) => <tr key={label}><th scope="row">{label}</th>{selected.map((trip) => <td key={trip.id}>{render(trip)}</td>)}</tr>)}
                <tr><th scope="row">Next step</th>{selected.map((trip) => <td key={trip.id}><div className="trip-compare-links"><Link className="button dark" href={`/adventures/${trip.slug}`} onClick={closeDialog}>Trip details</Link><Link className="button orange" href={`/plan?tour=${encodeURIComponent(trip.slug)}`} onClick={closeDialog}>Plan this trip</Link></div></td>)}</tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    )}
  </>
}
