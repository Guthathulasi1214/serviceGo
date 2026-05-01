import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import API from '../api/axios';
import { useCart } from '../context/CartContext';
import { Search, Filter, ShoppingCart, Star, Clock, Plus, Check, Shield, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

const allCategories = [
    { label: 'All', value: '', emoji: '' },
    { label: 'Home Cleaning', value: 'cleaning', emoji: '🏠' },
    { label: 'Plumbing', value: 'plumbing', emoji: '🔧' },
    { label: 'Electrical', value: 'electrical', emoji: '⚡' },
    { label: 'Home Repair', value: 'home-repair', emoji: '🛠' },
    { label: 'Appliance Repair', value: 'appliance-repair', emoji: '❄' },
    { label: 'Cooking', value: 'cooking', emoji: '👨‍🍳' },
    { label: 'Beauty & Care', value: 'beauty', emoji: '💄' },
    { label: 'Domestic Help', value: 'domestic-help', emoji: '🧹' },
    { label: 'Moving', value: 'moving', emoji: '🚚' },
    { label: 'Laundry', value: 'laundry', emoji: '🧺' },
    { label: 'Garden', value: 'outdoor', emoji: '🌿' },
    { label: 'Events', value: 'event', emoji: '🎉' },
    { label: 'Security', value: 'security', emoji: '🔐' },
    { label: 'Pet Services', value: 'pet-services', emoji: '🐾' },
];

const Services = () => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchParams, setSearchParams] = useSearchParams();
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const { items, addToCart } = useCart();

    const currentCategory = searchParams.get('category') || '';

    useEffect(() => {
        fetchServices();
    }, [currentCategory]);

    const fetchServices = async () => {
        setLoading(true);
        try {
            const params = {};
            if (currentCategory) params.category = currentCategory;
            if (search) params.search = search;
            const { data } = await API.get('/services', { params });
            setServices(data.data);
        } catch {
            toast.error('Failed to load services');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchServices();
    };

    const handleCategoryChange = (value) => {
        if (value) {
            setSearchParams({ category: value });
        } else {
            setSearchParams({});
        }
    };

    const isInCart = (serviceId) => items.some((item) => item._id === serviceId);

    const handleAddToCart = (service) => {
        addToCart(service);
        toast.success(`${service.name} added to cart!`);
    };

    const currentCat = allCategories.find(c => c.value === currentCategory);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-extrabold text-dark-900">
                    {currentCat?.value ? `${currentCat.emoji} ${currentCat.label}` : 'All Services'}
                </h1>
                <p className="text-dark-400 text-sm mt-1">
                    {services.length} services available • Verified professionals • Transparent pricing
                </p>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="mb-5">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search for a specific service..."
                        className="w-full pl-11 pr-4 py-3 bg-dark-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/30 focus:bg-white border border-transparent focus:border-primary-300 transition-all"
                    />
                </div>
            </form>

            {/* Category Pills */}
            <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-6">
                {allCategories.map((cat) => (
                    <button
                        key={cat.value}
                        onClick={() => handleCategoryChange(cat.value)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${currentCategory === cat.value
                            ? 'bg-primary-500 text-white shadow-sm'
                            : 'bg-white text-dark-600 border border-dark-200 hover:border-primary-300'
                            }`}
                    >
                        {cat.emoji && <span>{cat.emoji}</span>}
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Services Grid */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-dark-200 p-4 animate-pulse">
                            <div className="h-12 w-12 bg-dark-100 rounded-xl mb-3" />
                            <div className="h-4 bg-dark-100 rounded w-3/4 mb-2" />
                            <div className="h-3 bg-dark-100 rounded w-1/2" />
                        </div>
                    ))}
                </div>
            ) : services.length === 0 ? (
                <div className="text-center py-20">
                    <Filter className="w-14 h-14 text-dark-200 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-dark-700">No services found</h3>
                    <p className="text-dark-400 text-sm mt-2">Try a different category or search term</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {services.map((service) => (
                        <div
                            key={service._id}
                            className="bg-white rounded-2xl border border-dark-200 hover:border-primary-300 hover:shadow-md transition-all p-5 group"
                        >
                            {/* Top Row: Category + Verified */}
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs px-2.5 py-1 bg-dark-100 text-dark-500 rounded-lg font-medium capitalize">
                                    {service.category}
                                </span>
                                {service.provider?.isVerified && (
                                    <span className="flex items-center gap-1 text-[10px] text-primary-500 font-semibold">
                                        <Shield className="w-3 h-3" /> Verified
                                    </span>
                                )}
                            </div>

                            {/* Service Name */}
                            <h3 className="text-base font-bold text-dark-900 group-hover:text-primary-500 transition-colors mb-1">
                                {service.name}
                            </h3>
                            <p className="text-xs text-dark-400 line-clamp-2 mb-3">
                                {service.description || 'Professional service by verified experts'}
                            </p>

                            {/* Provider */}
                            {service.provider && (
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                                        <span className="text-[10px] font-bold text-white">{service.provider.name?.charAt(0)}</span>
                                    </div>
                                    <span className="text-xs text-dark-500">{service.provider.name}</span>
                                    {service.provider.averageRating > 0 && (
                                        <span className="flex items-center gap-0.5 text-xs font-semibold text-dark-700">
                                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                            {service.provider.averageRating}
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Price + Duration + Action */}
                            <div className="pt-3 border-t border-dark-100">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="text-lg font-extrabold text-dark-900">₹{service.price}</span>
                                        <span className="text-xs text-dark-400 ml-2">• {service.duration} min</span>
                                    </div>
                                    <button
                                        onClick={() => handleAddToCart(service)}
                                        disabled={isInCart(service._id)}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${isInCart(service._id)
                                            ? 'bg-primary-500 text-white'
                                            : 'bg-primary-500 text-white hover:bg-primary-600 shadow-sm'
                                            }`}
                                    >
                                        {isInCart(service._id) ? '✓ Added' : 'Add'}
                                    </button>
                                </div>
                                {isInCart(service._id) && (
                                    <Link
                                        to="/cart"
                                        className="mt-2 w-full flex items-center justify-center gap-1 py-2 bg-dark-900 text-white text-xs font-semibold rounded-xl hover:bg-dark-800 transition-all"
                                    >
                                        <ShoppingCart className="w-3.5 h-3.5" /> Go to Cart
                                    </Link>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Services;
