import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import ScrollToTop from './utils/ScrollToTop';
import RouteThemeSync from './components/layout/RouteThemeSync';
import { SuperAdminCinemaProvider } from './components/layout/SuperAdminCinemaContext';
import './App.css';

function App() {
  return (
    <Router>
      <SuperAdminCinemaProvider>
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
