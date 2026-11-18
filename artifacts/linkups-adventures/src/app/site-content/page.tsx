import { useEffect } from 'react'
import { getGetPublicSiteContentQueryKey, useGetPublicSiteContent } from '@workspace/api-client-react'
import { PageFrame } from '@/components/site-shell'
import { legalPages } from '@/lib/legal-content'
import { Fragment } from 'react'

const legalPageKeys = new Set(Object.keys(legalPages))

function renderBlockContent(lines: string[], key: string | number) {
  if (lines.length === 0) return null
  if (lines.every((line) => line.startsWith('- '))) {
    return <ul key={key}>{lines.map((line, lineIndex) => <li key={lineIndex}>{line.slice(2)}</li>)}</ul>
  }
  if (lines.every((line) => /^\d+[.)]\s/.test(line))) {
    return <ol key={key}>{lines.map((line, lineIndex) => <li key={lineIndex}>{line.replace(/^\d+[.)]\s/, '')}</li>)}</ol>
  }
  return <p key={key}>{lines.join(' ')}</p>
}

function renderBody(body: string) {
  return body.split(/\n\s*\n/).map((block, index) => {
    const lines = block.split('\n').map((line) => line.trim()).filter(Boolean)
    if (lines.length === 0) return null
    const first = lines[0]

    if (first.startsWith('### ')) {
      return <Fragment key={index}><h3>{first.slice(4)}</h3>{renderBlockContent(lines.slice(1), `${index}-content`)}</Fragment>
    }
    if (first.startsWith('## ')) {
      return <Fragment key={index}><h2>{first.slice(3)}</h2>{renderBlockContent(lines.slice(1), `${index}-content`)}</Fragment>
    }
    return renderBlockContent(lines, index)
  })
}

function updateMeta(title: string, description: string) {
  document.title = `${title} | LinkUps Adventures`
  let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]')
  if (!meta) {
    meta = document.createElement('meta')
    meta.name = 'description'
    document.head.append(meta)
  }
  meta.content = description
}

export default function PublicContentPage({ pageKey }: { pageKey: string }) {
  const contentQuery = useGetPublicSiteContent(pageKey, {
    query: {
      queryKey: getGetPublicSiteContentQueryKey(pageKey),
      retry: false,
      staleTime: 60_000,
    },
  })
  const fallback = legalPages[pageKey]
  const content = contentQuery.data
    ? {
        ...fallback,
        ...contentQuery.data,
        bodyContent: contentQuery.data.bodyContent ?? fallback?.bodyContent ?? null,
      }
    : fallback
  const isLegalPage = legalPageKeys.has(pageKey)
  const errorStatus = (contentQuery.error as { status?: number } | null)?.status

  useEffect(() => {
    updateMeta(
      content?.pageTitle ?? 'Page not found',
      content?.seoDescription ?? 'Explore LinkUps Adventures in Kenya.',
    )
  }, [content?.pageTitle, content?.seoDescription])

  if (!content) {
    const message = errorStatus === 404
      ? 'This page is not published or could not be found.'
      : 'This page is temporarily unavailable. Please try again later.'
    return (
      <PageFrame>
        <section className="content-page content-page-error">
          <span className="eyebrow orange-text">LinkUps Adventures</span>
          <h1>{errorStatus === 404 ? 'Page not found' : 'Page unavailable'}</h1>
          <p>{message}</p>
          <a className="button orange" href="/">Back to home</a>
        </section>
      </PageFrame>
    )
  }

  return (
    <PageFrame>
      <header className="content-page-hero">
        <span className="eyebrow orange-text">LinkUps Adventures</span>
        <h1>{content.heroTitle || content.pageTitle}</h1>
        {content.heroSubtitle && <p>{content.heroSubtitle}</p>}
      </header>
      <article className="content-page">
        {isLegalPage && (
          <aside className="legal-disclaimer">
            This page provides general information and is not legal advice. Have a qualified Kenyan lawyer review it before relying on it.
          </aside>
        )}
        {contentQuery.data?.updatedAt && (
          <p className="content-updated">Last updated {new Date(contentQuery.data.updatedAt).toLocaleDateString('en-KE', { dateStyle: 'long' })}</p>
        )}
        <div className="content-prose">{renderBody(content.bodyContent ?? '')}</div>
        {isLegalPage && (
          <p className="legal-contact">
            Questions about this page? <a href="mailto:legal@linkupsadventures.com">Contact LinkUps Adventures</a>.
          </p>
        )}
      </article>
    </PageFrame>
  )
}
