import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import { io } from 'socket.io-client';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ArrowLeft, Navigation, Clock, MapPin, Phone, User } from 'lucide-react';
import toast from 'react-hot-toast';

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom provider icon (blue pulsing)
const providerIcon = L.divIcon({
    html: `<div style="
        width:20px;height:20px;background:#4f46e5;border-radius:50%;border:3px solid white;
        box-shadow:0 0 0 4px rgba(79,70,229,0.3),0 0 20px rgba(79,70,229,0.4);
        animation:pulse-marker 2s infinite;
    "></div>`,
    className: '',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
});

// Custom customer icon (green)
const customerIcon = L.divIcon({
    html: `<div style="
        width:18px;height:18px;background:#22c55e;border-radius:50%;border:3px solid white;
        box-shadow:0 0 0 3px rgba(34,197,94,0.3),0 2px 8px rgba(0,0,0,0.2);
    "></div>`,
    className: '',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
});

// Smooth map updater
const MapUpdater = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, zoom || map.getZoom(), { duration: 1.2, easeLinearity: 0.25 });
        }
    }, [center, zoom, map]);
    return null;
};

// Auto-fit bounds to show both markers
const FitBounds = ({ providerPos, customerPos }) => {
    const map = useMap();
    useEffect(() => {
        if (providerPos && customerPos) {
            const bounds = L.latLngBounds([providerPos, customerPos]);
            map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16, duration: 0.8 });
        }
    }, [providerPos, customerPos, map]);
    return null;
};

