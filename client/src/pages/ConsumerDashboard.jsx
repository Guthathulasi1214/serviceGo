import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import { io } from 'socket.io-client';
import { Home, Calendar, Star, Search, ArrowRight, Bell, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

const ConsumerDashboard = () => {
    const { user } = useAuth();
    const [recentBookings, setRecentBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState([]);
    const socketRef = useRef(null);

    useEffect(() => {
        fetchBookings();

        // Connect socket for real-time notifications
        const token = user?.token;
        if (token) {
            const socket = io(window.location.origin, {
                auth: { token },
                transports: ['websocket', 'polling'],
            });
            socketRef.current = socket;

            socket.on('connect', () => {
                console.log('Consumer socket connected:', socket.id);
            });

            // Listen for booking status changes
            socket.on('booking:statusChanged', (data) => {
                const messages = {
                    'on-the-way': '🚗 Your provider is on the way!',
                    'arrived': '🎉 Your provider has arrived!',
                    'in-progress': '⚡ Service is now in progress!',
                    'completed': '✅ Service completed! Please leave a review.',
                };
                const msg = messages[data.status] || `Status updated to: ${data.status}`;
                toast.success(msg, { duration: 6000 });
                setNotifications((prev) => [{
                    id: Date.now(),
                    message: msg,
                    time: new Date(),
                    bookingId: data.bookingId,
                }, ...prev]);
                fetchBookings();
            });

            // Listen for provider arrival
            socket.on('provider:arrived', () => {
                toast.success('🎉 Your service provider has arrived at your location!', { duration: 8000 });
            });

            return () => {
                socket.disconnect();
            };
        }
    }, [user?.token]);

    // Join booking rooms so we receive updates
    useEffect(() => {
        if (socketRef.current && recentBookings.length > 0) {
            recentBookings.forEach((b) => {
                if (['assigned', 'on-the-way', 'arrived', 'in-progress'].includes(b.status)) {
                    socketRef.current.emit('booking:join', b._id);
                }
            });
        }
    }, [recentBookings]);

    const fetchBookings = async () => {
        try {
            const { data } = await API.get('/bookings', { params: { limit: 10 } });
            setRecentBookings(data.data || []);
        } catch (err) {
            console.error('Failed to fetch bookings');
        } finally {
            setLoading(false);
        }
    };

    const activeBookings = recentBookings.filter(
        (b) => ['assigned', 'on-the-way', 'arrived', 'in-progress'].includes(b.status)
    );

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Welcome */}
            <div className="bg-gradient-to-r from-primary-600 to-accent-500 rounded-3xl p-8 text-white mb-8 animate-slide-up">
                <h1 className="text-3xl font-extrabold">Hi, {user?.name?.split(' ')[0]}! 👋</h1>
                <p className="text-white/80 mt-2">What service do you need today?</p>
                <div className="flex gap-4 mt-6">
                    <Link to="/services"
                        className="px-6 py-3 bg-white text-primary-600 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 text-sm">
                        <Search className="w-4 h-4" /> Browse Services
                    </Link>
                    <Link to="/bookings"
                        className="px-6 py-3 bg-white/20 text-white font-semibold rounded-xl hover:bg-white/30 transition-all flex items-center gap-2 text-sm border border-white/30">
                        <Calendar className="w-4 h-4" /> My Bookings
                    </Link>
                </div>
            </div>

            {/* Notifications */}
            {notifications.length > 0 && (
                <div className="mb-8 space-y-3 animate-fade-in">
                    <h2 className="text-lg font-bold text-dark-800 flex items-center gap-2">
                        <Bell className="w-5 h-5 text-primary-500" /> Live Updates
                    </h2>
                    {notifications.slice(0, 5).map((n) => (
                        <Link key={n.id} to={`/bookings/${n.bookingId}`}
                            className="block bg-gradient-to-r from-primary-50 to-accent-500/5 border border-primary-200 rounded-xl p-4 hover:shadow-md transition-all">
                            <p className="text-sm font-semibold text-dark-800">{n.message}</p>
                            <p className="text-xs text-dark-400 mt-1">{n.time.toLocaleTimeString()}</p>
                        </Link>
                    ))}
                </div>
            )}

            {/* Active Bookings */}
            {activeBookings.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-lg font-bold text-dark-800 mb-4">🔴 Active Bookings</h2>
                    <div className="space-y-3">
                        {activeBookings.map((b) => (
                            <Link key={b._id} to={`/bookings/${b._id}`}
                                className="block bg-white rounded-2xl border border-dark-100 p-5 hover:shadow-lg hover:border-primary-300 transition-all">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${b.status === 'on-the-way' ? 'bg-orange-100 text-orange-700'
                                                    : b.status === 'arrived' ? 'bg-green-100 text-green-700'
                                                        : b.status === 'in-progress' ? 'bg-purple-100 text-purple-700'
                                                            : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                {b.status === 'on-the-way' ? '🚗 On the Way' :
                                                    b.status === 'arrived' ? '📍 Arrived' :
                                                        b.status === 'in-progress' ? '⚡ In Progress' :
                                                            '📋 Assigned'}
                                            </span>
                                        </div>
                                        <p className="font-bold text-dark-800">{b.services?.map((s) => s.service?.name).join(', ')}</p>
                                        {b.provider && <p className="text-xs text-dark-400 mt-1">Provider: {b.provider.name}</p>}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-extrabold text-primary-600">₹{b.totalAmount}</p>
                                        {['on-the-way', 'arrived'].includes(b.status) && (
                                            <Link to={`/track/${b._id}`}
                                                className="flex items-center gap-1 text-xs text-success-500 font-semibold mt-1 hover:text-green-600">
                                                <MapPin className="w-3 h-3" /> Track Live
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link to="/services" className="bg-white rounded-2xl border border-dark-100 p-6 hover:shadow-lg hover:border-primary-300 transition-all group">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                        <Home className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-bold text-dark-800 mb-1">Book a Service</h3>
                    <p className="text-xs text-dark-400">Browse and book home services</p>
                    <ArrowRight className="w-4 h-4 text-primary-500 mt-3 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link to="/bookings" className="bg-white rounded-2xl border border-dark-100 p-6 hover:shadow-lg hover:border-primary-300 transition-all group">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                        <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-bold text-dark-800 mb-1">My Bookings</h3>
                    <p className="text-xs text-dark-400">View and manage your bookings</p>
                    <ArrowRight className="w-4 h-4 text-emerald-500 mt-3 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link to="/bookings" className="bg-white rounded-2xl border border-dark-100 p-6 hover:shadow-lg hover:border-primary-300 transition-all group">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                        <Star className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-bold text-dark-800 mb-1">Reviews</h3>
                    <p className="text-xs text-dark-400">Rate completed services</p>
                    <ArrowRight className="w-4 h-4 text-yellow-500 mt-3 group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>
        </div>
    );
};

export default ConsumerDashboard;
