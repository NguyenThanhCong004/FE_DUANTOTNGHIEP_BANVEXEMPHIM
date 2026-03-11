import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

const Layout = ({ children }) => {
  return (
    <div className="d-flex flex-column min-vh-100 w-100 m-0 p-0">
      <Navbar />
      <main className="flex-grow-1 w-100 m-0 p-0">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
