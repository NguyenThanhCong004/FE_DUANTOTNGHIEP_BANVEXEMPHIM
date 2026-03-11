import React from 'react';
import { Link } from 'react-router-dom';

const SectionHeader = ({ title, gradient, linkText, linkTo, icon, centered = false, linkColorClass = "" }) => {
  const containerClass = centered ? "text-center mb-5" : "d-flex justify-content-between align-items-center mb-5";
  const titleClass = centered ? "fw-black text-dark text-uppercase tracking-tighter display-4 mb-3" : "fw-black text-white text-uppercase m-0 tracking-tighter fs-1";
  const underlineClass = centered ? "mx-auto" : "";

  return (
    <div className={containerClass}>
      <div className={centered ? "" : "d-flex flex-column"}>
        <h2 className={titleClass} style={{ fontWeight: 900 }}>{title}</h2>
        <div className={underlineClass} style={{ height: '6px', width: centered ? '100px' : '80px', background: gradient, borderRadius: '10px' }}></div>
      </div>
      {!centered && linkTo && (
        <Link to={linkTo} className={`fw-bold text-decoration-none ${linkColorClass}`}>
          {linkText} <i className={`${icon} ms-2`}></i>
        </Link>
      )}
    </div>
  );
};

export default SectionHeader;
