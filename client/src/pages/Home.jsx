import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import { Shield, Star, ArrowRight, ChevronRight, Headphones, CreditCard, Zap, Users, Clock, CheckCircle, MapPin, Sparkles, TrendingUp } from 'lucide-react';

/* ── Categories ───────────────────────────────────────── */
const categories = [
    { name: 'Home Cleaning', emoji: '🏠', slug: 'cleaning', gradient: 'from-emerald-50 to-green-100', iconBg: 'bg-emerald-100' },
    { name: 'Plumbing', emoji: '🔧', slug: 'plumbing', gradient: 'from-blue-50 to-cyan-100', iconBg: 'bg-blue-100' },
    { name: 'Electrical', emoji: '⚡', slug: 'electrical', gradient: 'from-amber-50 to-yellow-100', iconBg: 'bg-amber-100' },
    { name: 'Home Repair', emoji: '🛠', slug: 'home-repair', gradient: 'from-rose-50 to-pink-100', iconBg: 'bg-rose-100' },
    { name: 'Appliance Repair', emoji: '❄', slug: 'appliance-repair', gradient: 'from-cyan-50 to-sky-100', iconBg: 'bg-cyan-100' },
    { name: 'Cooking', emoji: '👨‍🍳', slug: 'cooking', gradient: 'from-orange-50 to-amber-100', iconBg: 'bg-orange-100' },
    { name: 'Beauty & Care', emoji: '💄', slug: 'beauty', gradient: 'from-pink-50 to-rose-100', iconBg: 'bg-pink-100' },
    { name: 'Domestic Help', emoji: '🧹', slug: 'domestic-help', gradient: 'from-purple-50 to-violet-100', iconBg: 'bg-purple-100' },
    { name: 'Moving', emoji: '🚚', slug: 'moving', gradient: 'from-indigo-50 to-blue-100', iconBg: 'bg-indigo-100' },
    { name: 'Laundry', emoji: '🧺', slug: 'laundry', gradient: 'from-teal-50 to-emerald-100', iconBg: 'bg-teal-100' },
    { name: 'Garden & Outdoor', emoji: '🌿', slug: 'outdoor', gradient: 'from-lime-50 to-green-100', iconBg: 'bg-lime-100' },
    { name: 'Event Services', emoji: '🎉', slug: 'event', gradient: 'from-yellow-50 to-amber-100', iconBg: 'bg-yellow-100' },
    { name: 'Security', emoji: '🔐', slug: 'security', gradient: 'from-slate-50 to-gray-100', iconBg: 'bg-slate-100' },
];

/* ── Popular Services ─────────────────────────────────── */
const popularServices = [
    { name: 'Bathroom Deep Cleaning', category: 'cleaning', price: 499, rating: 4.8, reviews: 2340, image: '/images/services/bathroom-cleaning.jpg', fallbackEmoji: '🚿', tag: 'Bestseller' },
    { name: 'Kitchen Cleaning', category: 'cleaning', price: 599, rating: 4.9, reviews: 1890, image: '/images/services/kitchen-cleaning.jpg', fallbackEmoji: '🍳', tag: 'Top Rated' },
    { name: 'AC Repair & Service', category: 'appliance-repair', price: 399, rating: 4.7, reviews: 3200, image: '/images/services/ac-repair.jpg', fallbackEmoji: '❄️', tag: null },
    { name: 'Full Home Cleaning', category: 'cleaning', price: 1499, rating: 4.9, reviews: 980, image: '/images/services/home-cleaning.jpg', fallbackEmoji: '🏠', tag: 'Premium' },
    { name: 'Bridal Makeup', category: 'beauty', price: 4999, rating: 4.8, reviews: 560, image: '/images/services/bridal-makeup.jpg', fallbackEmoji: '💍', tag: 'Popular' },
    { name: 'Plumbing Repair', category: 'plumbing', price: 299, rating: 4.6, reviews: 4100, image: '/images/services/plumbing.jpg', fallbackEmoji: '🔧', tag: null },
    { name: 'Electrician Visit', category: 'electrical', price: 199, rating: 4.7, reviews: 5600, image: '/images/services/electrician.jpg', fallbackEmoji: '⚡', tag: 'Most Booked' },
    { name: 'Home Cook Booking', category: 'cooking', price: 799, rating: 4.5, reviews: 780, image: '/images/services/cooking.jpg', fallbackEmoji: '👨‍🍳', tag: null },
];

