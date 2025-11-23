import Header from "../components/Header";
import LandingFooter from "../components/LandingFooter";
import { Link } from "react-router-dom";
import { FaBullseye, FaLightbulb, FaHandshake, FaArrowRight } from "react-icons/fa";

export default function About() {
  const teamMembers = [
    {
      name: "Benit N",
      role: "Founder & CEO",
      image: "/images/team-1.jpg",
      bio: "With a passion for design and a vision for quality, Benit founded Impressa to bring professional printing to everyone."
    },
    {
      name: "Jane Doe",
      role: "Head of Operations",
      image: "/images/team-2.jpg",
      bio: "Jane ensures that every order is printed to perfection and delivered on time, managing the magic behind the scenes."
    },
    {
      name: "John Smith",
      role: "Lead Designer",
      image: "/images/team-3.jpg",
      bio: "John leads our creative team, helping customers bring their ideas to life with stunning and innovative designs."
    },
    {
      name: "Emily White",
      role: "Customer Success Manager",
      image: "/images/team-4.jpg",
      bio: "Emily is dedicated to providing exceptional support, ensuring every customer has a smooth and happy experience."
    }
  ];

  return (
    <div className="font-roboto bg-gray-50">
      <Header />

      <main>
        <section className="code-section relative min-h-[50vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-light-background-color to-white">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 left-10 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
            <div className="absolute top-40 right-20 w-72 h-72 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
              About Impressa
            </h1>
            <p className="mt-4 text-lg sm:text-xl text-gray-500 max-w-3xl mx-auto">
              We're a team of passionate creators, designers, and printers dedicated to bringing your vision to life with exceptional quality and service.
            </p>
          </div>
        </section>

        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>Our Story</h2>
                <p className="text-gray-600 mb-4">
                  Impressa was born from a simple idea: to make high-quality custom printing accessible and easy for everyone. What started in a small workshop has grown into a leading online platform, serving thousands of happy customers across Rwanda.
                </p>
                <p className="text-gray-600">
                  We believe that a great design deserves a great print. That's why we've invested in the latest printing technology and a team of experts who are as passionate about quality as you are about your projects.
                </p>
              </div>
              <div className="relative h-96 rounded-2xl overflow-hidden shadow-xl">
                 <img src={process.env.PUBLIC_URL + '/images/about-us-story.jpg'} alt="Impressa Workshop" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-gray-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-12" style={{ fontFamily: "'Poppins', sans-serif" }}>Our Mission & Values</h2>
            <div className="grid sm:grid-cols-1 md:grid-cols-3 gap-10">
              <div className="p-8 bg-white rounded-xl shadow-lg">
                <FaLightbulb className="text-4xl text-yellow-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Innovation</h3>
                <p className="text-gray-600">We constantly explore new techniques and materials to offer the best printing solutions.</p>
              </div>
              <div className="p-8 bg-white rounded-xl shadow-lg">
                <FaBullseye className="text-4xl text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Quality</h3>
                <p className="text-gray-600">From the simplest card to the largest banner, we guarantee excellence in every print.</p>
              </div>
              <div className="p-8 bg-white rounded-xl shadow-lg">
                <FaHandshake className="text-4xl text-blue-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Partnership</h3>
                <p className="text-gray-600">We work with you as a partner to ensure your vision is perfectly realized.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>Meet Our Team</h2>
              <p className="mt-4 text-lg text-gray-600">The people behind the prints.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {teamMembers.map((member) => (
                <div key={member.name} className="text-center">
                  <img className="w-40 h-40 rounded-full mx-auto mb-4 shadow-lg object-cover" src={process.env.PUBLIC_URL + member.image} alt={member.name} />
                  <h3 className="text-lg font-semibold text-gray-900">{member.name}</h3>
                  <p className="text-blue-800 font-medium">{member.role}</p>
                  <p className="text-sm text-gray-500 mt-2">{member.bio}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-blue-800">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>Ready to Create?</h2>
            <p className="text-blue-200 text-lg mb-8">
              Join thousands of businesses and individuals who trust Impressa for their printing needs.
            </p>
            <Link to="/shop" className="inline-flex items-center bg-white text-blue-800 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-200 transition-all duration-300 shadow-xl">
              Explore Products <FaArrowRight className="ml-2" />
            </Link>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}