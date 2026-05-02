import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import { QrCode, CheckCircle, ArrowLeft, Loader2, RefreshCw, Shield, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';

const QRPaymentPage = () => {
    const { bookingId } = useParams();
    useAuth();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [qrData, setQrData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [qrLoading, setQrLoading] = useState(false);
    const [paid, setPaid] = useState(false);
    const pollRef = useRef(null);

    useEffect(() => {
        fetchBookingAndQR();
        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, [bookingId]);

    const fetchBookingAndQR = async () => {
        setLoading(true);
        try {
            // Fetch booking details
            const { data } = await API.get(`/bookings/${bookingId}`);
            const b = data.data;
            setBooking(b);

            if (b.paymentStatus === 'paid') {
                setPaid(true);
                setLoading(false);
                return;
            }

            // Generate QR
            await generateQR();

            // Start polling for payment status every 5 seconds
            pollRef.current = setInterval(async () => {
                try {
                    const res = await API.get(`/bookings/${bookingId}`);
                    if (res.data.data.paymentStatus === 'paid') {
                        setPaid(true);
                        clearInterval(pollRef.current);
                        toast.success('🎉 Payment received! Booking confirmed.', { duration: 5000 });
                    }
                } catch { /* ignore */ }
            }, 5000);
        } catch (_err) {
            toast.error('Failed to load booking');
            navigate('/bookings');
        } finally {
            setLoading(false);
        }
    };

    const generateQR = async () => {
        setQrLoading(true);
        try {
            const { data } = await API.post('/payments/qr', { bookingId });
            setQrData(data.data);
        } catch (_err) {
            toast.error('Failed to generate QR code');
        } finally {
            setQrLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-primary-500 animate-spin mx-auto mb-3" />
                    <p className="text-dark-500 text-sm">Loading payment page...</p>
                </div>
            </div>
        );
    }

    if (paid) {
        return (
            <div className="max-w-lg mx-auto px-4 py-16 text-center animate-fade-in">
                <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-primary-500" />
                </div>
                <h1 className="text-2xl font-extrabold text-dark-900 mb-2">Payment Successful!</h1>
                <p className="text-dark-500 mb-1">Booking #{bookingId?.slice(-8).toUpperCase()}</p>
                <p className="text-2xl font-extrabold text-primary-500 mb-6">₹{booking?.totalAmount}</p>
                <div className="bg-primary-50 rounded-2xl p-4 mb-6 border border-primary-100">
                    <p className="text-sm text-primary-700 font-semibold">✅ Payment verified & booking confirmed</p>
                    <p className="text-xs text-primary-600 mt-1">Your service provider has been notified</p>
                </div>
                <button onClick={() => navigate('/bookings')}
                    className="px-8 py-3 bg-primary-500 text-white font-bold rounded-xl hover:bg-primary-600 transition-all">
                    View My Bookings
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-lg mx-auto px-4 py-8 animate-fade-in">
            <button onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-dark-500 hover:text-primary-600 mb-6 text-sm">
                <ArrowLeft className="w-4 h-4" /> Back
            </button>

            {/* Header */}
            <div className="text-center mb-6">
                <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <QrCode className="w-8 h-8 text-violet-600" />
                </div>
                <h1 className="text-2xl font-extrabold text-dark-900">Scan & Pay</h1>
                <p className="text-dark-400 text-sm mt-1">
                    Booking #{bookingId?.slice(-8).toUpperCase()}
                </p>
            </div>

            {/* Amount Card */}
            <div className="bg-white rounded-2xl border border-dark-200 p-6 text-center mb-6">
                <p className="text-xs text-dark-400 mb-1">Amount to Pay</p>
                <p className="text-4xl font-extrabold text-dark-900">₹{booking?.totalAmount}</p>
                <div className="flex items-center justify-center gap-2 mt-3">
                    {booking?.services?.map((s, i) => (
                        <span key={i} className="text-xs bg-dark-100 px-2 py-1 rounded-lg text-dark-500">
                            {s.service?.name || 'Service'}
                        </span>
                    ))}
                </div>
            </div>

            {/* QR Code */}
            <div className="bg-white rounded-2xl border-2 border-violet-200 p-6 text-center mb-6">
                {qrLoading ? (
                    <div className="py-10">
                        <Loader2 className="w-8 h-8 text-violet-500 animate-spin mx-auto mb-3" />
                        <p className="text-dark-500 text-sm">Generating QR code...</p>
                    </div>
                ) : qrData ? (
                    <>
                        <img
                            src={qrData.qrCode}
                            alt="UPI QR Code"
                            className="w-64 h-64 mx-auto rounded-xl shadow-lg border-4 border-white mb-4"
                        />
                        <p className="text-lg font-extrabold text-violet-700 mb-1">₹{qrData.amount}</p>
                        <p className="text-xs text-dark-400 mb-4">Scan this QR code with any UPI app</p>

                        {/* UPI App badges */}
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full font-semibold">📲 Google Pay</span>
                            <span className="text-xs bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full font-semibold">📲 PhonePe</span>
                            <span className="text-xs bg-cyan-50 text-cyan-700 px-3 py-1.5 rounded-full font-semibold">📲 Paytm</span>
                        </div>

                        <button onClick={generateQR} className="text-xs text-dark-400 hover:text-violet-600 flex items-center gap-1 mx-auto">
                            <RefreshCw className="w-3 h-3" /> Refresh QR
                        </button>
                    </>
                ) : (
                    <div className="py-8">
                        <p className="text-dark-500 mb-3">Failed to generate QR</p>
                        <button onClick={generateQR}
                            className="px-6 py-2 bg-violet-500 text-white font-semibold rounded-xl text-sm">
                            Try Again
                        </button>
                    </div>
                )}
            </div>

            {/* Instructions */}
            <div className="bg-dark-100 rounded-2xl p-5 mb-6">
                <h3 className="text-sm font-bold text-dark-800 mb-3">How to pay:</h3>
                <div className="space-y-2">
                    {[
                        'Open Google Pay, PhonePe, or Paytm on your phone',
                        'Tap "Scan QR" or the scanner icon',
                        'Point your camera at the QR code above',
                        'Confirm the amount and complete the payment',
                    ].map((step, i) => (
                        <div key={i} className="flex items-start gap-3">
                            <span className="w-6 h-6 bg-primary-500 text-white text-xs font-bold rounded-full flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                            <p className="text-sm text-dark-600">{step}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Auto-checking notice */}
            <div className="flex items-center justify-center gap-2 text-xs text-dark-400">
                <Loader2 className="w-3 h-3 animate-spin" />
                Automatically checking for payment... This page will update once paid.
            </div>

            {/* Security badge */}
            <div className="flex items-center justify-center gap-2 mt-4 text-xs text-dark-400">
                <Shield className="w-3.5 h-3.5" />
                Secured by Razorpay • 256-bit encryption
            </div>
        </div>
    );
};

export default QRPaymentPage;
