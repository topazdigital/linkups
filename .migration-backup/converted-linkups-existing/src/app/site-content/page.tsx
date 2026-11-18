import { useEffect } from 'react'
import { getGetPublicSiteContentQueryKey, useGetPublicSiteContent } from '@workspace/api-client-react'
import { PageFrame } from '@/components/site-shell'
import { legalPages } from '@/lib/legal-content'
import { applyPageSeo, hasConfiguredSeoEntry } from '@/lib/seo'
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
  const contentHeroImageUrl = content && 'heroImageUrl' in content ? content.heroImageUrl : null
  const firstContentHeroImage = content && 'heroImages' in content ? content.heroImages[0] : null

  useEffect(() => {
    const pathname = `/${pageKey}`;
    if (hasConfiguredSeoEntry(pathname)) return;

    if (!content) {
      applyPageSeo(pathname, {
        title: 'Page not found | LinkUps Adventures',
        description: 'This LinkUps Adventures page is unavailable or has not been published.',
        keywords: [],
        imageSource: '/images/linkups-logo.webp',
        imageAlt: 'LinkUps Adventures logo',
        index: false,
        sitemap: false,
        schemaType: 'WebPage',
      });
      return;
    }

    const title = content.pageTitle.trim();
    const description = content.seoDescription?.trim()
      || content.heroSubtitle?.trim()
      || `Discover ${title} from LinkUps Adventures, with helpful information for planning your next trip in Kenya.`;
    const socialImage = contentHeroImageUrl || firstContentHeroImage || '/images/linkups-logo.webp';

    applyPageSeo(pathname, {
      title: `${title} | LinkUps Adventures`,
      description,
      keywords: [title, 'LinkUps Adventures'],
      imageSource: socialImage,
      imageAlt: content.heroTitle?.trim() || title,
      index: true,
      sitemap: false,
      schemaType: 'WebPage',
      socialImageUrl: socialImage,
    });
  }, [
    contentHeroImageUrl,
    firstContentHeroImage,
    content?.heroSubtitle,
    content?.heroTitle,
    content?.pageTitle,
    content?.seoDescription,
    pageKey,
  ]);

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
