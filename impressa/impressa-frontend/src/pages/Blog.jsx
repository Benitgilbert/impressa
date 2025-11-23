import Header from "../components/Header";
import LandingFooter from "../components/LandingFooter";
import { Link } from "react-router-dom";
import { FaUser, FaCalendarAlt, FaSearch } from "react-icons/fa";

export default function Blog() {
  const blogPosts = [
    {
      id: 1,
      title: "The Ultimate Guide to Choosing Your Business Card",
      excerpt: "Your business card is a reflection of your brand. Learn how to choose the right design, paper, and finish to make a lasting impression.",
      author: "Benit N",
      date: "October 26, 2025",
      image: "/images/blog-1.jpg",
      category: "Design Tips",
    },
    {
      id: 2,
      title: "5 Creative Ways to Use Flyers for Your Business",
      excerpt: "Flyers are not dead! Discover five innovative ways to use flyers to promote your business and attract new customers.",
      author: "Jane Doe",
      date: "October 22, 2025",
      image: "/images/blog-2.jpg",
      category: "Marketing",
    },
    {
      id: 3,
      title: "The Power of Branded Merchandise",
      excerpt: "Branded merchandise is a powerful tool for building brand loyalty. Learn how to choose the right products for your brand.",
      author: "John Smith",
      date: "October 18, 2025",
      image: "/images/blog-3.jpg",
      category: "Branding",
    },
  ];

  const categories = ["Design Tips", "Marketing", "Branding", "Inspiration"];

  return (
    <div className="font-roboto bg-gray-50">
      <Header />

      <main className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>Impressa Blog</h1>
            <p className="mt-4 text-lg text-gray-600">Insights, tips, and inspiration for your printing projects.</p>
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="space-y-12">
                {blogPosts.map((post) => (
                  <div key={post.title} className="bg-white p-8 rounded-lg shadow-lg">
                    <img src={process.env.PUBLIC_URL + post.image} alt={post.title} className="w-full h-64 object-cover rounded-lg mb-6" />
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <div className="flex items-center">
                        <FaUser className="mr-2" />
                        <span>{post.author}</span>
                      </div>
                      <div className="flex items-center ml-4">
                        <FaCalendarAlt className="mr-2" />
                        <span>{post.date}</span>
                      </div>
                      <div className="ml-4">
                        <Link to="#" className="text-blue-600 hover:underline">{post.category}</Link>
                      </div>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">{post.title}</h2>
                    <p className="text-gray-600 mb-4">{post.excerpt}</p>
                    <Link to={`/blog/${post.id}`} className="text-blue-600 hover:underline font-semibold">Read More &rarr;</Link>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Search</h2>
              <div className="relative">
                <input type="text" placeholder="Search..." className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                <FaSearch className="absolute right-4 top-4 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-6">Categories</h2>
              <ul className="space-y-4">
                {categories.map((category) => (
                  <li key={category}>
                    <Link to="#" className="text-gray-600 hover:text-blue-600 hover:underline">{category}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
