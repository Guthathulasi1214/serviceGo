import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import { Calendar, MapPin, CreditCard, Star, ArrowLeft, CheckCircle, Navigation, QrCode, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const statusSteps = ['booked', 'assigned', 'on-the-way', 'arrived', 'in-progress', 'completed', 'reviewed'];

const BookingDetail = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
    const [showReview, setShowReview] = useState(false);
    const [qrCode, setQrCode] = useState(null);
    const [qrLoading, setQrLoading] = useState(false);
    const [payConfirming, setPayConfirming] = useState(false);

    useEffect(() => { fetchBooking(); }, [id]);

    const fetchBooking = async () => {
        try {
            const { data } = await API.get(`/bookings/${id}`);
            setBooking(data.data);
        } catch (err) {
            toast.error('Booking not found');
            navigate('/bookings');
        } finally {
            setLoading(false);
        }
    };

    const submitReview = async (e) => {
        e.preventDefault();
        try {
            await API.post('/reviews', { bookingId: id, ...reviewData });
            toast.success('Review submitted!');
            fetchBooking();
            setShowReview(false);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to submit review');
        }
    };

    const generateQR = async () => {
        setQrLoading(true);
        try {
            const { data } = await API.post('/payments/qr', { bookingId: id });
            setQrCode(data.data);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to generate QR');
        } finally {
            setQrLoading(false);
        }
    };

    const confirmPayment = async () => {
        setPayConfirming(true);
        try {
            await API.put('/payments/confirm', { bookingId: id });
            toast.success('💰 Payment confirmed!');
            setQrCode(null);
            fetchBooking();
        } catch (err) {
            toast.error('Failed to confirm payment');
        } finally {
            setPayConfirming(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
        );
    }

    if (!booking) return null;

    const currentStep = statusSteps.indexOf(booking.status);
    const showQR = booking.paymentMethod === 'cash' && booking.paymentStatus !== 'paid' && ['in-progress', 'completed', 'arrived'].includes(booking.status);

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <button onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-dark-500 hover:text-primary-600 mb-6">
                <ArrowLeft className="w-4 h-4" /> Back
            </button>

            {/* Header */}
            <div className="bg-white rounded-2xl border border-dark-100 p-6 mb-6 animate-fade-in">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <p className="text-xs text-dark-400 mb-1">Booking #{booking._id.slice(-8).toUpperCase()}</p>
                        <h1 className="text-2xl font-extrabold text-dark-900">
                            {booking.services?.map((s) => s.service?.name).join(', ')}
                        </h1>
                    </div>
                    <span className="px-4 py-1.5 rounded-full text-sm font-semibold capitalize bg-primary-100 text-primary-700">
                        {booking.status}
                    </span>
                </div>

                {/* Status Timeline */}
                <div className="flex items-center gap-1 overflow-x-auto py-4">
                    {statusSteps.map((step, i) => (
                        <div key={step} className="flex items-center">
                            <div className={`flex flex-col items-center ${i <= currentStep ? 'text-primary-600' : 'text-dark-300'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i <= currentStep ? 'bg-primary-600 text-white' : 'bg-dark-100 text-dark-400'
                                    } ${i === currentStep ? 'ring-4 ring-primary-200 animate-pulse-glow' : ''}`}>
                                    {i < currentStep ? <CheckCircle className="w-4 h-4" /> : i + 1}
                                </div>
                                <span className="text-[10px] mt-1 capitalize whitespace-nowrap font-medium">{step}</span>
                            </div>
                            {i < statusSteps.length - 1 && (
                                <div className={`w-8 h-0.5 mx-1 ${i < currentStep ? 'bg-primary-500' : 'bg-dark-200'}`} />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Details */}
                <div className="bg-white rounded-2xl border border-dark-100 p-6">
                    <h3 className="font-bold text-dark-800 mb-4">Booking Details</h3>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm">
                            <Calendar className="w-4 h-4 text-dark-400" />
                            <span className="text-dark-600">{new Date(booking.scheduledDate).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <MapPin className="w-4 h-4 text-dark-400" />
                            <span className="text-dark-600">{booking.address?.street}, {booking.address?.city}, {booking.address?.state} {booking.address?.zip}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <CreditCard className="w-4 h-4 text-dark-400" />
                            <span className="text-dark-600 capitalize">{booking.paymentMethod}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${booking.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {booking.paymentStatus}
                            </span>
                        </div>
                        {booking.provider && (
                            <div className="flex items-center gap-3 text-sm">
                                <Star className="w-4 h-4 text-dark-400" />
                                <span className="text-dark-600">Provider: {booking.provider.name}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Services & Total */}
                <div className="bg-white rounded-2xl border border-dark-100 p-6">
                    <h3 className="font-bold text-dark-800 mb-4">Services</h3>
                    <div className="space-y-3 mb-4">
                        {booking.services?.map((s, i) => (
                            <div key={i} className="flex justify-between text-sm">
                                <span className="text-dark-600">{s.service?.name} × {s.quantity}</span>
                                <span className="font-bold text-dark-800">₹{s.price}</span>
                            </div>
                        ))}
                    </div>
                    <div className="border-t border-dark-100 pt-3">
                        <div className="flex justify-between">
                            <span className="font-bold">Total</span>
                            <span className="text-xl font-extrabold text-primary-600">₹{booking.totalAmount}</span>
                        </div>
                        <p className="text-xs text-dark-400 mt-1">Platform commission: ₹{booking.commission}</p>
                    </div>
                </div>
            </div>

            {/* QR Code Payment Section */}
            {showQR && user?.role === 'consumer' && (
                <div className="mt-6 bg-gradient-to-br from-primary-50 to-accent-500/5 rounded-2xl border-2 border-primary-200 p-6 text-center animate-fade-in">
                    <QrCode className="w-8 h-8 text-primary-600 mx-auto mb-3" />
                    <h3 className="font-bold text-dark-800 text-lg mb-2">Pay via UPI / QR Code</h3>
                    <p className="text-sm text-dark-500 mb-4">Scan the QR code with any UPI app to pay ₹{booking.totalAmount}</p>

                    {!qrCode ? (
                        <button onClick={generateQR} disabled={qrLoading}
                            className="px-8 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-all flex items-center gap-2 mx-auto disabled:opacity-50">
                            {qrLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <QrCode className="w-5 h-5" />}
                            {qrLoading ? 'Generating...' : 'Show QR Code'}
                        </button>
                    ) : (
                        <div className="space-y-4">
                            <img src={qrCode.qrCode} alt="UPI QR Code" className="w-64 h-64 mx-auto rounded-xl shadow-lg border-4 border-white" />
                            <p className="text-lg font-extrabold text-primary-600">₹{qrCode.amount}</p>
                            <p className="text-xs text-dark-400">Scan with Google Pay, PhonePe, Paytm, or any UPI app</p>
                        </div>
                    )}
                </div>
            )}

            {/* Provider can confirm cash payment */}
            {booking.paymentMethod === 'cash' && booking.paymentStatus !== 'paid' && user?.role === 'provider' && ['in-progress', 'completed'].includes(booking.status) && (
                <div className="mt-6 bg-emerald-50 rounded-2xl border-2 border-emerald-200 p-6 text-center animate-fade-in">
                    <h3 className="font-bold text-dark-800 mb-2">💰 Confirm Payment Received</h3>
                    <p className="text-sm text-dark-500 mb-4">Click below once the customer has paid</p>
                    <button onClick={confirmPayment} disabled={payConfirming}
                        className="px-8 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-all disabled:opacity-50">
                        {payConfirming ? 'Confirming...' : '✅ Mark as Paid'}
                    </button>
                </div>
            )}

            {/* Review Section */}
            {booking.status === 'completed' && user?.role === 'consumer' && (
                <div className="mt-6 bg-white rounded-2xl border border-dark-100 p-6 animate-fade-in">
                    {!showReview ? (
                        <button onClick={() => setShowReview(true)}
                            className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-xl shadow-lg flex items-center justify-center gap-2">
                            <Star className="w-5 h-5" /> Leave a Review
                        </button>
                    ) : (
                        <form onSubmit={submitReview}>
                            <h3 className="font-bold text-dark-800 mb-4">Rate this Service</h3>
                            <div className="flex gap-2 mb-4">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button key={star} type="button" onClick={() => setReviewData({ ...reviewData, rating: star })}
                                        className={`text-3xl transition-transform hover:scale-125 ${star <= reviewData.rating ? 'text-yellow-400' : 'text-dark-200'}`}>
                                        ★
                                    </button>
                                ))}
                            </div>
                            <textarea value={reviewData.comment} onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                                placeholder="Leave a comment..." rows={3}
                                className="w-full px-4 py-3 rounded-xl border border-dark-200 focus:border-primary-500 outline-none text-sm resize-none mb-4" />
                            <div className="flex gap-3">
                                <button type="submit" className="px-6 py-2.5 bg-primary-600 text-white font-semibold rounded-xl text-sm">Submit</button>
                                <button type="button" onClick={() => setShowReview(false)} className="px-6 py-2.5 bg-dark-100 text-dark-600 font-semibold rounded-xl text-sm">Cancel</button>
                            </div>
                        </form>
                    )}
                </div>
            )}

            {/* Track Provider Button */}
            {['on-the-way', 'arrived'].includes(booking.status) && user?.role === 'consumer' && (
                <button
                    onClick={() => navigate(`/track/${booking._id}`)}
                    className="w-full mt-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl shadow-lg flex items-center justify-center gap-2 hover:shadow-xl transition-all"
                >
                    <Navigation className="w-5 h-5" /> Track Provider Live
                </button>
            )}
        </div>
    );
};

export default BookingDetail;
