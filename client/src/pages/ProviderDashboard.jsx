import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import { io } from 'socket.io-client';
import { Package, Star, Plus, Trash2, Navigation, NavigationOff, MapPin, RefreshCw, KeyRound, CheckCircle2, ExternalLink, MessageCircle, Clock, QrCode, Loader2, Banknote, CreditCard, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';

const serviceCategories = [
    'cleaning', 'plumbing', 'electrical', 'beauty', 'painting', 'carpentry',
    'pest-control', 'appliance-repair', 'home-repair', 'cooking',
    'domestic-help', 'moving', 'laundry', 'outdoor', 'event',
    'security', 'pet-services', 'other',
];

const ProviderDashboard = () => {
    const { user } = useAuth();
    const [services, setServices] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [sharingLocation, setSharingLocation] = useState({});
    const [otpInputs, setOtpInputs] = useState({});
    const [otpLoading, setOtpLoading] = useState({});
    const [whatsappLinks, setWhatsappLinks] = useState({});
    const [qrCodes, setQrCodes] = useState({});
    const [qrLoadingMap, setQrLoadingMap] = useState({});
    const [payConfirmingMap, setPayConfirmingMap] = useState({});
    const [formData, setFormData] = useState({
        name: '', category: 'cleaning', description: '', price: '', duration: '60',
    });
    const socketRef = useRef(null);

    useEffect(() => {
        fetchData();
        const token = user?.token;
        if (token) {
            const socket = io(window.location.origin, {
                auth: { token },
                transports: ['websocket', 'polling'],
            });
            socketRef.current = socket;
            socket.on('connect', () => console.log('Provider socket connected'));
            socket.on('connect_error', (err) => console.error('Socket error:', err.message));
            return () => {
                stopAllLocationSharing();
                socket.disconnect();
            };
        }
    }, [user?.token]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [svcRes, bookRes] = await Promise.all([
                API.get('/services', { params: { limit: 100 } }),
                API.get('/bookings', { params: { limit: 50 } }),
            ]);
            const myServices = (svcRes.data.data || []).filter((s) => {
                const pid = s.provider?._id || s.provider;
                return pid === user?._id;
            });
            setServices(myServices);
            setBookings(bookRes.data.data || []);

            // Fetch reviews for this provider
            if (user?._id) {
                try {
                    const revRes = await API.get(`/reviews/provider/${user._id}`);
                    setReviews(revRes.data.data || []);
                } catch (e) { /* no reviews yet */ }
            }
        } catch (err) {
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateService = async (e) => {
        e.preventDefault();
        try {
            await API.post('/services', { ...formData, price: Number(formData.price), duration: Number(formData.duration) });
            toast.success('🎉 Service created successfully!\nPending admin approval — you\'ll receive an email once it\'s live on the platform.', { duration: 8000 });
            setShowForm(false);
            setFormData({ name: '', category: 'cleaning', description: '', price: '', duration: '60' });
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create service');
        }
    };

    const handleDeleteService = async (id) => {
        if (!confirm('Delete this service?')) return;
        try {
            await API.delete(`/services/${id}`);
            toast.success('Service deleted');
            fetchData();
        } catch (err) {
            toast.error('Failed to delete');
        }
    };

    const updateBookingStatus = async (bookingId, status) => {
        try {
            const { data } = await API.put(`/bookings/${bookingId}/status`, { status });
            toast.success(`Status updated to ${status}`);

            // If OTP data returned (in-progress), store WhatsApp link
            if (data.otp) {
                setWhatsappLinks((prev) => ({ ...prev, [bookingId]: data.otp.whatsappLink }));
                toast.success('🔐 OTP sent to customer! Ask them for the code to complete the service.', { duration: 6000 });
            }

            socketRef.current?.emit('booking:statusUpdate', { bookingId, status });

            if (status === 'on-the-way') startLocationSharing(bookingId);
            if (status === 'arrived') {
                socketRef.current?.emit('provider:arrived', { bookingId });
                stopLocationSharing(bookingId);
            }
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update');
        }
    };

    // ── OTP Verification ──────────────────────────────
    const handleVerifyOTP = async (bookingId) => {
        const otp = otpInputs[bookingId];
        if (!otp || otp.length !== 4) {
            return toast.error('Please enter the 4-digit OTP');
        }
        setOtpLoading((prev) => ({ ...prev, [bookingId]: true }));
        try {
            await API.put(`/bookings/${bookingId}/verify-otp`, { otp });
            toast.success('✅ Service completed and verified!', { duration: 5000 });
            socketRef.current?.emit('booking:statusUpdate', { bookingId, status: 'completed' });
            setOtpInputs((prev) => { const u = { ...prev }; delete u[bookingId]; return u; });
            setWhatsappLinks((prev) => { const u = { ...prev }; delete u[bookingId]; return u; });
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'OTP verification failed');
        } finally {
            setOtpLoading((prev) => ({ ...prev, [bookingId]: false }));
        }
    };

    // ── Location Sharing ──────────────────────────────
    const startLocationSharing = useCallback((bookingId) => {
        if (!('geolocation' in navigator)) return toast.error('Geolocation not supported');
        socketRef.current?.emit('booking:join', bookingId);
        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                socketRef.current?.emit('location:update', {
                    bookingId, lat: pos.coords.latitude, lng: pos.coords.longitude,
                });
            },
            () => toast.error('Location access denied'),
            { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
        );
        setSharingLocation((prev) => ({ ...prev, [bookingId]: watchId }));
        toast.success('📍 Live location sharing started!');
    }, []);

    const stopLocationSharing = useCallback((bookingId) => {
        setSharingLocation((prev) => {
            const watchId = prev[bookingId];
            if (watchId !== undefined) navigator.geolocation.clearWatch(watchId);
            socketRef.current?.emit('booking:leave', bookingId);
            const updated = { ...prev };
            delete updated[bookingId];
            return updated;
        });
    }, []);

    const stopAllLocationSharing = () => {
        Object.entries(sharingLocation).forEach(([bid, wid]) => {
            navigator.geolocation.clearWatch(wid);
            socketRef.current?.emit('booking:leave', bid);
        });
    };

    const toggleLocationSharing = (bookingId) => {
        if (sharingLocation[bookingId] !== undefined) {
            stopLocationSharing(bookingId);
            toast.success('Location sharing stopped');
        } else {
            startLocationSharing(bookingId);
        }
    };

    const statusActions = {
        assigned: ['on-the-way'],
        'on-the-way': ['arrived'],
        arrived: ['in-progress'],
    };

    const categories = ['plumbing', 'cleaning', 'electrical', 'beauty', 'painting', 'carpentry', 'pest-control', 'appliance-repair', 'other'];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Welcome */}
            <div className="bg-gradient-to-r from-purple-600 to-primary-600 rounded-3xl p-8 text-white mb-8 animate-slide-up">
                <h1 className="text-3xl font-extrabold">Provider Dashboard 🔧</h1>
                <p className="text-white/80 mt-2">Manage your services and bookings</p>
                <div className="flex gap-6 mt-4">
                    <div className="text-center">
                        <p className="text-2xl font-bold">{services.length}</p>
                        <p className="text-xs text-white/60">Services</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold">{bookings.length}</p>
                        <p className="text-xs text-white/60">Bookings</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold flex items-center gap-1"><Star className="w-4 h-4" />{user?.averageRating || 0}</p>
                        <p className="text-xs text-white/60">Rating</p>
                    </div>
                </div>
            </div>

            {/* Services Section */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-dark-900">My Services</h2>
                    <button onClick={() => setShowForm(!showForm)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-all">
                        <Plus className="w-4 h-4" /> Add Service
                    </button>
                </div>

                {showForm && (
                    <form onSubmit={handleCreateService} className="bg-white rounded-2xl border border-dark-100 p-6 mb-6 animate-fade-in">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <input type="text" placeholder="Service name" required value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="px-4 py-3 rounded-xl border border-dark-200 focus:border-primary-500 outline-none text-sm" />
                            <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="px-4 py-3 rounded-xl border border-dark-200 focus:border-primary-500 outline-none text-sm capitalize">
                                {serviceCategories.map((c) => <option key={c} value={c}>{c.replace(/-/g, ' ')}</option>)}
                            </select>
                            <input type="number" placeholder="Price (₹)" required value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                className="px-4 py-3 rounded-xl border border-dark-200 focus:border-primary-500 outline-none text-sm" />
                            <input type="number" placeholder="Duration (min)" value={formData.duration}
                                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                className="px-4 py-3 rounded-xl border border-dark-200 focus:border-primary-500 outline-none text-sm" />
                            <textarea placeholder="Description" rows={2} value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="sm:col-span-2 px-4 py-3 rounded-xl border border-dark-200 focus:border-primary-500 outline-none text-sm resize-none" />
                        </div>
                        <div className="flex gap-3 mt-4">
                            <button type="submit" className="px-6 py-2.5 bg-primary-600 text-white font-semibold rounded-xl text-sm hover:bg-primary-700">Create</button>
                            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 bg-dark-100 text-dark-600 font-semibold rounded-xl text-sm hover:bg-dark-200">Cancel</button>
                        </div>
                    </form>
                )}

                {services.length === 0 ? (
                    <div className="text-center py-8 bg-white rounded-2xl border border-dark-100">
                        <p className="text-dark-400">No services yet. Create one to start receiving bookings!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {services.map((svc) => (
                            <div key={svc._id} className={`bg-white rounded-2xl border p-5 flex items-center justify-between ${!svc.isApproved ? 'border-yellow-300 bg-yellow-50/30' : 'border-dark-100'}`}>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-dark-800">{svc.name}</h3>
                                        {svc.isApproved ? (
                                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                                                <CheckCircle2 className="w-3 h-3" /> Live
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                                                <Clock className="w-3 h-3" /> Pending Approval
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-dark-400 capitalize">{svc.category} • {svc.duration} min</p>
                                    <p className="text-lg font-extrabold text-primary-600 mt-1">₹{svc.price}</p>
                                    {!svc.isApproved && (
                                        <p className="text-xs text-yellow-600 mt-1">⏳ Waiting for admin to approve this service</p>
                                    )}
                                </div>
                                <button onClick={() => handleDeleteService(svc._id)} className="p-2 text-danger-500 hover:bg-red-50 rounded-lg">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Bookings */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-dark-900">Assigned Bookings</h2>
                    <button onClick={fetchData} className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-semibold">
                        <RefreshCw className="w-4 h-4" /> Refresh
                    </button>
                </div>
                {bookings.length === 0 ? (
                    <div className="text-center py-10 bg-white rounded-2xl border border-dark-100">
                        <Package className="w-12 h-12 text-dark-200 mx-auto mb-2" />
                        <p className="text-dark-400 font-medium">No bookings assigned yet</p>
                        <p className="text-xs text-dark-300 mt-1">New bookings will appear here when customers book your services</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {bookings.map((b) => {
                            const isSharing = sharingLocation[b._id] !== undefined;
                            const canShareLocation = ['assigned', 'on-the-way', 'arrived'].includes(b.status);
                            const isInProgress = b.status === 'in-progress';
                            const isCompleted = b.status === 'completed';

                            return (
                                <div key={b._id} className={`bg-white rounded-2xl border p-5 animate-fade-in ${isInProgress ? 'border-warning-500 ring-2 ring-yellow-100' : isCompleted ? 'border-success-500/30 bg-emerald-50/30' : 'border-dark-100'}`}>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${b.status === 'assigned' ? 'bg-blue-100 text-blue-700'
                                                    : b.status === 'on-the-way' ? 'bg-orange-100 text-orange-700'
                                                        : b.status === 'arrived' ? 'bg-green-100 text-green-700'
                                                            : b.status === 'in-progress' ? 'bg-yellow-100 text-yellow-700'
                                                                : b.status === 'completed' ? 'bg-emerald-100 text-emerald-700'
                                                                    : 'bg-primary-100 text-primary-700'
                                                    }`}>
                                                    {b.status === 'in-progress' ? '🔧 In Progress' : b.status === 'completed' ? '✅ Completed' : b.status}
                                                </span>
                                                {isSharing && (
                                                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-success-500 text-white">
                                                        <MapPin className="w-3 h-3 animate-pulse" /> Live
                                                    </span>
                                                )}
                                            </div>
                                            <p className="font-bold text-dark-800 mt-2">{b.services?.map((s) => s.service?.name || 'Service').join(', ')}</p>
                                            <p className="text-xs text-dark-400 mt-1">Customer: {b.consumer?.name || 'Customer'} • {b.consumer?.phone || ''}</p>
                                            {b.address && (
                                                <p className="text-xs text-primary-600 mt-1 font-medium">📍 {b.address.street}, {b.address.city}, {b.address.state} {b.address.zip}</p>
                                            )}
                                            <p className="text-xs text-dark-300 mt-1">Scheduled: {b.scheduledDate ? new Date(b.scheduledDate).toLocaleString() : 'N/A'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-extrabold text-dark-900">₹{b.totalAmount}</p>
                                            <div className="flex items-center gap-1.5 mt-2 justify-end">
                                                {b.paymentMethod === 'cash' ? (
                                                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                                                        <Banknote className="w-3 h-3" /> Cash
                                                    </span>
                                                ) : b.paymentMethod === 'upi' ? (
                                                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-100 text-violet-700">
                                                        <Smartphone className="w-3 h-3" /> UPI
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                                                        <CreditCard className="w-3 h-3" /> Card
                                                    </span>
                                                )}
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${b.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                                                    {b.paymentStatus === 'paid' ? '✅ Paid' : '⏳ Unpaid'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2 mt-4">
                                        {/* Status progression buttons */}
                                        {statusActions[b.status]?.map((nextStatus) => (
                                            <button key={nextStatus}
                                                onClick={() => updateBookingStatus(b._id, nextStatus)}
                                                className="px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 capitalize transition-all">
                                                {nextStatus === 'in-progress' ? '🔧 Start Work (Send OTP)' : `Mark ${nextStatus}`}
                                            </button>
                                        ))}

                                        {/* Location sharing toggle */}
                                        {canShareLocation && (
                                            <button onClick={() => toggleLocationSharing(b._id)}
                                                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all ${isSharing ? 'bg-success-500 text-white hover:bg-green-600' : 'bg-dark-100 text-dark-600 hover:bg-dark-200'
                                                    }`}>
                                                {isSharing ? <><Navigation className="w-4 h-4 animate-pulse" /> Sharing Live</> : <><NavigationOff className="w-4 h-4" /> Share Location</>}
                                            </button>
                                        )}
                                    </div>

                                    {/* Cash Payment Controls */}
                                    {b.paymentMethod === 'cash' && b.paymentStatus !== 'paid' && !isCompleted && (
                                        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl animate-fade-in">
                                            <p className="text-xs font-semibold text-amber-700 mb-3">💰 Cash Payment — Choose an option:</p>
                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            await API.put('/payments/confirm', { bookingId: b._id });
                                                            toast.success('✅ Cash collected & booking completed!');
                                                            fetchData();
                                                        } catch { toast.error('Failed to confirm'); }
                                                    }}
                                                    disabled={payConfirmingMap[b._id]}
                                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-all"
                                                >
                                                    <Banknote className="w-4 h-4" /> Collect Cash
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        setQrLoadingMap(prev => ({ ...prev, [b._id]: true }));
                                                        try {
                                                            const { data } = await API.post('/payments/qr', { bookingId: b._id });
                                                            setQrCodes(prev => ({ ...prev, [b._id]: data.data }));
                                                        } catch { toast.error('Failed to generate QR'); }
                                                        finally { setQrLoadingMap(prev => ({ ...prev, [b._id]: false })); }
                                                    }}
                                                    disabled={qrLoadingMap[b._id]}
                                                    className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 transition-all"
                                                >
                                                    {qrLoadingMap[b._id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />} Show QR to Customer
                                                </button>
                                            </div>

                                            {/* QR Display */}
                                            {qrCodes[b._id] && (
                                                <div className="mt-4 text-center bg-white rounded-xl p-4 border border-violet-200">
                                                    <img src={qrCodes[b._id].qrCode} alt="UPI QR" className="w-48 h-48 mx-auto rounded-lg mb-2" />
                                                    <p className="text-lg font-extrabold text-dark-900">₹{qrCodes[b._id].amount}</p>
                                                    <p className="text-xs text-dark-400 mt-1">Customer can scan with GPay / PhonePe / Paytm</p>
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                await API.put('/payments/confirm', { bookingId: b._id });
                                                                toast.success('✅ Payment confirmed & booking completed!');
                                                                fetchData();
                                                            } catch { toast.error('Failed to confirm'); }
                                                        }}
                                                        className="mt-3 px-6 py-2 bg-primary-500 text-white text-sm font-bold rounded-xl hover:bg-primary-600 transition-all"
                                                    >
                                                        Customer Has Paid — Confirm
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* OTP Verification Form (visible when in-progress) */}
                                    {isInProgress && (
                                        <div className="mt-5 p-5 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-2xl animate-fade-in">
                                            <div className="flex items-center gap-2 mb-3">
                                                <KeyRound className="w-5 h-5 text-yellow-600" />
                                                <h4 className="font-bold text-dark-800">Enter OTP to Complete Service</h4>
                                            </div>
                                            <p className="text-xs text-dark-500 mb-4">OTP has been sent to the customer's email and WhatsApp. Ask the customer for the 4-digit code.</p>

                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="text"
                                                    maxLength={4}
                                                    inputMode="numeric"
                                                    pattern="[0-9]*"
                                                    placeholder="Enter 4-digit OTP"
                                                    value={otpInputs[b._id] || ''}
                                                    onChange={(e) => setOtpInputs((prev) => ({ ...prev, [b._id]: e.target.value.replace(/[^0-9]/g, '') }))}
                                                    className="flex-1 px-4 py-3 rounded-xl border-2 border-yellow-300 focus:border-primary-500 outline-none text-center text-2xl font-bold tracking-[8px] bg-white"
                                                />
                                                <button
                                                    onClick={() => handleVerifyOTP(b._id)}
                                                    disabled={otpLoading[b._id]}
                                                    className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-emerald-500/25"
                                                >
                                                    {otpLoading[b._id] ? (
                                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    ) : (
                                                        <><CheckCircle2 className="w-5 h-5" /> Verify</>
                                                    )}
                                                </button>
                                            </div>

                                            {/* WhatsApp link */}
                                            {whatsappLinks[b._id] && (
                                                <a href={whatsappLinks[b._id]} target="_blank" rel="noopener noreferrer"
                                                    className="mt-3 flex items-center gap-2 text-sm font-semibold text-green-700 hover:text-green-800">
                                                    <MessageCircle className="w-4 h-4" /> Send OTP via WhatsApp <ExternalLink className="w-3 h-3" />
                                                </a>
                                            )}
                                        </div>
                                    )}

                                    {/* Cash Payment QR Section — Provider shows QR to customer */}
                                    {b.paymentMethod === 'cash' && b.paymentStatus !== 'paid' && ['in-progress', 'completed', 'arrived', 'assigned'].includes(b.status) && (
                                        <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl animate-fade-in">
                                            <div className="flex items-center gap-2 mb-3">
                                                <QrCode className="w-5 h-5 text-amber-600" />
                                                <h4 className="font-bold text-dark-800">💰 Cash Payment — Show QR to Customer</h4>
                                            </div>
                                            <p className="text-xs text-dark-500 mb-4">Generate a UPI QR code for the customer to scan and pay. Once paid, confirm below to auto-complete the booking.</p>

                                            {!qrCodes[b._id] ? (
                                                <button
                                                    onClick={async () => {
                                                        setQrLoadingMap(prev => ({ ...prev, [b._id]: true }));
                                                        try {
                                                            const { data } = await API.post('/payments/qr', { bookingId: b._id });
                                                            setQrCodes(prev => ({ ...prev, [b._id]: data.data }));
                                                        } catch (err) {
                                                            toast.error('Failed to generate QR');
                                                        } finally {
                                                            setQrLoadingMap(prev => ({ ...prev, [b._id]: false }));
                                                        }
                                                    }}
                                                    disabled={qrLoadingMap[b._id]}
                                                    className="px-6 py-2.5 bg-amber-600 text-white font-semibold rounded-xl hover:bg-amber-700 transition-all flex items-center gap-2 disabled:opacity-50"
                                                >
                                                    {qrLoadingMap[b._id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
                                                    {qrLoadingMap[b._id] ? 'Generating...' : 'Show QR to Customer'}
                                                </button>
                                            ) : (
                                                <div className="flex flex-col items-center gap-3">
                                                    <img src={qrCodes[b._id].qrCode} alt="UPI QR" className="w-48 h-48 rounded-xl shadow-lg border-4 border-white" />
                                                    <p className="text-lg font-extrabold text-amber-700">₹{qrCodes[b._id].amount}</p>
                                                    <p className="text-xs text-dark-400">Customer scans with GPay / PhonePe / Paytm</p>
                                                    <button
                                                        onClick={async () => {
                                                            setPayConfirmingMap(prev => ({ ...prev, [b._id]: true }));
                                                            try {
                                                                await API.put('/payments/confirm', { bookingId: b._id });
                                                                toast.success('💰 Payment confirmed & booking completed!');
                                                                setQrCodes(prev => { const n = { ...prev }; delete n[b._id]; return n; });
                                                                fetchData();
                                                            } catch (err) {
                                                                toast.error('Failed to confirm payment');
                                                            } finally {
                                                                setPayConfirmingMap(prev => ({ ...prev, [b._id]: false }));
                                                            }
                                                        }}
                                                        disabled={payConfirmingMap[b._id]}
                                                        className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg disabled:opacity-50"
                                                    >
                                                        {payConfirmingMap[b._id] ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                                                        {payConfirmingMap[b._id] ? 'Confirming...' : '✅ Customer Has Paid — Confirm'}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Completed badge */}
                                    {isCompleted && (
                                        <div className="mt-4 flex items-center gap-2 text-emerald-600 font-semibold">
                                            <CheckCircle2 className="w-5 h-5" /> Service completed and verified
                                            {b.paymentStatus === 'paid' && <span className="ml-2 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full font-semibold">💰 Paid</span>}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Reviews Section */}
            <div className="mt-8">
                <h2 className="text-xl font-bold text-dark-900 mb-4">⭐ Customer Reviews ({reviews.length})</h2>
                {reviews.length === 0 ? (
                    <div className="text-center py-8 bg-white rounded-2xl border border-dark-100">
                        <Star className="w-10 h-10 text-dark-200 mx-auto mb-2" />
                        <p className="text-dark-400">No reviews yet. Complete bookings to receive reviews!</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {reviews.map((r) => (
                            <div key={r._id} className="bg-white rounded-2xl border border-dark-100 p-5">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-1 mb-1">
                                            {[1, 2, 3, 4, 5].map((s) => (
                                                <Star key={s} className={`w-4 h-4 ${s <= r.rating ? 'text-yellow-500 fill-yellow-500' : 'text-dark-200'}`} />
                                            ))}
                                            <span className="ml-2 text-sm font-bold text-dark-700">{r.rating}/5</span>
                                        </div>
                                        <p className="text-dark-600 text-sm mt-1">{r.comment || 'No comment'}</p>
                                        <p className="text-xs text-dark-400 mt-2">By {r.consumer?.name || 'Customer'} • {new Date(r.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div >
    );
};

export default ProviderDashboard;
