import { Link, useParams } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { FaShoppingCart, FaHeart, FaSearch, FaUser, FaCalendarAlt } from "react-icons/fa";
import LandingFooter from "../components/LandingFooter";

export default function BlogPost() {
  const { items = [] } = useCart();
  const { id } = useParams();

  const blogPosts = [
    {
      id: 1,
      title: "The Ultimate Guide to Choosing Your Business Card",
      content: "Your business card is a reflection of your brand. Learn how to choose the right design, paper, and finish to make a lasting impression. In this guide, we will walk you through the process of creating a business card that stands out and gets you noticed. We will cover everything from the basics of design to the latest trends in business card printing. We will also provide you with a list of our favorite business card designs to inspire you.",
      author: "Benit N",
      date: "October 26, 2025",
      image: "/images/blog-1.jpg",
      category: "Design Tips",
    },
    {
      id: 2,
      title: "5 Creative Ways to Use Flyers for Your Business",
      content: "Flyers are not dead! Discover five innovative ways to use flyers to promote your business and attract new customers. In this article, we will show you how to create effective flyers that get results. We will also provide you with a list of our favorite flyer designs to inspire you.",
      author: "Jane Doe",
      date: "October 22, 2025",
      image: "/images/blog-2.jpg",
      category: "Marketing",
    },
    {
      id: 3,
      title: "The Power of Branded Merchandise",
      content: "Branded merchandise is a powerful tool for building brand loyalty. Learn how to choose the right products for your brand. In this article, we will show you how to create a branded merchandise strategy that works for your business. We will also provide you with a list of our favorite branded merchandise products to inspire you.",
      author: "John Smith",
      date: "October 18, 2025",
      image: "/images/blog-3.jpg",
      category: "Branding",
    },
  ];

  const post = blogPosts.find((post) => post.id === parseInt(id));

  return (
    <div className="font-roboto bg-gray-50">
      <header id="global-header" className="code-section sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-28">
            <Link to="/" className="flex-shrink-0 transition-transform hover:scale-105 duration-300">
              <img src={process.env.PUBLIC_URL + '/images/logo.png'} alt="Impressa Logo" className="h-28 py-2 w-auto" />
            </Link>
            <nav className="hidden lg:flex items-center space-x-8">
              <Link to="/shop" className="text-gray-900 hover:text-blue-800 font-medium transition-colors duration-200">Product Listing</Link>
              <Link to="/about" className="text-gray-900 hover:text-blue-800 font-medium transition-colors duration-200">About Us</Link>
              <Link to="/contact" className="text-gray-900 hover:text-blue-800 font-medium transition-colors duration-200">Contact</Link>
              <Link to="/blog" className="text-blue-800 font-bold">Blog</Link>
            </nav>
            <div className="hidden lg:flex items-center space-x-6">
              <button className="text-gray-500 hover:text-blue-800 transition-colors">
                <FaSearch className="text-xl" />
              </button>
              <Link to="/wishlist" className="text-gray-500 hover:text-blue-800 transition-colors">
                <FaHeart className="text-xl" />
              </Link>
              <Link to="/cart" className="relative text-gray-500 hover:text-blue-800 transition-colors">
                <FaShoppingCart className="text-xl" />
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{items.length}</span>
              </Link>
              <Link to="/login" className="text-gray-900 hover:text-blue-800 font-medium transition-colors duration-200">Login</Link>
              <Link to="/checkout" className="bg-blue-800 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                Get Custom Printing Now
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <img src={process.env.PUBLIC_URL + post.image} alt={post.title} className="w-full h-96 object-cover rounded-lg mb-6" />
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
            <h1 className="text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>{post.title}</h1>
            <p className="text-gray-600 leading-relaxed">{post.content}</p>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
