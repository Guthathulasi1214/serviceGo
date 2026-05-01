import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Search, MapPin, ShoppingCart, User, ChevronDown, LogOut, Package, LayoutDashboard, Shield, Menu, X, Loader2 } from 'lucide-react';

const Navbar = () => {
    const { user, logout } = useAuth();
    const { items } = useCart();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [showMobile, setShowMobile] = useState(false);
    const [location, setLocation] = useState(() => localStorage.getItem('sg_location') || '');
    const [locLoading, setLocLoading] = useState(false);
    const [showLocDropdown, setShowLocDropdown] = useState(false);
    const [manualLoc, setManualLoc] = useState('');
    const dropRef = useRef(null);
    const locRef = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (dropRef.current && !dropRef.current.contains(e.target)) setShowDropdown(false);
            if (locRef.current && !locRef.current.contains(e.target)) setShowLocDropdown(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Auto-detect on first visit
    useEffect(() => {
        if (!location) detectLocation();
    }, []);

    const detectLocation = () => {
        if (!navigator.geolocation) return;
        setLocLoading(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                try {
                    const res = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`
                    );
                    const data = await res.json();
                    const city = data.address?.city || data.address?.town || data.address?.village || data.address?.suburb || data.address?.state_district || 'Your Area';
                    setLocation(city);
                    localStorage.setItem('sg_location', city);
                } catch {
                    setLocation('Your Area');
                } finally {
                    setLocLoading(false);
                }
            },
            () => {
                setLocLoading(false);
                setLocation('Detect Location');
            },
            { timeout: 8000 }
        );
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/services?search=${searchQuery.trim()}`);
            setSearchQuery('');
        }
    };

    return (
        <nav className="sticky top-0 z-50 bg-white border-b border-dark-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-4 h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 shrink-0">
                        <div className="w-9 h-9 bg-primary-500 rounded-xl flex items-center justify-center">
                            <span className="text-white font-extrabold text-lg">S</span>
                        </div>
                        <span className="text-xl font-extrabold text-dark-900 hidden sm:block">service<span className="text-primary-500">go</span></span>
                    </Link>

                    {/* Location */}
                    <div className="hidden md:block relative shrink-0" ref={locRef}>
                        <button onClick={() => setShowLocDropdown(!showLocDropdown)} className="flex items-center gap-1.5 text-sm text-dark-700 hover:text-primary-600 transition-colors">
                            {locLoading ? (
                                <Loader2 className="w-4 h-4 text-primary-500 animate-spin" />
                            ) : (
                                <MapPin className="w-4 h-4 text-primary-500" />
                            )}
                            <span className="font-semibold max-w-[140px] truncate">{locLoading ? 'Detecting...' : location || 'Set Location'}</span>
                            <ChevronDown className="w-3.5 h-3.5 text-dark-400" />
                        </button>

                        {showLocDropdown && (
                            <div className="absolute left-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-dark-100 p-4 animate-fade-in z-50">
                                <p className="text-xs font-semibold text-dark-500 mb-2">Set your location</p>
                                <input
                                    type="text"
                                    placeholder="Type city, area or pincode..."
                                    value={manualLoc}
                                    onChange={(e) => setManualLoc(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && manualLoc.trim()) {
                                            setLocation(manualLoc.trim());
                                            localStorage.setItem('sg_location', manualLoc.trim());
                                            setShowLocDropdown(false);
                                            setManualLoc('');
                                        }
                                    }}
                                    className="w-full px-3 py-2.5 bg-dark-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/30 border border-transparent focus:border-primary-300 mb-2"
                                    autoFocus
                                />
                                <button
                                    onClick={() => { if (manualLoc.trim()) { setLocation(manualLoc.trim()); localStorage.setItem('sg_location', manualLoc.trim()); setShowLocDropdown(false); setManualLoc(''); } }}
                                    disabled={!manualLoc.trim()}
                                    className="w-full py-2 bg-primary-500 text-white text-sm font-semibold rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-40 mb-2"
                                >
                                    Set Location
                                </button>
                                <div className="border-t border-dark-100 pt-2">
                                    <button
                                        onClick={() => { detectLocation(); setShowLocDropdown(false); }}
                                        className="w-full flex items-center justify-center gap-2 py-2 text-sm font-semibold text-primary-500 hover:bg-primary-50 rounded-xl transition-colors"
                                    >
                                        <MapPin className="w-4 h-4" /> Use Current Location (GPS)
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Search */}
                    <form onSubmit={handleSearch} className="flex-1 max-w-xl">
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder='Search for "plumber", "cleaning", "electrician"...'
                                className="w-full pl-10 pr-4 py-2.5 bg-dark-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/30 focus:bg-white border border-transparent focus:border-primary-300 transition-all placeholder:text-dark-400"
                            />
                        </div>
                    </form>

                    {/* Right actions */}
                    <div className="flex items-center gap-2">
                        {/* Cart */}
                        <Link to="/cart" className="relative p-2.5 hover:bg-dark-100 rounded-xl transition-colors">
                            <ShoppingCart className="w-5 h-5 text-dark-700" />
                            {items.length > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-primary-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                    {items.length}
                                </span>
                            )}
                        </Link>

                        {user ? (
                            <div className="relative" ref={dropRef}>
                                <button
                                    onClick={() => setShowDropdown(!showDropdown)}
                                    className="flex items-center gap-2 px-3 py-2 hover:bg-dark-100 rounded-xl transition-colors"
                                >
                                    <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                                        <span className="text-white text-sm font-bold">{user.name?.charAt(0).toUpperCase()}</span>
                                    </div>
                                    <span className="hidden sm:block text-sm font-semibold text-dark-800 max-w-[100px] truncate">{user.name}</span>
                                    <ChevronDown className="w-3.5 h-3.5 text-dark-400 hidden sm:block" />
                                </button>

                                {showDropdown && (
                                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-dark-100 py-2 animate-fade-in z-50">
                                        <div className="px-4 py-2 border-b border-dark-100 mb-1">
                                            <p className="text-sm font-bold text-dark-900">{user.name}</p>
                                            <p className="text-xs text-dark-400">{user.email}</p>
                                        </div>

                                        <Link to="/bookings" onClick={() => setShowDropdown(false)}
                                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-dark-700 hover:bg-dark-50 transition-colors">
                                            <Package className="w-4 h-4" /> My Bookings
                                        </Link>

                                        {user.role === 'provider' && (
                                            <Link to="/provider" onClick={() => setShowDropdown(false)}
                                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-dark-700 hover:bg-dark-50 transition-colors">
                                                <LayoutDashboard className="w-4 h-4" /> Provider Dashboard
                                            </Link>
                                        )}

                                        {user.role === 'admin' && (
                                            <Link to="/admin" onClick={() => setShowDropdown(false)}
                                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-dark-700 hover:bg-dark-50 transition-colors">
                                                <Shield className="w-4 h-4" /> Admin Panel
                                            </Link>
                                        )}

                                        <div className="border-t border-dark-100 mt-1">
                                            <button onClick={() => { setShowDropdown(false); logout(); }}
                                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full transition-colors">
                                                <LogOut className="w-4 h-4" /> Sign Out
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link to="/login"
                                className="flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-white text-sm font-semibold rounded-xl hover:bg-primary-600 transition-colors shadow-sm">
                                <User className="w-4 h-4" /> Login
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
