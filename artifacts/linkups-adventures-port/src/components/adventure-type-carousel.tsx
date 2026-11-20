import {
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type MouseEvent,
  type PointerEvent,
} from 'react'
import { SiteImage } from '@/components/site-image'

type AdventureType = {
  name: string
  image: string
}

const AUTO_SCROLL_SPEED = 20

export function AdventureTypeCarousel({ items }: { items: AdventureType[] }) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const groupRefs = useRef<Array<HTMLDivElement | null>>([])
  const loopDistanceRef = useRef(0)
  const dragRef = useRef<{
    pointerId: number
    pointerType: string
    startX: number
    lastX: number
    moved: boolean
  } | null>(null)
  const suppressClickRef = useRef(false)
  const [isInteracting, setIsInteracting] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const isPaused = isInteracting || isFocused || prefersReducedMotion

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => setPrefersReducedMotion(preference.matches)
    updatePreference()
    preference.addEventListener('change', updatePreference)
    return () => preference.removeEventListener('change', updatePreference)
  }, [])

  useEffect(() => {
    const viewport = viewportRef.current
    const firstGroup = groupRefs.current[0]
    if (!viewport || !firstGroup) return

    const measureLoopDistance = () => {
      const styles = window.getComputedStyle(firstGroup)
      const gap = Number.parseFloat(styles.columnGap || styles.gap) || 0
      const nextDistance = firstGroup.getBoundingClientRect().width + gap
      if (nextDistance <= 0 || Math.abs(nextDistance - loopDistanceRef.current) < 1) return

      loopDistanceRef.current = nextDistance
      viewport.scrollLeft = nextDistance
    }

    measureLoopDistance()
    const observer = new ResizeObserver(measureLoopDistance)
    observer.observe(viewport)
    observer.observe(firstGroup)
    return () => observer.disconnect()
  }, [items.length])

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport || isPaused) return

    let frameId = 0
    let previousTime = 0

    const animate = (time: number) => {
      if (!previousTime) previousTime = time
      const elapsed = Math.min(time - previousTime, 50)
      previousTime = time

      const loopDistance = loopDistanceRef.current
      if (loopDistance > 0) {
        viewport.scrollLeft += (elapsed * AUTO_SCROLL_SPEED) / 1000
        normalizeLoopPosition(viewport, loopDistance)
      }
      frameId = window.requestAnimationFrame(animate)
    }

    frameId = window.requestAnimationFrame(animate)
    return () => window.cancelAnimationFrame(frameId)
  }, [isPaused])

  function normalizeLoopPosition(viewport: HTMLDivElement, loopDistance = loopDistanceRef.current) {
    if (!loopDistance) return
    if (viewport.scrollLeft <= 0.5) {
      viewport.scrollLeft += loopDistance
    } else if (viewport.scrollLeft >= loopDistance * 2) {
      viewport.scrollLeft -= loopDistance
    }
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (
      event.pointerType === 'touch' ||
      !event.isPrimary ||
      (event.pointerType === 'mouse' && event.button !== 0)
    ) return

    dragRef.current = {
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      startX: event.clientX,
      lastX: event.clientX,
      moved: false,
    }
    setIsInteracting(true)

  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId || drag.pointerType === 'touch') return

    const totalDistance = event.clientX - drag.startX
    if (!drag.moved && Math.abs(totalDistance) <= 4) {
      drag.lastX = event.clientX
      return
    }
    drag.moved = true

    if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.setPointerCapture(event.pointerId)
    }
    const distance = event.clientX - drag.lastX
    event.currentTarget.scrollLeft -= distance
    drag.lastX = event.clientX
    normalizeLoopPosition(event.currentTarget)
  }

  function finishPointerInteraction(pointerId?: number) {
    const drag = dragRef.current
    if (!drag || (pointerId !== undefined && drag.pointerId !== pointerId)) return

    if (drag.pointerType !== 'touch' && drag.moved) {
      suppressClickRef.current = true
      window.setTimeout(() => {
        suppressClickRef.current = false
      }, 0)
    }

    dragRef.current = null
    setIsInteracting(false)
  }

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setIsFocused(false)
    }
  }

  function handleClickCapture(event: MouseEvent<HTMLDivElement>) {
    if (!suppressClickRef.current) return
    event.preventDefault()
    event.stopPropagation()
    suppressClickRef.current = false
  }

  function handleScroll() {
    const viewport = viewportRef.current
    if (viewport) normalizeLoopPosition(viewport)
  }

  return (
    <div
      ref={viewportRef}
      className={`type-carousel-track${isInteracting ? ' is-interacting' : ''}`}
      role="region"
      aria-label="Adventure categories. Swipe, drag, or use the arrow keys to browse."
      tabIndex={0}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={(event) => {
        if (event.pointerType !== 'touch') finishPointerInteraction(event.pointerId)
      }}
      onPointerCancel={(event) => {
        if (event.pointerType !== 'touch') finishPointerInteraction(event.pointerId)
      }}
      onTouchStart={(event) => setIsInteracting(event.touches.length > 0)}
      onTouchEnd={(event) => setIsInteracting(event.touches.length > 0)}
      onTouchCancel={(event) => setIsInteracting(event.touches.length > 0)}
      onScroll={handleScroll}
      onFocusCapture={() => setIsFocused(true)}
      onBlurCapture={handleBlur}
      onClickCapture={handleClickCapture}
    >
      {[0, 1, 2].map((groupIndex) => (
        <div
          className="type-grid"
          key={groupIndex}
          ref={(element) => {
            groupRefs.current[groupIndex] = element
          }}
          aria-hidden={groupIndex !== 1}
        >
          {items.map(({ name, image }) => (
            <a
              className="type-card"
              href="/adventures"
              key={`${groupIndex}-${name}`}
              tabIndex={groupIndex === 1 ? undefined : -1}
              draggable={false}
            >
              <SiteImage src={image} alt="" draggable={false} />
              <div>
                <strong>{name}</strong>
                <small>Explore experiences</small>
              </div>
            </a>
          ))}
        </div>
      ))}
    </div>
  )
}
