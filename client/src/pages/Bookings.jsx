import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import { Calendar, MapPin, Clock, ChevronRight, Package } from 'lucide-react';
import toast from 'react-hot-toast';

const statusColors = {
    booked: 'bg-blue-100 text-blue-700',
    assigned: 'bg-purple-100 text-purple-700',
    'on-the-way': 'bg-yellow-100 text-yellow-700',
    arrived: 'bg-orange-100 text-orange-700',
    'in-progress': 'bg-indigo-100 text-indigo-700',
    completed: 'bg-green-100 text-green-700',
    reviewed: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700',
};

const Bookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        fetchBookings();
    }, [filter]);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filter) params.status = filter;
            const { data } = await API.get('/bookings', { params });
            setBookings(data.data);
        } catch (err) {
            toast.error('Failed to load bookings');
        } finally {
            setLoading(false);
        }
    };

    const statusFilters = ['', 'booked', 'assigned', 'on-the-way', 'arrived', 'in-progress', 'completed', 'reviewed', 'cancelled'];

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-extrabold text-dark-900 mb-2 animate-fade-in">My Bookings</h1>
            <p className="text-dark-500 mb-6">Track and manage all your service bookings</p>

            {/* Status Filter */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
                {statusFilters.map((s) => (
                    <button key={s} onClick={() => setFilter(s)}
                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all capitalize ${filter === s
                                ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/25'
                                : 'bg-white text-dark-600 border border-dark-200 hover:border-primary-300'
                            }`}>
                        {s || 'All'}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl p-6 border border-dark-100 animate-pulse">
                            <div className="h-4 bg-dark-100 rounded w-1/3 mb-3" />
                            <div className="h-4 bg-dark-100 rounded w-2/3" />
                        </div>
                    ))}
                </div>
            ) : bookings.length === 0 ? (
                <div className="text-center py-20">
                    <Package className="w-16 h-16 text-dark-200 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-dark-700">No bookings found</h3>
                    <p className="text-dark-400 mt-2">Your bookings will appear here</p>
                    <Link to="/services" className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl">
                        Browse Services
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {bookings.map((booking) => (
                        <Link key={booking._id} to={`/bookings/${booking._id}`}
                            className="block bg-white rounded-2xl border border-dark-100 p-5 hover:shadow-lg hover:border-primary-200 transition-all group">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${statusColors[booking.status] || 'bg-dark-100 text-dark-600'}`}>
                                            {booking.status}
                                        </span>
                                        <span className="text-xs text-dark-400">
                                            #{booking._id.slice(-6).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {booking.services?.map((s, i) => (
                                            <span key={i} className="text-sm font-medium text-dark-700">
                                                {s.service?.name || 'Service'}{i < booking.services.length - 1 ? ',' : ''}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-dark-400">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(booking.scheduledDate).toLocaleDateString()}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-3 h-3" />
                                            {booking.address?.city}
                                        </span>
                                        {booking.provider && (
                                            <span>Provider: {booking.provider.name}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-extrabold text-dark-900">₹{booking.totalAmount}</p>
                                    <p className="text-xs text-dark-400 capitalize">{booking.paymentMethod} • {booking.paymentStatus}</p>
                                    <ChevronRight className="w-5 h-5 text-dark-300 ml-auto mt-2 group-hover:text-primary-500 transition-colors" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Bookings;
