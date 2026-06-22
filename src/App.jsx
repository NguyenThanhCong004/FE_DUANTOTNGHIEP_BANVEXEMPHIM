import React from 'react';
import { BrowserRouter as Router, useNavigate } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import ScrollToTop from './utils/ScrollToTop';
import RouteThemeSync from './components/layout/RouteThemeSync';
import { SuperAdminCinemaProvider } from './components/layout/SuperAdminCinemaContext';
import './App.css';

function InternalLinkGuard() {
  const navigate = useNavigate();

  React.useEffect(() => {
    const handleDocumentClick = (event) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const anchor = event.target.closest?.('a[href]');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return;
      }

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;

      event.preventDefault();
      const nextPath = `${url.pathname}${url.search}${url.hash}`;
      navigate(nextPath);
    };

    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, [navigate]);

  return null;
}

function App() {
  return (
    <Router>
      <SuperAdminCinemaProvider>
        <InternalLinkGuard />
        <RouteThemeSync />
        <ScrollToTop />
        <div className="App">
          <AppRoutes />
        </div>
      </SuperAdminCinemaProvider>
    </Router>
  );
}

export default App;
