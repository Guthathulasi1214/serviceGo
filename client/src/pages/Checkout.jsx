import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import { CreditCard, Smartphone, Banknote, MapPin, Calendar, ArrowRight, Navigation, Loader2, Shield, Lock, QrCode } from 'lucide-react';
import toast from 'react-hot-toast';

const Checkout = () => {
    const { items, totalAmount, clearCart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const checkoutDone = useRef(false);
    const [locating, setLocating] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('upi');
    const [scheduledDate, setScheduledDate] = useState('');
    const [locationUsed, setLocationUsed] = useState(false);

    // Load saved address from localStorage
    const [address, setAddress] = useState(() => {
        try {
            const saved = localStorage.getItem('savedAddress');
            if (saved) return JSON.parse(saved);
        } catch { }
        return { street: '', city: '', state: '', zip: '' };
    });

    useEffect(() => {
        if (address.street || address.city) {
            localStorage.setItem('savedAddress', JSON.stringify(address));
        }
    }, [address]);

    // Use Current Location
    const handleUseCurrentLocation = async () => {
        if (!('geolocation' in navigator)) {
            return toast.error('Geolocation is not supported by your browser');
        }

        setLocating(true);
        toast.loading('Detecting your location...', { id: 'locating' });

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
                        { headers: { 'Accept-Language': 'en' } }
                    );
                    const data = await response.json();

                    if (data && data.address) {
                        const addr = data.address;
                        const street = [
                            addr.house_number,
                            addr.road || addr.pedestrian || addr.footway,
                            addr.neighbourhood || addr.suburb,
                        ].filter(Boolean).join(', ');

                        setAddress({
                            street: street || data.display_name?.split(',').slice(0, 3).join(',') || '',
                            city: addr.city || addr.town || addr.village || addr.county || '',
                            state: addr.state || '',
                            zip: addr.postcode || '',
                        });
                        setLocationUsed(true);
                        toast.success('📍 Location detected!', { id: 'locating' });
                    } else {
                        toast.error('Could not determine address', { id: 'locating' });
                    }
                } catch (err) {
                    toast.error('Failed to get address from location', { id: 'locating' });
                }
                setLocating(false);
            },
            (error) => {
                setLocating(false);
                toast.error('Unable to get your location. Please enable location access.', { id: 'locating' });
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    // ─── Open Razorpay Checkout Popup ─────────────────────────
    const openRazorpayCheckout = async (bookingId) => {
        try {
            // 1. Create Razorpay order on backend
            const { data } = await API.post('/payments/razorpay', { bookingId });
            const { orderId, amount, currency, keyId } = data.data;

            // 2. Open Razorpay popup
            const options = {
                key: keyId,
                amount: amount * 100,
                currency: currency,
                name: 'ServiceGo',
                description: `Booking Payment`,
                order_id: orderId,
                handler: async function (response) {
                    // 3. Verify payment on backend
                    try {
                        toast.loading('Verifying payment...', { id: 'payment' });
                        await API.post('/payments/verify/razorpay', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            bookingId: bookingId,
                        });
                        toast.success('💰 Payment successful! Booking confirmed.', { id: 'payment', duration: 5000 });
                        clearCart();
                        navigate('/bookings');
                    } catch (err) {
                        toast.error('Payment verification failed. Contact support.', { id: 'payment' });
                    }
                },
                prefill: {
                    name: user?.name || '',
                    email: user?.email || '',
                    contact: user?.phone || '',
                },
                method: {
                    upi: true,
                    card: true,
                    netbanking: true,
                    wallet: true,
                    paylater: true,
                },
                config: {
                    display: {
                        preferences: {
                            show_default_blocks: true,
                        },
                    },
                },
                theme: {
                    color: '#6366f1',
                },
                modal: {
                    ondismiss: function () {
                        setLoading(false);
                        toast.error('Payment cancelled', { id: 'payment' });
                    },
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err) {
            setLoading(false);
            toast.error(err.response?.data?.message || 'Failed to create payment. Check Razorpay API keys.');
        }
    };

    // ─── Handle Form Submit ──────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (items.length === 0) return toast.error('Cart is empty');

        setLoading(true);
        try {
            // Step 1: Create booking
            const bookingData = {
                services: items.map((item) => ({
                    service: item._id,
                    quantity: item.quantity,
                })),
                paymentMethod: paymentMethod === 'upi-qr' ? 'cash' : paymentMethod,
                address,
                scheduledDate,
            };

            const { data } = await API.post('/bookings', bookingData);
            const bookingId = data.data._id;

            // Step 2: If online payment (Razorpay popup), open Razorpay
            if (paymentMethod === 'upi' || paymentMethod === 'card') {
                await openRazorpayCheckout(bookingId);
                return;
            }

            // Step 3: UPI QR Scan — redirect to QR payment page
            if (paymentMethod === 'upi-qr') {
                checkoutDone.current = true;
                clearCart();
                navigate(`/pay/${bookingId}`);
                return;
            }

            // Step 4: Cash on service — just redirect
            checkoutDone.current = true;
            clearCart();
            toast.success('🎉 Booking created! Pay on service completion.');
            navigate('/bookings');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Booking failed');
        } finally {
            if (paymentMethod === 'cash') setLoading(false);
        }
    };

    const paymentOptions = [
        { value: 'upi', label: 'UPI / Razorpay', icon: Smartphone, desc: 'Pay via UPI, netbanking, cards, or wallets', badge: 'Recommended', badgeColor: 'bg-emerald-100 text-emerald-700' },
        { value: 'upi-qr', label: 'UPI QR Scan', icon: QrCode, desc: 'Scan QR with GPay, PhonePe, Paytm & pay instantly', badge: 'GPay / PhonePe', badgeColor: 'bg-violet-100 text-violet-700' },
        { value: 'card', label: 'Card (Razorpay)', icon: CreditCard, desc: 'Credit/Debit card via Razorpay gateway', badge: null },
        { value: 'cash', label: 'Cash on Service', icon: Banknote, desc: 'Pay when the service is completed', badge: null },
    ];

    // Redirect to cart if empty (skip if checkout already completed)
    useEffect(() => {
        if (items.length === 0 && !checkoutDone.current) navigate('/cart');
    }, [items, navigate]);

    if (items.length === 0 && !checkoutDone.current) return null;

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-extrabold text-dark-900 mb-8 animate-fade-in">Checkout</h1>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left — Address & Payment */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Service Address */}
                    <div className="bg-white rounded-2xl border border-dark-100 p-6 animate-slide-up">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-dark-800 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-primary-500" /> Service Address
                            </h2>
                        </div>

                        <button
                            type="button"
                            onClick={handleUseCurrentLocation}
                            disabled={locating}
                            className={`w-full mb-5 py-3.5 rounded-xl border-2 border-dashed font-semibold text-sm flex items-center justify-center gap-2.5 transition-all ${locationUsed
                                ? 'border-success-500 bg-emerald-50 text-success-500'
                                : 'border-primary-300 bg-primary-50/50 text-primary-600 hover:bg-primary-100 hover:border-primary-500'
                                } disabled:opacity-60`}
                        >
                            {locating ? (
                                <><Loader2 className="w-5 h-5 animate-spin" /> Detecting your location...</>
                            ) : locationUsed ? (
                                <><MapPin className="w-5 h-5" /> ✅ Current location used — you can edit below</>
                            ) : (
                                <><Navigation className="w-5 h-5" /> 📍 Use Current Location</>
                            )}
                        </button>

                        <div className="flex items-center gap-3 mb-5">
                            <div className="flex-1 h-px bg-dark-200" />
                            <span className="text-xs text-dark-400 font-medium">or enter manually</span>
                            <div className="flex-1 h-px bg-dark-200" />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-semibold text-dark-500 mb-1.5">Street Address</label>
                                <input type="text" placeholder="e.g. 42, MG Road, Banjara Hills" required value={address.street}
                                    onChange={(e) => { setAddress({ ...address, street: e.target.value }); setLocationUsed(false); }}
                                    className="w-full px-4 py-3 rounded-xl border border-dark-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-dark-500 mb-1.5">City</label>
                                <input type="text" placeholder="e.g. Hyderabad" required value={address.city}
                                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-dark-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-dark-500 mb-1.5">State</label>
                                <input type="text" placeholder="e.g. Telangana" required value={address.state}
                                    onChange={(e) => setAddress({ ...address, state: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-dark-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-dark-500 mb-1.5">ZIP Code</label>
                                <input type="text" placeholder="e.g. 500034" required value={address.zip}
                                    onChange={(e) => setAddress({ ...address, zip: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-dark-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-dark-500 mb-1.5">Scheduled Date & Time</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400 pointer-events-none" />
                                    <input type="datetime-local" required value={scheduledDate}
                                        onChange={(e) => setScheduledDate(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-dark-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none text-sm" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div className="bg-white rounded-2xl border border-dark-100 p-6 animate-slide-up">
                        <h2 className="text-lg font-bold text-dark-800 mb-4 flex items-center gap-2">
                            <Lock className="w-5 h-5 text-primary-500" /> Payment Method
                        </h2>
                        <div className="space-y-3">
                            {paymentOptions.map((opt) => (
                                <label
                                    key={opt.value}
                                    className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === opt.value
                                        ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                                        : 'border-dark-200 hover:border-primary-300'
                                        }`}
                                >
                                    <input type="radio" name="payment" value={opt.value} checked={paymentMethod === opt.value}
                                        onChange={() => setPaymentMethod(opt.value)} className="hidden" />
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${paymentMethod === opt.value ? 'bg-primary-600 text-white' : 'bg-dark-100 text-dark-500'
                                        }`}>
                                        <opt.icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold text-dark-800">{opt.label}</p>
                                            {opt.badge && (
                                                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${opt.badgeColor}`}>
                                                    {opt.badge}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-dark-400">{opt.desc}</p>
                                    </div>
                                </label>
                            ))}
                        </div>

                        {/* Razorpay info */}
                        {(paymentMethod === 'upi' || paymentMethod === 'card') && (
                            <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                                <div className="flex items-start gap-3">
                                    <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-semibold text-blue-800">Secured by Razorpay</p>
                                        <p className="text-xs text-blue-600 mt-1">
                                            You'll be redirected to Razorpay's secure payment page. Supports UPI (GooglePay, PhonePe, Paytm), cards, netbanking, and wallets.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* UPI QR Scan info */}
                        {paymentMethod === 'upi-qr' && (
                            <div className="mt-4 p-4 bg-violet-50 rounded-xl border border-violet-200">
                                <div className="flex items-start gap-3">
                                    <QrCode className="w-5 h-5 text-violet-600 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-semibold text-violet-800">📱 Scan & Pay with UPI</p>
                                        <p className="text-xs text-violet-700 mt-1">
                                            After booking, a <strong>UPI QR code</strong> will appear on your booking page. Open <strong>GPay, PhonePe, or Paytm</strong> → scan the QR → pay instantly!
                                        </p>
                                        <div className="flex items-center gap-2 mt-3">
                                            <span className="text-xs bg-violet-100 text-violet-700 px-2 py-1 rounded-full font-medium">📲 Google Pay</span>
                                            <span className="text-xs bg-violet-100 text-violet-700 px-2 py-1 rounded-full font-medium">📲 PhonePe</span>
                                            <span className="text-xs bg-violet-100 text-violet-700 px-2 py-1 rounded-full font-medium">📲 Paytm</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {paymentMethod === 'cash' && (
                            <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
                                <div className="flex items-start gap-3">
                                    <Smartphone className="w-5 h-5 text-amber-600 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-semibold text-amber-800">📱 QR Code Available</p>
                                        <p className="text-xs text-amber-700 mt-1">
                                            After booking, you'll get a <strong>UPI QR code</strong> on your booking page. You can scan it and pay anytime — before or after the service. No cash needed!
                                        </p>
                                        <div className="flex items-center gap-3 mt-3">
                                            <span className="inline-flex items-center gap-1 text-xs text-amber-800 bg-amber-100 px-2 py-1 rounded-full font-medium">✅ Pay before service</span>
                                            <span className="inline-flex items-center gap-1 text-xs text-amber-800 bg-amber-100 px-2 py-1 rounded-full font-medium">✅ Pay after service</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right — Order Summary */}
                <div>
                    <div className="bg-white rounded-2xl border border-dark-100 p-6 sticky top-24">
                        <h2 className="text-lg font-bold text-dark-800 mb-4">Order Summary</h2>
                        <div className="space-y-3 mb-4">
                            {items.map((item) => (
                                <div key={item._id} className="flex justify-between text-sm">
                                    <span className="text-dark-600">{item.name} × {item.quantity}</span>
                                    <span className="font-bold text-dark-800">₹{item.price * item.quantity}</span>
                                </div>
                            ))}
                        </div>
                        <div className="border-t border-dark-100 pt-3 mb-4">
                            <div className="flex justify-between">
                                <span className="font-bold text-dark-900">Total</span>
                                <span className="text-xl font-extrabold text-primary-600">₹{totalAmount}</span>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : paymentMethod === 'cash' ? (
                                <><Banknote className="w-4 h-4" /> Place Booking (Pay Later)</>
                            ) : (
                                <><Lock className="w-4 h-4" /> Pay ₹{totalAmount} & Book</>
                            )}
                        </button>

                        {/* Trust indicators */}
                        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-dark-400">
                            <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Secure</span>
                            <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> Encrypted</span>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default Checkout;
