import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn,
  FaEnvelope, FaPhone, FaMapMarkerAlt
} from "react-icons/fa";
import api from "../utils/axiosInstance";

export default function LandingFooter() {
  const [footerData, setFooterData] = useState({
    footerTagline: 'Your premium destination for quality products. Curated collections, exclusive deals, and exceptional service.',
    contactEmail: 'uwanyirigiraeleora@gmail.com',
    contactPhone: '+25078 881 9878',
    contactAddress: 'Building near Bank of Kigali Gicumbi Branch',
    siteName: 'Abelus',
    logo: null,
    socialLinks: { facebook: '', twitter: '', instagram: '', linkedin: '' }
  });

  useEffect(() => {
    const fetchFooterSettings = async () => {
      try {
        const res = await api.get('/site-settings/public');
        const data = res.data; // Axios puts the response body in .data
        if (data.success && data.data) {
          setFooterData(prev => ({
            ...prev,
            footerTagline: data.data.footerTagline || prev.footerTagline,
            contactEmail: data.data.contactEmail || prev.contactEmail,
            contactPhone: data.data.contactPhone || prev.contactPhone,
            contactAddress: data.data.contactAddress || prev.contactAddress,
            siteName: data.data.siteName || prev.siteName,
            logo: data.data.logo || prev.logo,
            socialLinks: data.data.socialLinks || prev.socialLinks
          }));
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
    <footer className="bg-white dark:bg-charcoal-800 text-charcoal-600 dark:text-cream-300 border-t border-cream-200 dark:border-charcoal-700 transition-colors duration-300">
      {/* Main Footer */}
      <div className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

          {/* Brand Column */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-6 no-underline">
              {footerData.logo ? (
                <img src={footerData.logo} alt={footerData.siteName} className="h-10 w-auto object-contain" />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-terracotta-500 to-terracotta-600 rounded-xl flex items-center justify-center font-bold text-xl text-white shadow-lg ring-1 ring-white/10">
                  {footerData.siteName ? footerData.siteName.charAt(0) : 'A'}
                </div>
              )}
              <span className="text-2xl font-bold text-charcoal-800 dark:text-white tracking-tight">
                {footerData.siteName || 'Abelus'}
              </span>
            </Link>

            <p className="text-charcoal-500 dark:text-charcoal-400 mb-6 leading-relaxed">
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
                    className="w-10 h-10 bg-cream-200 dark:bg-charcoal-700 hover:bg-terracotta-500 dark:hover:bg-terracotta-500 rounded-lg flex items-center justify-center text-charcoal-500 dark:text-charcoal-400 hover:text-white dark:hover:text-white transition-all duration-300"
                  >
                    <Icon />
                  </a>
                ) : (
                  <span
                    key={key}
                    className="w-10 h-10 bg-cream-200 dark:bg-charcoal-700 rounded-lg flex items-center justify-center text-charcoal-400 cursor-default"
                  >
                    <Icon />
                  </span>
                )
              ))}
            </div>
          </div>

          {/* Shop Column */}
          <div>
            <h3 className="text-charcoal-800 dark:text-white font-semibold text-lg mb-6">Shop</h3>
            <ul className="space-y-3 p-0 list-none">
              {[
                { label: 'All Products', to: '/shop' },
                { label: 'Print Portal', to: '/print-portal' },
                { label: 'New Arrivals', to: '/shop?category=new' },
                { label: 'Best Sellers', to: '/shop?sort=popular' },
                { label: 'Deals', to: '/daily-deals' },
                { label: 'Gift Cards', to: '/gift-cards' }
              ].map((link, idx) => (
                <li key={idx}>
                  <Link to={link.to} className="hover:text-terracotta-500 dark:hover:text-terracotta-400 transition-colors no-underline text-inherit">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h3 className="text-charcoal-800 dark:text-white font-semibold text-lg mb-6">Company</h3>
            <ul className="space-y-3 p-0 list-none">
              {[
                { label: 'About Us', to: '/about' },
                { label: 'Blog', to: '/blog' },
                { label: 'Contact', to: '/contact' },
                { label: 'FAQ', to: '/faq' },
                { label: 'Careers', to: '/careers' }
              ].map((link, idx) => (
                <li key={idx}>
                  <Link to={link.to} className="hover:text-terracotta-500 dark:hover:text-terracotta-400 transition-colors no-underline text-inherit">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h3 className="text-charcoal-800 dark:text-white font-semibold text-lg mb-6">Get in Touch</h3>
            <ul className="space-y-4 p-0 list-none">
              <li className="flex items-center gap-3">
                <div className="w-10 h-10 bg-cream-200 dark:bg-charcoal-700 rounded-lg flex items-center justify-center text-terracotta-500 dark:text-terracotta-400">
                  <FaEnvelope />
                </div>
                <span className="text-charcoal-600 dark:text-cream-300">{footerData.contactEmail}</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-10 h-10 bg-cream-200 dark:bg-charcoal-700 rounded-lg flex items-center justify-center text-terracotta-500 dark:text-terracotta-400">
                  <FaPhone />
                </div>
                <span className="text-charcoal-600 dark:text-cream-300">{footerData.contactPhone}</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-10 h-10 bg-cream-200 dark:bg-charcoal-700 rounded-lg flex items-center justify-center text-terracotta-500 dark:text-terracotta-400 shrink-0">
                  <FaMapMarkerAlt />
                </div>
                <span className="text-charcoal-600 dark:text-cream-300">{footerData.contactAddress}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-cream-200 dark:border-charcoal-700">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-charcoal-400 dark:text-charcoal-500 text-sm">
              © {new Date().getFullYear()} Abelus. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <Link to="/privacy" className="text-charcoal-400 dark:text-charcoal-500 hover:text-terracotta-500 dark:hover:text-terracotta-400 transition-colors no-underline">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-charcoal-400 dark:text-charcoal-500 hover:text-terracotta-500 dark:hover:text-terracotta-400 transition-colors no-underline">
                Terms of Service
              </Link>
              <Link to="/cookies" className="text-charcoal-400 dark:text-charcoal-500 hover:text-terracotta-500 dark:hover:text-terracotta-400 transition-colors no-underline">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

