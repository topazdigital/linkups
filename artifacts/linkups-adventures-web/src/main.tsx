import { createRoot } from 'react-dom/client';

import App from './App';
import { ErrorBoundary } from '@/components/error-boundary';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import './index.css';
import './admin-data.css';
import './brand.css';
import './content-pages.css';
import './image-performance.css';
import './homepage-sections.css';
import './responsive-pages.css';
import './marketing-pages.css';
import './homepage-visual-tuning.css';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!, {
  // Keeps caught errors off reportError(), which would raise the dev overlay.
  onCaughtError: (error, errorInfo) => {
    console.error(error, errorInfo.componentStack);
  },
}).render(
  <QueryClientProvider client={queryClient}>
    <ErrorBoundary><App /></ErrorBoundary>
  </QueryClientProvider>,
);
