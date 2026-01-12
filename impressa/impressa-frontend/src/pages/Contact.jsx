import { useState, useEffect } from "react";
import Header from "../components/Header";
import LandingFooter from "../components/LandingFooter";
import { FaPhoneAlt, FaEnvelope, FaMapMarkerAlt } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

export default function Contact() {
  const { items = [] } = useCart();
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
        const res = await fetch(`${API_URL}/site-settings/public`);
        const data = await res.json();
        if (data.success) setSettings(data.data);
      } catch (err) {
        console.error("Failed to fetch site settings:", err);
      }
    };
    fetchSettings();
  }, []);

  const mapSource = settings?.googleMapsQuery
    ? `https://maps.google.com/maps?q=${encodeURIComponent(settings.googleMapsQuery)}&t=&z=15&ie=UTF8&iwloc=&output=embed`
    : "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3987.523336224859!2d30.06034561475492!3d-1.94399399859239!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x19dca4247de48c37%3A0x6d3b3a4a9f7d6d3c!2sKigali%2C%20Rwanda!5e0!3m2!1sen!2sus!4v1620052300000!5m2!1sen!2sus";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 overflow-hidden bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-10 left-10 w-72 h-72 bg-violet-200 dark:bg-violet-900/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
            <div className="absolute top-20 right-20 w-72 h-72 bg-indigo-200 dark:bg-indigo-900/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-200 dark:bg-blue-900/10 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
          </div>
          <div className="relative mx-auto max-w-7xl px-4 text-center">
            <h1 className="text-5xl md:text-7xl font-black text-gray-900 dark:text-white mb-8 tracking-tight">
              Get in <span className="text-violet-600 dark:text-violet-400">Touch</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
              {settings?.tagline || "We are here to help. Send us a message and we will get back to you as soon as possible."}
            </p>
          </div>
        </section>

        <section className="py-20 md:py-32">
          <div className="mx-auto max-w-7xl px-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Form Card */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-8 md:p-12 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-slate-800">
                <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-8">Send us a Message</h2>
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest pl-1">Name</label>
                      <input
                        type="text"
                        name="name"
                        id="name"
                        className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl py-4 px-6 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none transition-all placeholder:text-gray-400"
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest pl-1">Email</label>
                      <input
                        type="email"
                        name="email"
                        id="email"
                        className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl py-4 px-6 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none transition-all placeholder:text-gray-400"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="subject" className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest pl-1">Subject</label>
                    <input
                      type="text"
                      name="subject"
                      id="subject"
                      className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl py-4 px-6 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none transition-all placeholder:text-gray-400"
                      placeholder="How can we help?"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest pl-1">Message</label>
                    <textarea
                      name="message"
                      id="message"
                      rows="5"
                      className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl py-4 px-6 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none transition-all placeholder:text-gray-400 resize-none"
                      placeholder="Your message here..."
                    ></textarea>
                  </div>
                  <div className="pt-4">
                    <button
                      type="submit"
                      className="w-full md:w-auto px-12 py-5 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-black text-lg transition-all hover:scale-[1.02] shadow-xl shadow-violet-500/25 active:scale-95"
                    >
                      Send Message
                    </button>
                  </div>
                </form>
              </div>

              {/* Info Card */}
              <div className="space-y-8">
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-slate-800 h-full">
                  <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-10">Contact Info</h2>
                  <div className="space-y-12">
                    <div className="flex gap-6 group">
                      <div className="w-14 h-14 bg-violet-50 dark:bg-violet-900/10 rounded-2xl flex items-center justify-center text-violet-600 dark:text-violet-400 transform group-hover:scale-110 transition-transform">
                        <FaMapMarkerAlt className="text-2xl" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 uppercase tracking-widest text-sm opacity-50">Address</h3>
                        <p className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed">{settings?.contactAddress || "123 Impressa Lane, Kigali, Rwanda"}</p>
                      </div>
                    </div>
                    <div className="flex gap-6 group">
                      <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 transform group-hover:scale-110 transition-transform">
                        <FaPhoneAlt className="text-2xl" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 uppercase tracking-widest text-sm opacity-50">Phone</h3>
                        <p className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed">{settings?.contactPhone || "(+250) 788 123 456"}</p>
                      </div>
                    </div>
                    <div className="flex gap-6 group">
                      <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/10 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 transform group-hover:scale-110 transition-transform">
                        <FaEnvelope className="text-2xl" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 uppercase tracking-widest text-sm opacity-50">Email</h3>
                        <p className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
                          <a href={`mailto:${settings?.contactEmail || "contact@impressa.com"}`} className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">{settings?.contactEmail || "contact@impressa.com"}</a>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Map Section */}
        <section className="h-[500px] w-full bg-gray-100 dark:bg-slate-800 grayscale dark:grayscale-0 hover:grayscale-0 transition-all duration-700">
          <iframe
            src={mapSource}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            title="Google Map"
          ></iframe>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
