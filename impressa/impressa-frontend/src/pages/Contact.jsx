import Header from "../components/Header";
import LandingFooter from "../components/LandingFooter";
import { FaPhoneAlt, FaEnvelope, FaMapMarkerAlt } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

export default function Contact() {
  const { items = [] } = useCart();
  
  return (
    <div className="font-roboto bg-gray-50">
      <Header />

      <main className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>Get in Touch</h1>
            <p className="mt-4 text-lg text-gray-600">We are here to help. Send us a message and we will get back to you as soon as possible.</p>
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-8 rounded-lg shadow-lg">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Send us a Message</h2>
              <form>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                    <input type="text" name="name" id="name" className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                    <input type="email" name="email" id="email" className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                </div>
                <div className="mt-6">
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700">Subject</label>
                  <input type="text" name="subject" id="subject" className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div className="mt-6">
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700">Message</label>
                  <textarea name="message" id="message" rows="4" className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"></textarea>
                </div>
                <div className="mt-6 text-right">
                  <button type="submit" className="bg-blue-800 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                    Send Message
                  </button>
                </div>
              </form>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Contact Information</h2>
              <div className="space-y-6">
                <div className="flex items-start">
                  <FaMapMarkerAlt className="text-2xl text-blue-800 mt-1" />
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-800">Address</h3>
                    <p className="text-gray-600">123 Impressa Lane, Kigali, Rwanda</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <FaPhoneAlt className="text-2xl text-blue-800 mt-1 transform scale-x-[-1]" />
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-800">Phone</h3>
                    <p className="text-gray-600">(+250) 788 123 456</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <FaEnvelope className="text-2xl text-blue-800 mt-1" />
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-800">Email</h3>
                    <p className="text-gray-600">
                      <a href="mailto:contact@impressa.com" className="text-blue-600 hover:underline">contact@impressa.com</a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-16">
          <div className="h-96 bg-gray-200">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3987.523336224859!2d30.06034561475492!3d-1.94399399859239!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x19dca4247de48c37%3A0x6d3b3a4a9f7d6d3c!2sKigali%2C%20Rwanda!5e0!3m2!1sen!2sus!4v1620052300000!5m2!1sen!2sus"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              title="Google Map"
            ></iframe>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