const testimonials = [
    { name: 'Priya Sharma', city: 'Hyderabad', rating: 5, text: 'Booked a deep cleaning — the team arrived on time and did an amazing job. My apartment has never been cleaner! The live tracking was super helpful.', initials: 'PS', color: 'bg-emerald-500' },
    { name: 'Rahul Verma', city: 'Bangalore', rating: 5, text: "AC wasn't cooling at all. ServiceGo sent a technician in 30 minutes. Fixed it perfectly and charged exactly what was quoted. No surprises!", initials: 'RV', color: 'bg-blue-500' },
    { name: 'Ananya Reddy', city: 'Mumbai', rating: 5, text: 'The bridal makeup service was incredible. The artist was professional, punctual, and talented. All my guests were impressed. Highly recommend!', initials: 'AR', color: 'bg-purple-500' },
];

const Home = () => {
    const [categoryCounts, setCategoryCounts] = useState({});
    const [imgErrors, setImgErrors] = useState({});

    useEffect(() => {
        API.get('/services/category-counts')
            .then(({ data }) => setCategoryCounts(data.data))
            .catch(() => { });
    }, []);

    const handleImgError = (key) => setImgErrors(prev => ({ ...prev, [key]: true }));

    return (
        <div className="bg-white">

            {/* ━━━ HERO ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <section className="relative overflow-hidden">
                {/* Gradient background with subtle pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-dark-900 via-dark-800 to-primary-900" />
                {/* Background image if available */}
                <div className="absolute inset-0">
                    <img src="/images/hero-bg.jpg" alt="" className="w-full h-full object-cover opacity-20" onError={(e) => { e.target.style.display = 'none'; }} />
                </div>
                {/* Decorative elements */}
                <div className="absolute top-20 right-20 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-10 left-10 w-96 h-96 bg-primary-400/5 rounded-full blur-3xl" />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="animate-slide-up">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-500/20 rounded-full text-primary-300 text-xs font-semibold mb-6 border border-primary-500/30">
                                <Sparkles className="w-3.5 h-3.5" /> India's #1 Home Services Platform
                            </div>
                            <h1 className="text-4xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-tight">
                                Book Trusted<br />
                                <span className="bg-gradient-to-r from-primary-300 to-emerald-400 bg-clip-text text-transparent">Home Services</span>
                                <br />in Minutes
                            </h1>
                            <p className="mt-6 text-dark-300 text-lg leading-relaxed max-w-lg">
                                Cleaning, plumbing, electrical, cooking, beauty & 50+ services — verified professionals at your doorstep with real-time tracking.
                            </p>
                            <div className="flex flex-wrap gap-4 mt-10">
                                <Link to="/services"
                                    className="group inline-flex items-center gap-2.5 px-8 py-4 bg-primary-500 text-white font-bold rounded-2xl hover:bg-primary-600 hover:shadow-2xl hover:shadow-primary-500/25 hover:-translate-y-0.5 transition-all duration-300 text-sm">
                                    Book a Service <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </Link>
                                <Link to="/register"
                                    className="inline-flex items-center gap-2 px-8 py-4 glass text-white font-semibold rounded-2xl hover:bg-white/15 transition-all duration-300 text-sm">
                                    Join as Professional
                                </Link>
                            </div>
                        </div>

                        {/* Right side — feature highlights */}
                        <div className="hidden lg:grid grid-cols-2 gap-4 animate-fade-in">
                            {[
                                { emoji: '🧹', title: 'Deep Cleaning', sub: 'From ₹499', bg: 'bg-emerald-500/10' },
                                { emoji: '🔧', title: 'Plumbing', sub: 'From ₹299', bg: 'bg-blue-500/10' },
                                { emoji: '⚡', title: 'Electrical', sub: 'From ₹199', bg: 'bg-amber-500/10' },
                                { emoji: '💄', title: 'Beauty', sub: 'From ₹799', bg: 'bg-pink-500/10' },
                            ].map((item, i) => (
                                <Link key={i} to={`/services`}
                                    className={`${item.bg} glass rounded-2xl p-5 hover:scale-105 transition-all duration-300 cursor-pointer`}
                                    style={{ animationDelay: `${i * 100}ms` }}>
                                    <span className="text-3xl">{item.emoji}</span>
                                    <p className="text-white font-bold text-sm mt-3">{item.title}</p>
                                    <p className="text-dark-400 text-xs mt-1">{item.sub}</p>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ━━━ STATS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <section className="relative -mt-8 z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-3xl shadow-xl shadow-dark-900/5 border border-dark-100 p-6 lg:p-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[
                            { icon: Users, number: '50K+', label: 'Happy Customers', color: 'text-primary-500', bg: 'bg-primary-50' },
                            { icon: Shield, number: '5,000+', label: 'Verified Pros', color: 'text-blue-500', bg: 'bg-blue-50' },
                            { icon: TrendingUp, number: '99.2%', label: 'Satisfaction Rate', color: 'text-emerald-500', bg: 'bg-emerald-50' },
                            { icon: Headphones, number: '24/7', label: 'Customer Support', color: 'text-purple-500', bg: 'bg-purple-50' },
                        ].map((s, i) => (
                            <div key={i} className="flex items-center gap-4 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                                <div className={`w-12 h-12 ${s.bg} rounded-2xl flex items-center justify-center shrink-0`}>
                                    <s.icon className={`w-5 h-5 ${s.color}`} />
                                </div>
                                <div>
                                    <p className="text-xl lg:text-2xl font-extrabold text-dark-900">{s.number}</p>
                                    <p className="text-xs text-dark-400 font-medium">{s.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ━━━ SERVICE CATEGORIES ━━━━━━━━━━━━━━━━━━━━━━ */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
                <div className="text-center mb-12">
                    <p className="text-primary-500 text-xs font-bold uppercase tracking-widest mb-2">What We Offer</p>
                    <h2 className="text-3xl lg:text-4xl font-extrabold text-dark-900">Browse All Services</h2>
                    <p className="text-dark-400 mt-3 max-w-lg mx-auto">Choose from 50+ professional services — trusted, verified, and delivered to your doorstep</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 stagger-children">
                    {categories.map((cat) => {
                        const count = categoryCounts[cat.slug] || 0;
                        return (
                            <Link
                                key={cat.slug}
                                to={`/services?category=${cat.slug}`}
                                className="group bg-white rounded-2xl border border-dark-100 hover:border-primary-200 hover:shadow-xl hover:shadow-primary-500/5 hover:-translate-y-1 transition-all duration-300 p-6 text-center animate-fade-in"
                            >
                                <div className={`w-16 h-16 mx-auto ${cat.iconBg} rounded-2xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform duration-300`}>
                                    {cat.emoji}
                                </div>
                                <h3 className="text-sm font-bold text-dark-800 group-hover:text-primary-500 transition-colors">{cat.name}</h3>
                                <p className="text-[11px] text-dark-400 mt-1.5 font-medium">
                                    {count > 0 ? `${count} service${count > 1 ? 's' : ''} available` : 'Coming soon'}
                                </p>
                            </Link>
                        );
                    })}
                </div>
                <div className="text-center mt-10">
                    <Link to="/services" className="inline-flex items-center gap-2 px-8 py-3.5 bg-dark-900 text-white font-bold rounded-2xl hover:bg-dark-800 hover:-translate-y-0.5 transition-all duration-300 text-sm">
                        View All Services <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </section>

            {/* ━━━ POPULAR SERVICES ━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <section className="bg-gradient-to-b from-dark-50 to-white py-16 lg:py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-end justify-between mb-10">
                        <div>
                            <p className="text-primary-500 text-xs font-bold uppercase tracking-widest mb-2">Top Picks</p>
                            <h2 className="text-3xl lg:text-4xl font-extrabold text-dark-900">Popular Services</h2>
                        </div>
                        <Link to="/services" className="text-primary-500 text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all">
                            See All <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide">
                        {popularServices.map((s, i) => (
                            <Link
                                key={i}
                                to={`/services?category=${s.category}`}
                                className="shrink-0 w-64 bg-white rounded-2xl border border-dark-100 hover:shadow-xl hover:shadow-dark-900/5 hover:-translate-y-1 transition-all duration-300 overflow-hidden group"
                            >
                                {/* Image */}
                                <div className="h-40 bg-gradient-to-br from-dark-100 to-dark-50 flex items-center justify-center overflow-hidden relative">
                                    {!imgErrors[i] ? (
                                        <img src={s.image} alt={s.name}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            onError={() => handleImgError(i)} />
                                    ) : (
                                        <span className="text-5xl animate-float">{s.fallbackEmoji}</span>
                                    )}
                                    {s.tag && (
                                        <span className="absolute top-3 left-3 px-3 py-1 bg-primary-500 text-white text-[10px] font-bold rounded-lg shadow-lg">{s.tag}</span>
                                    )}
                                </div>
                                <div className="p-5">
                                    <h3 className="text-sm font-bold text-dark-800 line-clamp-2 group-hover:text-primary-600 transition-colors">{s.name}</h3>
                                    <div className="flex items-center gap-1.5 mt-2">
                                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                        <span className="text-xs font-bold text-dark-700">{s.rating}</span>
                                        <span className="text-[10px] text-dark-400">({s.reviews.toLocaleString()})</span>
                                    </div>
                                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-dark-100">
                                        <div>
                                            <span className="text-lg font-extrabold text-dark-900">₹{s.price}</span>
                                            <span className="text-[10px] text-dark-400 ml-1">onwards</span>
                                        </div>
                                        <span className="px-4 py-1.5 bg-primary-500 text-white text-xs font-bold rounded-xl group-hover:bg-primary-600 transition-colors">Book</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ━━━ WHY CHOOSE US ━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
                <div className="text-center mb-12">
                    <p className="text-primary-500 text-xs font-bold uppercase tracking-widest mb-2">Why ServiceGo</p>
                    <h2 className="text-3xl lg:text-4xl font-extrabold text-dark-900">Trusted by Thousands</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
                    {[
                        { icon: Shield, title: 'Verified Pros', desc: 'Background-checked & trained experts', color: 'text-emerald-500', bg: 'bg-emerald-50' },
                        { icon: CreditCard, title: 'Fair Pricing', desc: 'Transparent — no hidden charges', color: 'text-blue-500', bg: 'bg-blue-50' },
                        { icon: Zap, title: '60s Booking', desc: 'Book any service in seconds', color: 'text-amber-500', bg: 'bg-amber-50' },
                        { icon: MapPin, title: 'Live Tracking', desc: 'Track your pro in real-time', color: 'text-purple-500', bg: 'bg-purple-50' },
                        { icon: Headphones, title: '24/7 Support', desc: 'Always here to help you', color: 'text-rose-500', bg: 'bg-rose-50' },
                    ].map((f, i) => (
                        <div key={i} className="text-center group">
                            <div className={`w-16 h-16 mx-auto ${f.bg} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                                <f.icon className={`w-7 h-7 ${f.color}`} />
                            </div>
                            <h3 className="text-sm font-bold text-dark-800 mb-1">{f.title}</h3>
                            <p className="text-xs text-dark-400 leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ━━━ HOW IT WORKS ━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <section className="bg-dark-50 py-16 lg:py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <p className="text-primary-500 text-xs font-bold uppercase tracking-widest mb-2">Simple Process</p>
                        <h2 className="text-3xl lg:text-4xl font-extrabold text-dark-900">How It Works</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                        {[
                            { step: '01', title: 'Choose a Service', desc: 'Browse 13+ categories and pick what you need', emoji: '📋', color: 'from-emerald-500 to-green-600' },
                            { step: '02', title: 'Select Time Slot', desc: 'Pick a convenient date and time', emoji: '📅', color: 'from-blue-500 to-indigo-600' },
                            { step: '03', title: 'Pro Arrives', desc: 'Verified expert arrives — track live on map', emoji: '🏠', color: 'from-purple-500 to-violet-600' },
                        ].map((item) => (
                            <div key={item.step} className="relative text-center bg-white rounded-3xl p-8 border border-dark-100 hover:shadow-xl hover:shadow-dark-900/5 hover:-translate-y-1 transition-all duration-300">
                                <div className="text-4xl mb-5 animate-float" style={{ animationDelay: `${parseInt(item.step) * 200}ms` }}>{item.emoji}</div>
                                <div className={`w-10 h-10 mx-auto bg-gradient-to-br ${item.color} text-white text-sm font-bold rounded-xl flex items-center justify-center mb-4 shadow-lg`}>
                                    {item.step}
                                </div>
                                <h3 className="text-base font-bold text-dark-800 mb-2">{item.title}</h3>
                                <p className="text-sm text-dark-400">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ━━━ TESTIMONIALS ━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
                <div className="text-center mb-12">
                    <p className="text-primary-500 text-xs font-bold uppercase tracking-widest mb-2">Customer Love</p>
                    <h2 className="text-3xl lg:text-4xl font-extrabold text-dark-900">What People Say</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {testimonials.map((t, i) => (
                        <div key={i} className="bg-white rounded-3xl border border-dark-100 p-7 hover:shadow-xl hover:shadow-dark-900/5 hover:-translate-y-1 transition-all duration-300 relative">
                            {/* Large quote mark */}
                            <div className="absolute top-5 right-6 text-5xl text-dark-100 font-serif leading-none select-none">"</div>

                            <div className="flex items-center gap-1.5 mb-5">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <Star key={s} className={`w-4 h-4 ${s <= t.rating ? 'text-amber-400 fill-amber-400' : 'text-dark-200'}`} />
                                ))}
                            </div>
                            <p className="text-sm text-dark-600 leading-relaxed mb-6 relative z-10">"{t.text}"</p>
                            <div className="flex items-center gap-3 pt-5 border-t border-dark-100">
                                <div className={`w-11 h-11 ${t.color} rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg`}>
                                    {t.initials}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-dark-800">{t.name}</p>
                                    <p className="text-xs text-dark-400 flex items-center gap-1"><MapPin className="w-3 h-3" /> {t.city}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ━━━ CTA ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
                <div className="relative bg-gradient-to-br from-dark-900 via-dark-800 to-primary-900 rounded-[2rem] p-12 lg:p-16 text-center overflow-hidden">
                    {/* Decorative blurs */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/15 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />

                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-500/20 rounded-full text-primary-300 text-xs font-semibold mb-6 border border-primary-500/30">
                            <CheckCircle className="w-3.5 h-3.5" /> Get Started for Free
                        </div>
                        <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-4">Ready to Transform Your Home?</h2>
                        <p className="text-dark-300 max-w-lg mx-auto mb-8 text-sm leading-relaxed">
                            Join 50,000+ happy customers. Book any service in under 60 seconds with verified professionals.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <Link to="/services"
                                className="group px-8 py-4 bg-primary-500 text-white font-bold rounded-2xl hover:bg-primary-600 hover:shadow-2xl hover:shadow-primary-500/30 hover:-translate-y-0.5 transition-all duration-300 text-sm flex items-center gap-2">
                                Explore Services <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link to="/register"
                                className="px-8 py-4 glass text-white font-semibold rounded-2xl hover:bg-white/15 transition-all duration-300 text-sm">
                                Create Free Account
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
