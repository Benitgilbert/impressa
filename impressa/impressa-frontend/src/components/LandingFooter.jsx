import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn,
  FaEnvelope, FaPhone, FaMapMarkerAlt
} from "react-icons/fa";

export default function LandingFooter() {
  const [footerData, setFooterData] = useState({
    footerTagline: 'Your premium destination for quality products. Curated collections, exclusive deals, and exceptional service.',
    contactEmail: 'support@impressa.com',
    contactPhone: '1-800-IMPRESSA',
    contactAddress: '123 Commerce Street, Design City, DC 12345',
    socialLinks: { facebook: '', twitter: '', instagram: '', linkedin: '' }
  });

  useEffect(() => {
    const fetchFooterSettings = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/site-settings/public');
        const data = await res.json();
        if (data.success && data.data) {
          setFooterData({
            footerTagline: data.data.footerTagline || footerData.footerTagline,
            contactEmail: data.data.contactEmail || footerData.contactEmail,
            contactPhone: data.data.contactPhone || footerData.contactPhone,
            contactAddress: data.data.contactAddress || footerData.contactAddress,
            socialLinks: data.data.socialLinks || footerData.socialLinks
          });
        }
      } catch (error) {
        console.error('Error fetching footer settings:', error);
      }
    };
    fetchFooterSettings();
  }, []);

  const socialIcons = [
    { key: 'facebook', Icon: FaFacebookF, url: footerData.socialLinks.facebook },
    { key: 'twitter', Icon: FaTwitter, url: footerData.socialLinks.twitter },
    { key: 'instagram', Icon: FaInstagram, url: footerData.socialLinks.instagram },
    { key: 'linkedin', Icon: FaLinkedinIn, url: footerData.socialLinks.linkedin }
  ];

  return (
    <footer className="bg-white dark:bg-slate-900 text-gray-600 dark:text-gray-300 border-t border-gray-100 dark:border-slate-800 transition-colors duration-300">
      {/* Main Footer */}
      <div className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

          {/* Brand Column */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-6 no-underline">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center font-bold text-xl text-white shadow-lg">
                I
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Impressa</span>
            </Link>
            <p className="text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
              {footerData.footerTagline}
            </p>
            <div className="flex gap-3">
              {socialIcons.map(({ key, Icon, url }) => (
                url ? (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-gray-100 dark:bg-slate-800 hover:bg-violet-600 dark:hover:bg-violet-600 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-white dark:hover:text-white transition-all duration-300"
                  >
                    <Icon />
                  </a>
                ) : (
                  <span
                    key={key}
                    className="w-10 h-10 bg-gray-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-gray-400 cursor-default"
                  >
                    <Icon />
                  </span>
                )
              ))}
            </div>
          </div>

          {/* Shop Column */}
          <div>
            <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-6">Shop</h3>
            <ul className="space-y-3 p-0 list-none">
              {[
                { label: 'All Products', to: '/shop' },
                { label: 'New Arrivals', to: '/shop?category=new' },
                { label: 'Best Sellers', to: '/shop?sort=popular' },
                { label: 'Deals', to: '/daily-deals' },
                { label: 'Gift Cards', to: '/gift-cards' }
              ].map((link, idx) => (
                <li key={idx}>
                  <Link to={link.to} className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors no-underline text-inherit">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-6">Company</h3>
            <ul className="space-y-3 p-0 list-none">
              {[
                { label: 'About Us', to: '/about' },
                { label: 'Blog', to: '/blog' },
                { label: 'Contact', to: '/contact' },
                { label: 'FAQ', to: '/faq' },
                { label: 'Careers', to: '/careers' }
              ].map((link, idx) => (
                <li key={idx}>
                  <Link to={link.to} className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors no-underline text-inherit">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-6">Get in Touch</h3>
            <ul className="space-y-4 p-0 list-none">
              <li className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-violet-600 dark:text-violet-400">
                  <FaEnvelope />
                </div>
                <span className="text-gray-600 dark:text-gray-300">{footerData.contactEmail}</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-violet-600 dark:text-violet-400">
                  <FaPhone />
                </div>
                <span className="text-gray-600 dark:text-gray-300">{footerData.contactPhone}</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0">
                  <FaMapMarkerAlt />
                </div>
                <span className="text-gray-600 dark:text-gray-300">{footerData.contactAddress}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-100 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              © {new Date().getFullYear()} Impressa. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <Link to="/privacy" className="text-gray-400 dark:text-gray-500 hover:text-violet-600 dark:hover:text-violet-400 transition-colors no-underline">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-gray-400 dark:text-gray-500 hover:text-violet-600 dark:hover:text-violet-400 transition-colors no-underline">
                Terms of Service
              </Link>
              <Link to="/cookies" className="text-gray-400 dark:text-gray-500 hover:text-violet-600 dark:hover:text-violet-400 transition-colors no-underline">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

