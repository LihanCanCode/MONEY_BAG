/**
 * @fileoverview Footer Component
 * 
 * Site footer with:
 * - Company branding and description
 * - Navigation links organized in columns
 * - Social media links
 * - Social media icon buttons
 * - Responsive grid layout
 */

import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Footer Component
 * 
 * Full-width footer providing:
 * - Company information and branding
 * - Quick navigation links (Home, Services, About, Shop)
 * - Social media links (Facebook, Twitter, GitHub, Instagram)
 * - Visual social media icons with hover effects
 * 
 * Layout is responsive and organized in a multi-column grid.
 * 
 * @returns {JSX.Element} Footer component
 */
const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        
        {/* ==========================================
            COMPANY INFO SECTION
            ========================================== */}
        <div className="footer-section">
          <h3 className="footer-brand">Moneybag</h3>
          <p className="footer-description">
            Fusce polines magna a consectetur. Cras tristique, nibh sed lorem 
            ultricies, dolor nisl congue.
          </p>
        </div>

        {/* ==========================================
            QUICK NAVIGATION LINKS
            ========================================== */}
        <div className="footer-section">
          <h4 className="footer-heading">Links</h4>
          <ul className="footer-links">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/services">Services</Link></li>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/shop">Our Shop</Link></li>
          </ul>
        </div>

        {/* ==========================================
            SOCIAL MEDIA LINKS
            ========================================== */}
        <div className="footer-section">
          <h4 className="footer-heading">Socials</h4>
          <ul className="footer-links">
            <li><a href="https://facebook.com" target="_blank" rel="noopener noreferrer">Facebook</a></li>
            <li><a href="https://twitter.com" target="_blank" rel="noopener noreferrer">Twitter</a></li>
            <li><a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a></li>
            <li><a href="https://instagram.com" target="_blank" rel="noopener noreferrer">Instagram</a></li>
          </ul>
        </div>
      </div>

      {/* ==========================================
          SOCIAL MEDIA ICON BUTTONS
          Interactive icons with hover effects
          ========================================== */}
      <div className="footer-social-icons">
        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-icon twitter">
          <i className="fab fa-twitter">🐦</i>
        </a>
        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-icon instagram">
          <i className="fab fa-instagram">📷</i>
        </a>
        <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="social-icon linkedin">
          <i className="fab fa-linkedin">in</i>
        </a>
        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-icon facebook">
          <i className="fab fa-facebook">f</i>
        </a>
        <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="social-icon youtube">
          <i className="fab fa-youtube">▶️</i>
        </a>
        <a href="https://dribbble.com" target="_blank" rel="noopener noreferrer" className="social-icon dribbble">
          <i className="fab fa-dribbble">⚽</i>
        </a>
      </div>
    </footer>
  );
};

export default Footer;
