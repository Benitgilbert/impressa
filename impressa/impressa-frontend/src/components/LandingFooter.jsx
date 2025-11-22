import { Link } from "react-router-dom";
import {
  FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn,
  FaEnvelope, FaPhone, FaMapMarkerAlt, FaPaperPlane
} from "react-icons/fa";

export default function LandingFooter() {
  return (
    <footer id="global-footer" className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          <div>
            <Link to="/" className="inline-block mb-6">
              <img src={process.env.PUBLIC_URL + '/images/logo.png'} alt="Impressa Logo" className="h-16 w-auto" />
            </Link>
            <p className="text-gray-300/80 mb-6">
              Premium custom printing solutions for businesses and individuals. Quality guaranteed, delivered fast.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 bg-white/10 hover:bg-blue-800 rounded-lg flex items-center justify-center transition-all duration-300"><FaFacebookF /></a>
              <a href="#" className="w-10 h-10 bg-white/10 hover:bg-blue-800 rounded-lg flex items-center justify-center transition-all duration-300"><FaTwitter /></a>
              <a href="#" className="w-10 h-10 bg-white/10 hover:bg-blue-800 rounded-lg flex items-center justify-center transition-all duration-300"><FaInstagram /></a>
              <a href="#" className="w-10 h-10 bg-white/10 hover:bg-blue-800 rounded-lg flex items-center justify-center transition-all duration-300"><FaLinkedinIn /></a>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-6">Products</h3>
            <ul className="space-y-3">
              <li><Link to="/shop" className="text-gray-300/80 hover:text-white transition-colors">All Products</Link></li>
              <li><Link to="/shop?category=id-cards" className="text-gray-300/80 hover:text-white transition-colors">ID Cards</Link></li>
              <li><Link to="/shop?category=photo-frames" className="text-gray-300/80 hover:text-white transition-colors">Photo Frames</Link></li>
              <li><Link to="/shop?category=banners" className="text-gray-300/80 hover:text-white transition-colors">Banners</Link></li>
              <li><Link to="/shop?category=tote-bags" className="text-gray-300/80 hover:text-white transition-colors">Tote Bags</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-6">Company</h3>
            <ul className="space-y-3">
              <li><Link to="/about" className="text-gray-300/80 hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/blog" className="text-gray-300/80 hover:text-white transition-colors">Blog</Link></li>
              <li><Link to="/contact" className="text-gray-300/80 hover:text-white transition-colors">Contact</Link></li>
              <li><Link to="/faq" className="text-gray-300/80 hover:text-white transition-colors">FAQ</Link></li>
              <li><Link to="/orders" className="text-gray-300/80 hover:text-white transition-colors">Order History</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-6">Stay Connected</h3>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start space-x-2"><FaEnvelope className="mt-1" /><span className="text-gray-300/80">support@impressa.com</span></li>
              <li className="flex items-start space-x-2"><FaPhone className="mt-1" /><span className="text-gray-300/80">1-800-IMPRESSA</span></li>
              <li className="flex items-start space-x-2"><FaMapMarkerAlt className="mt-1" /><span className="text-gray-300/80">123 Print Street, Design City, DC 12345</span></li>
            </ul>
            <div>
              <p className="text-sm mb-3">Subscribe to our newsletter</p>
              <form className="flex gap-2">
                <input type="email" name="email" placeholder="Your email" className="flex-1 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-blue-800" />
                <button type="submit" className="bg-blue-800 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors">
                  <FaPaperPlane />
                </button>
              </form>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-300/60 text-sm">© 2025 Impressa. All rights reserved.</p>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <Link to="/privacy" className="text-gray-300/60 hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="text-gray-300/60 hover:text-white transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
