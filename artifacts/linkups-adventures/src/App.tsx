import { ErrorBoundary } from '@/components/error-boundary';
import { SiteStructuredData } from '@/components/reviews-media';
import { PageFrame } from '@/components/site-shell';
import AboutPage from '@/app/about/page';
import AdminPage from '@/app/admin/page';
import AdventuresPage from '@/app/adventures/page';
import AdventureDetailPage from '@/app/adventures/[slug]/page';
import BlogPage from '@/app/blog/page';
import ComparePage from '@/app/compare/page';
import ContactPage from '@/app/contact/page';
import DestinationsPage from '@/app/destinations/page';
import DestinationDetailPage from '@/app/destinations/[slug]/page';
import GroupTravelPage from '@/app/group-travel/page';
import HomePage from '@/app/page';
import LoginPage from '@/app/login/page';
import PlanPage from '@/app/plan/page';
import RegisterPage from '@/app/register/page';
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

function AppRoutes() {
  const [location] = useLocation();

  return (
    <ErrorBoundary resetKey={location}>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/about" component={AboutPage} />
        <Route path="/admin" component={AdminPage} />
        <Route path="/adventures" component={AdventuresPage} />
        <Route path="/adventures/:slug">
          {(params) => <AdventureDetailPage slug={params.slug} />}
        </Route>
        <Route path="/blog" component={BlogPage} />
        <Route path="/compare" component={ComparePage} />
        <Route path="/contact" component={ContactPage} />
        <Route path="/destinations" component={DestinationsPage} />
        <Route path="/destinations/:slug">
          {(params) => <DestinationDetailPage slug={params.slug} />}
        </Route>
        <Route path="/group-travel" component={GroupTravelPage} />
        <Route path="/login" component={LoginPage} />
        <Route path="/plan" component={PlanPage} />
        <Route path="/register" component={RegisterPage} />
        <Route path="/travel-guide" component={TravelGuidePage} />
        <Route path="/upcoming-trips" component={UpcomingTripsPage} />
        <Route component={NotFoundPage} />
      </Switch>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <SiteStructuredData />
      <AppRoutes />
    </WouterRouter>
  );
}

export default App;
