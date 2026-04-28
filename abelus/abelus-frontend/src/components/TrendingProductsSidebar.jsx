import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../utils/axiosInstance";
import assetUrl from "../utils/assetUrl";
import { FaStar, FaArrowRight } from "react-icons/fa";

const getRating = (rating) => {
    if (!rating) return 0;
    if (Array.isArray(rating)) {
        if (rating.length === 0) return 0;
        const sum = rating.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
        return sum / rating.length;
    }
    return Number(rating);
};

function TrendingProductsSidebar() {
    const [products, setProducts] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const fetchTrending = async () => {
            try {
                const res = await api.get("/products/trending");
                if (res.data && res.data.length > 0) {
                    setProducts(res.data.slice(0, 5)); // Take top 5
                }
            } catch (err) {
                console.error("Failed to fetch trending products:", err);
            }
        };
        fetchTrending();
    }, []);

    // Auto-rotate carousel
    useEffect(() => {
        if (products.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % products.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [products]);

    if (products.length === 0) {
        return (
            <div className="hidden lg:flex w-1/2 relative bg-gradient-to-br from-violet-900 via-indigo-900 to-slate-900 overflow-hidden text-white flex-col items-center justify-center text-center p-12">
                <h1 className="text-4xl font-black mb-4 tracking-tighter">ABELUS</h1>
                <p className="text-xl text-violet-200 font-medium tracking-wide">Premium Shopping Experience</p>
                <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20 pointer-events-none"></div>
            </div>
        );
    }

    const currentProduct = products[currentIndex];

    return (
        <div className="hidden lg:flex w-1/2 relative bg-slate-900 overflow-hidden text-white">
            {/* Background Image Layer */}
            <div className="absolute inset-0 z-0">
                <img
                    src={assetUrl(currentProduct.images?.[0] || currentProduct.image)}
                    alt="Background"
                    className="w-full h-full object-cover opacity-30 blur-2xl scale-110 transition-all duration-1000 ease-in-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent"></div>
            </div>

            <div className="relative z-10 flex flex-col justify-between w-full h-full p-16">
                <div className="flex justify-between items-start">
                    <div className="bg-white/10 backdrop-blur-xl px-6 py-2.5 rounded-full border border-white/20 text-[10px] font-black uppercase tracking-[0.2em]">
                        Trending Now
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <div className="flex gap-1 text-amber-400">
                            {[...Array(5)].map((_, i) => (
                                <FaStar key={i} className={`${i < getRating(currentProduct.averageRating) ? "text-amber-400" : "text-white/20"} text-sm`} />
                            ))}
                        </div>
                        <span className="text-[10px] text-white/60 font-medium">({getRating(currentProduct.averageRating).toFixed(1)})</span>
                    </div>
                </div>

                <div className="flex flex-col items-center text-center">
                    <div className="relative w-80 h-80 mb-12 group cursor-pointer">
                        <div className="absolute inset-0 bg-violet-600 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                        <img
                            src={assetUrl(currentProduct.images?.[0] || currentProduct.image)}
                            alt={currentProduct.name}
                            className="relative w-full h-full object-contain drop-shadow-[0_35px_35px_rgba(0,0,0,0.5)] transform group-hover:scale-110 transition-transform duration-700 ease-out"
                        />
                    </div>

                    <h2 className="text-4xl font-black mb-4 tracking-tight leading-tight max-w-md">
                        {currentProduct.name}
                    </h2>
                    <p className="text-2xl text-violet-300 font-bold mb-10">
                        {currentProduct.price?.toLocaleString()} RWF
                    </p>

                    <Link
                        to={`/product/${currentProduct._id}`}
                        className="inline-flex items-center gap-3 px-10 py-5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white/20 transition-all group"
                    >
                        View Details
                        <FaArrowRight className="group-hover:translate-x-2 transition-transform duration-300" />
                    </Link>
                </div>

                <div className="flex justify-center gap-4">
                    {products.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={`h-1.5 rounded-full transition-all duration-500 ${idx === currentIndex ? "w-12 bg-white" : "w-3 bg-white/30 hover:bg-white/50"}`}
                        />
                    ))}
                </div>
            </div>

            <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-10 pointer-events-none z-20"></div>
        </div>
    );
}

export default TrendingProductsSidebar;
