import { useEffect } from 'react';
import { ErrorBoundary } from '@/components/error-boundary';
import { SeoManager } from '@/components/seo-manager';
import { MobileBottomNav, PageFrame } from '@/components/site-shell';
import { CompareProvider, TripCompareTray } from '@/components/trip-compare';
import AboutPage from '@/app/about/page';
import AdminPage from '@/app/admin/page';
import { AuthModalProvider, useAuthModal, type AuthModalMode } from '@/components/auth-modal-context';
import { AuthDialogHost } from '@/components/auth-dialog-host';
import AdventuresPage from '@/app/adventures/page';
import AdventureDetailPage from '@/app/adventures/[slug]/page';
import BlogPage from '@/app/blog/page';
import BlogPostPage from '@/app/blog/[slug]/page';
import ContactPage from '@/app/contact/page';
import DestinationsPage from '@/app/destinations/page';
import DestinationDetailPage from '@/app/destinations/[slug]/page';
import GroupTravelPage from '@/app/group-travel/page';
import HomePage from '@/app/page';
import PlanPage from '@/app/plan/page';
import PublicContentPage from '@/app/site-content/page';
import DashboardPage from '@/app/dashboard/page';
import TravelGuidePage from '@/app/travel-guide/page';
import UpcomingTripsPage from '@/app/upcoming-trips/page';
import { Route, Router as WouterRouter, Switch, useLocation } from 'wouter';

function NotFoundPage() {
  return (
    <PageFrame>
      <section className="compare-page">
        <span className="eyebrow">LinkUps Adventures</span>
        <h1>Page not found</h1>
        <p>We couldn’t find that page. Explore our trips and destinations instead.</p>
        <a className="button orange" href="/adventures">Browse adventures</a>
      </section>
    </PageFrame>
  );
}

function LegacyCompareRedirect() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation('/adventures');
  }, [setLocation]);
  return null;
}

function AuthRoutePage({ mode }: { mode: AuthModalMode }) {
  const { openAuth } = useAuthModal();
  useEffect(() => {
    openAuth(mode);
  }, [mode, openAuth]);
  return <HomePage />;
}

function AppRoutes() {
  const [location] = useLocation();
  const showMobileNavigation =
    !location.startsWith('/admin');

  return (
    <>
      <ErrorBoundary resetKey={location}>
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/about" component={AboutPage} />
          <Route path="/admin" component={AdminPage} />
          <Route path="/dashboard" component={DashboardPage} />
          <Route path="/adventures" component={AdventuresPage} />
          <Route path="/adventures/:slug">
            {(params) => <AdventureDetailPage slug={params.slug} />}
          </Route>
          <Route path="/blog" component={BlogPage} />
          <Route path="/blog/:slug">
            {(params) => <BlogPostPage slug={params.slug} />}
          </Route>
          <Route path="/compare" component={LegacyCompareRedirect} />
          <Route path="/contact" component={ContactPage} />
          <Route path="/destinations" component={DestinationsPage} />
          <Route path="/destinations/:slug">
            {(params) => <DestinationDetailPage slug={params.slug} />}
          </Route>
          <Route path="/group-travel" component={GroupTravelPage} />
          <Route path="/login">{() => <AuthRoutePage mode="login" />}</Route>
          <Route path="/plan" component={PlanPage} />
          <Route path="/register">{() => <AuthRoutePage mode="register" />}</Route>
          <Route path="/travel-guide" component={TravelGuidePage} />
          <Route path="/upcoming-trips" component={UpcomingTripsPage} />
          <Route path="/:pageKey">
            {(params) => <PublicContentPage pageKey={params.pageKey} />}
          </Route>
          <Route component={NotFoundPage} />
        </Switch>
      </ErrorBoundary>
      {showMobileNavigation && <MobileBottomNav />}
      {showMobileNavigation && <TripCompareTray />}
    </>
  );
}

function App() {
  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <CompareProvider>
        <AuthModalProvider>
          <SeoManager />
          <AppRoutes />
          <AuthDialogHost />
        </AuthModalProvider>
      </CompareProvider>
    </WouterRouter>
  );
}

export default App;