const LiveTracking = () => {
    const { bookingId } = useParams();
    const { user } = useAuth();
    const [booking, setBooking] = useState(null);
    const [providerLocation, setProviderLocation] = useState(null);
    const [customerLocation, setCustomerLocation] = useState(null);
    const [arrived, setArrived] = useState(false);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [statusText, setStatusText] = useState('Waiting for provider...');
    const socketRef = useRef(null);

    useEffect(() => {
        fetchBooking();
        getCustomerLocation();

        const token = user?.token;
        if (token && bookingId) {
            const socket = io(window.location.origin, {
                auth: { token },
                transports: ['websocket', 'polling'],
            });
            socketRef.current = socket;

            socket.on('connect', () => {
                socket.emit('booking:join', bookingId);
            });

            socket.on('location:updated', (data) => {
                setProviderLocation([data.lat, data.lng]);
                setLastUpdate(new Date());
                setStatusText('Provider is on the way');
            });

            socket.on('provider:arrived', () => {
                setArrived(true);
                setStatusText('Provider has arrived!');
                toast.success('🎉 Your service provider has arrived!', { duration: 8000 });
            });

            socket.on('booking:statusChanged', (data) => {
                const labels = {
                    'on-the-way': '🚗 Provider is heading to you',
                    'arrived': '📍 Provider has arrived!',
                    'in-progress': '⚡ Service is in progress',
                    'completed': '✅ Service completed!',
                };
                setStatusText(labels[data.status] || data.status);
                if (data.status === 'completed') {
                    toast.success('✅ Service completed! Please leave a review.', { duration: 6000 });
                }
            });

            return () => {
                socket.emit('booking:leave', bookingId);
                socket.disconnect();
            };
        }
    }, [bookingId, user?.token]);

    const fetchBooking = async () => {
        try {
            const { data } = await API.get(`/bookings/${bookingId}`);
            setBooking(data.data);
        } catch (err) {
            toast.error('Failed to load booking');
        } finally {
            setLoading(false);
        }
    };

    const getCustomerLocation = () => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setCustomerLocation([pos.coords.latitude, pos.coords.longitude]),
                () => setCustomerLocation([17.385, 78.4867]), // Hyderabad fallback
                { enableHighAccuracy: true }
            );
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[80vh]">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-dark-500 font-medium">Loading tracking...</p>
                </div>
            </div>
        );
    }

    const mapCenter = providerLocation || customerLocation || [17.385, 78.4867];

    return (
        <div className="min-h-[calc(100vh-4rem)] flex flex-col">
            {/* CSS for pulsing marker */}
            <style>{`
                @keyframes pulse-marker {
                    0%, 100% { box-shadow: 0 0 0 4px rgba(79,70,229,0.3), 0 0 20px rgba(79,70,229,0.2); }
                    50% { box-shadow: 0 0 0 12px rgba(79,70,229,0), 0 0 30px rgba(79,70,229,0.1); }
                }
            `}</style>

            {/* Top Bar */}
            <div className="bg-white border-b border-dark-100 px-4 py-3">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link to={`/bookings/${bookingId}`} className="p-2 rounded-xl hover:bg-dark-100 text-dark-500">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="font-bold text-dark-900 text-lg">Live Tracking</h1>
                            <p className="text-xs text-dark-400">Booking #{bookingId?.slice(-8).toUpperCase()}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${providerLocation ? 'bg-success-500 animate-pulse' : 'bg-dark-300'}`} />
                        <span className="text-sm font-medium text-dark-600">{providerLocation ? 'Live' : 'Waiting'}</span>
                    </div>
                </div>
            </div>

            {/* Arrival Banner */}
            {arrived && (
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-4 text-center animate-slide-up">
                    <p className="font-bold text-lg">🎉 Provider has arrived at your location!</p>
                    <p className="text-sm text-white/80 mt-1">Please meet them at your door</p>
                </div>
            )}

            {/* Map */}
            <div className="flex-1 relative">
                <MapContainer
                    center={mapCenter}
                    zoom={14}
                    style={{ height: '100%', width: '100%', minHeight: '400px' }}
                    zoomControl={false}
                >
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                        attribution='&copy; OpenStreetMap & CartoDB'
                    />
                    <MapUpdater center={providerLocation || mapCenter} />

                    {/* Fit bounds when both markers exist */}
                    {providerLocation && customerLocation && (
                        <FitBounds providerPos={providerLocation} customerPos={customerLocation} />
                    )}

                    {/* Route line between provider and customer (Blinkit-style) */}
                    {providerLocation && customerLocation && (
                        <Polyline
                            positions={[providerLocation, customerLocation]}
                            pathOptions={{
                                color: '#4f46e5',
                                weight: 4,
                                opacity: 0.8,
                                dashArray: '12, 8',
                                lineCap: 'round',
                                lineJoin: 'round',
                            }}
                        />
                    )}

                    {/* Provider marker */}
                    {providerLocation && (
                        <Marker position={providerLocation} icon={providerIcon}>
                            <Popup>
                                <div className="text-center p-1">
                                    <p className="font-bold text-primary-700">🔧 {booking?.provider?.name || 'Provider'}</p>
                                    <p className="text-xs text-gray-500 mt-1">Service Provider</p>
                                </div>
                            </Popup>
                        </Marker>
                    )}

                    {/* Customer marker */}
                    {customerLocation && (
                        <Marker position={customerLocation} icon={customerIcon}>
                            <Popup>
                                <div className="text-center p-1">
                                    <p className="font-bold text-green-700">📍 Your Location</p>
                                </div>
                            </Popup>
                        </Marker>
                    )}
                </MapContainer>

                {/* Legend overlay */}
                <div className="absolute top-4 right-4 z-[1000] bg-white/95 backdrop-blur-md rounded-xl shadow-lg px-4 py-3 border border-dark-100">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-full bg-primary-600 border-2 border-white shadow" />
                        <span className="text-xs text-dark-600 font-medium">Provider</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-full bg-success-500 border-2 border-white shadow" />
                        <span className="text-xs text-dark-600 font-medium">You</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-0 border-t-2 border-dashed border-primary-600" />
                        <span className="text-xs text-dark-600 font-medium">Route</span>
                    </div>
                </div>
            </div>

            {/* Bottom Status Panel */}
            <div className="bg-white border-t border-dark-100 px-4 py-5">
                <div className="max-w-6xl mx-auto">
                    {/* Status indicator */}
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${arrived ? 'bg-emerald-100 text-emerald-600' : providerLocation ? 'bg-primary-100 text-primary-600' : 'bg-dark-100 text-dark-400'
                            }`}>
                            {arrived ? <MapPin className="w-5 h-5" /> : <Navigation className="w-5 h-5" />}
                        </div>
                        <div>
                            <p className="font-bold text-dark-800">{statusText}</p>
                            {lastUpdate && (
                                <p className="text-xs text-dark-400 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> Updated {lastUpdate.toLocaleTimeString()}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Provider info */}
                    {booking?.provider && (
                        <div className="flex items-center justify-between bg-dark-50 rounded-xl p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                                    <User className="w-5 h-5 text-primary-600" />
                                </div>
                                <div>
                                    <p className="font-semibold text-dark-800">{booking.provider.name}</p>
                                    <p className="text-xs text-dark-400">{booking.services?.map((s) => s.service?.name).join(', ')}</p>
                                </div>
                            </div>
                            {booking.provider.phone && (
                                <a href={`tel:${booking.provider.phone}`}
                                    className="w-10 h-10 bg-success-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-green-500/25 hover:bg-green-600 transition-all">
                                    <Phone className="w-4 h-4" />
                                </a>
                            )}
                        </div>
                    )}

                    {/* Provider location coords */}
                    {providerLocation && (
                        <div className="mt-3 flex items-center gap-2 text-xs text-dark-400">
                            <MapPin className="w-3 h-3" />
                            Provider: {providerLocation[0].toFixed(5)}, {providerLocation[1].toFixed(5)}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LiveTracking;
