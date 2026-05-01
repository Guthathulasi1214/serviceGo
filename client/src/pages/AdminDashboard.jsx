import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import { Users, Package, ShoppingBag, DollarSign, CheckCircle, XCircle, Star, RefreshCw, ChevronRight, Shield, Eye, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
    const { user } = useAuth();
    const [tab, setTab] = useState('overview');
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [services, setServices] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [svcFilter, setSvcFilter] = useState('pending');

    useEffect(() => { fetchStats(); }, []);
    useEffect(() => {
        if (tab === 'users') fetchUsers();
        if (tab === 'services') fetchServices();
        if (tab === 'bookings') fetchBookings();
    }, [tab, svcFilter]);

    const fetchStats = async () => {
        try {
            const { data } = await API.get('/admin/stats');
            setStats(data.data);
        } catch (err) {
            toast.error('Failed to load stats');
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const { data } = await API.get('/admin/users', { params: { limit: 50 } });
            setUsers(data.data || []);
        } catch (err) { toast.error('Failed to load users'); }
    };

    const fetchServices = async () => {
        try {
            const { data } = await API.get('/admin/services', { params: { status: svcFilter, limit: 50 } });
            setServices(data.data || []);
        } catch (err) { toast.error('Failed to load services'); }
    };

    const fetchBookings = async () => {
        try {
            const { data } = await API.get('/admin/bookings', { params: { limit: 50 } });
            setBookings(data.data || []);
        } catch (err) { toast.error('Failed to load bookings'); }
    };

    const approveService = async (id) => {
        try {
            await API.put(`/admin/services/${id}/approve`);
            toast.success('Service approved! ✅');
            fetchServices();
            fetchStats();
        } catch (err) { toast.error('Failed to approve'); }
    };

    const rejectService = async (id) => {
        if (!confirm('Reject and delete this service?')) return;
        try {
            await API.delete(`/admin/services/${id}/reject`);
            toast.success('Service rejected');
            fetchServices();
            fetchStats();
        } catch (err) { toast.error('Failed to reject'); }
    };

    const verifyProvider = async (id) => {
        try {
            await API.put(`/admin/users/${id}/verify`);
            toast.success('Provider verified! ✅');
            fetchUsers();
        } catch (err) { toast.error('Failed to verify'); }
    };

    const confirmPayment = async (bookingId) => {
        try {
            await API.put(`/admin/bookings/${bookingId}/confirm-payment`);
            toast.success('Payment confirmed! 💰');
            fetchBookings();
            fetchStats();
        } catch (err) { toast.error('Failed to confirm payment'); }
    };

    const tabs = [
        { id: 'overview', label: 'Overview', icon: Eye },
        { id: 'services', label: 'Services', icon: Package },
        { id: 'users', label: 'Users', icon: Users },
        { id: 'bookings', label: 'Bookings', icon: ShoppingBag },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-dark-900 to-dark-800 rounded-3xl p-8 text-white mb-8">
                <h1 className="text-3xl font-extrabold">Admin Dashboard 🛡️</h1>
                <p className="text-white/60 mt-2">Manage services, users, bookings & revenue</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {tabs.map((t) => (
                    <button key={t.id} onClick={() => setTab(t.id)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${tab === t.id ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/25' : 'bg-white text-dark-500 border border-dark-100 hover:bg-dark-50'
                            }`}>
                        <t.icon className="w-4 h-4" /> {t.label}
                    </button>
                ))}
            </div>

            {/* === OVERVIEW TAB === */}
            {tab === 'overview' && stats && (
                <div className="space-y-6 animate-fade-in">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard icon={Users} label="Total Users" value={stats.users.total} color="from-blue-500 to-indigo-600" />
                        <StatCard icon={Package} label="Services" value={`${stats.services.approved}/${stats.services.total}`} sub={`${stats.services.pending} pending`} color="from-emerald-500 to-teal-600" />
                        <StatCard icon={ShoppingBag} label="Bookings" value={stats.bookings.total} color="from-orange-500 to-red-500" />
                        <StatCard icon={DollarSign} label="Revenue" value={`₹${stats.revenue.total.toLocaleString()}`} sub={`₹${stats.revenue.commission.toLocaleString()} commission`} color="from-purple-500 to-pink-600" />
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white rounded-2xl border border-dark-100 p-5">
                            <h3 className="font-bold text-dark-800 mb-3">Users Breakdown</h3>
                            <div className="space-y-2">
                                <StatRow label="Consumers" value={stats.users.consumers} />
                                <StatRow label="Providers" value={stats.users.providers} />
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl border border-dark-100 p-5">
                            <h3 className="font-bold text-dark-800 mb-3">Bookings by Status</h3>
                            <div className="space-y-2">
                                {Object.entries(stats.bookings.byStatus || {}).map(([status, count]) => (
                                    <StatRow key={status} label={status} value={count} />
                                ))}
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl border border-dark-100 p-5">
                            <h3 className="font-bold text-dark-800 mb-3">💰 Commission</h3>
                            <p className="text-3xl font-extrabold text-primary-600">₹{stats.revenue.commission.toLocaleString()}</p>
                            <p className="text-xs text-dark-400 mt-1">From {stats.bookings.byStatus?.completed || 0} completed bookings</p>
                        </div>
                    </div>

                    {/* Recent Bookings */}
                    <div className="bg-white rounded-2xl border border-dark-100 p-5">
                        <h3 className="font-bold text-dark-800 mb-4">Recent Bookings</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-dark-100 text-dark-400 text-left">
                                        <th className="pb-3 font-medium">ID</th>
                                        <th className="pb-3 font-medium">Consumer</th>
                                        <th className="pb-3 font-medium">Provider</th>
                                        <th className="pb-3 font-medium">Amount</th>
                                        <th className="pb-3 font-medium">Status</th>
                                        <th className="pb-3 font-medium">Payment</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.recentBookings?.map((b) => (
                                        <tr key={b._id} className="border-b border-dark-50">
                                            <td className="py-3 font-mono text-xs">#{b._id.slice(-6)}</td>
                                            <td className="py-3">{b.consumer?.name || 'N/A'}</td>
                                            <td className="py-3">{b.provider?.name || 'Pending'}</td>
                                            <td className="py-3 font-bold">₹{b.totalAmount}</td>
                                            <td className="py-3"><StatusBadge status={b.status} /></td>
                                            <td className="py-3"><PaymentBadge status={b.paymentStatus} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* === SERVICES TAB === */}
            {tab === 'services' && (
                <div className="space-y-4 animate-fade-in">
                    <div className="flex gap-2 mb-4">
                        {['pending', 'approved'].map((f) => (
                            <button key={f} onClick={() => setSvcFilter(f)}
                                className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize ${svcFilter === f ? 'bg-primary-600 text-white' : 'bg-white text-dark-500 border border-dark-100'
                                    }`}>
                                {f} {f === 'pending' && stats ? `(${stats.services.pending})` : ''}
                            </button>
                        ))}
                    </div>

                    {services.length === 0 ? (
                        <div className="text-center py-10 bg-white rounded-2xl border border-dark-100">
                            <Package className="w-12 h-12 text-dark-200 mx-auto mb-2" />
                            <p className="text-dark-400">No {svcFilter} services</p>
                        </div>
                    ) : (
                        services.map((svc) => (
                            <div key={svc._id} className="bg-white rounded-2xl border border-dark-100 p-5 flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-dark-800">{svc.name}</h3>
                                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-dark-100 text-dark-500 capitalize">{svc.category}</span>
                                    </div>
                                    <p className="text-xs text-dark-400">{svc.description?.slice(0, 80)}</p>
                                    <p className="text-xs text-dark-400 mt-1">
                                        By: <strong>{svc.provider?.name || 'Unknown'}</strong> ({svc.provider?.email}) • {svc.duration} min
                                    </p>
                                    <p className="text-lg font-extrabold text-primary-600 mt-1">₹{svc.price}</p>
                                </div>
                                <div className="flex gap-2">
                                    {!svc.isApproved && (
                                        <>
                                            <button onClick={() => approveService(svc._id)}
                                                className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 flex items-center gap-1">
                                                <CheckCircle className="w-4 h-4" /> Approve
                                            </button>
                                            <button onClick={() => rejectService(svc._id)}
                                                className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 flex items-center gap-1">
                                                <XCircle className="w-4 h-4" /> Reject
                                            </button>
                                        </>
                                    )}
                                    {svc.isApproved && (
                                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">✅ Approved</span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* === USERS TAB === */}
            {tab === 'users' && (
                <div className="space-y-4 animate-fade-in">
                    {users.length === 0 ? (
                        <p className="text-center text-dark-400 py-10">No users found</p>
                    ) : (
                        <div className="bg-white rounded-2xl border border-dark-100 overflow-hidden">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-dark-50 text-dark-500 text-left">
                                        <th className="px-5 py-3 font-medium">Name</th>
                                        <th className="px-5 py-3 font-medium">Email</th>
                                        <th className="px-5 py-3 font-medium">Role</th>
                                        <th className="px-5 py-3 font-medium">Rating</th>
                                        <th className="px-5 py-3 font-medium">Verified</th>
                                        <th className="px-5 py-3 font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((u) => (
                                        <tr key={u._id} className="border-b border-dark-50 hover:bg-dark-50/50">
                                            <td className="px-5 py-3 font-semibold text-dark-800">{u.name}</td>
                                            <td className="px-5 py-3 text-dark-500">{u.email}</td>
                                            <td className="px-5 py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${u.role === 'admin' ? 'bg-purple-100 text-purple-700'
                                                        : u.role === 'provider' ? 'bg-blue-100 text-blue-700'
                                                            : 'bg-green-100 text-green-700'
                                                    }`}>{u.role}</span>
                                            </td>
                                            <td className="px-5 py-3">
                                                {u.role === 'provider' ? (
                                                    <span className="flex items-center gap-1 text-yellow-600 font-semibold">
                                                        <Star className="w-3 h-3 fill-yellow-500" /> {u.averageRating || 0}
                                                    </span>
                                                ) : '—'}
                                            </td>
                                            <td className="px-5 py-3">
                                                {u.isVerified ? (
                                                    <span className="text-emerald-600 font-semibold flex items-center gap-1"><Shield className="w-3 h-3" /> Yes</span>
                                                ) : (
                                                    <span className="text-dark-300">No</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3">
                                                {u.role === 'provider' && !u.isVerified && (
                                                    <button onClick={() => verifyProvider(u._id)}
                                                        className="px-3 py-1 bg-primary-600 text-white text-xs font-semibold rounded-lg hover:bg-primary-700">
                                                        Verify
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* === BOOKINGS TAB === */}
            {tab === 'bookings' && (
                <div className="space-y-4 animate-fade-in">
                    <button onClick={fetchBookings} className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-semibold mb-2">
                        <RefreshCw className="w-4 h-4" /> Refresh
                    </button>
                    {bookings.length === 0 ? (
                        <p className="text-center text-dark-400 py-10">No bookings found</p>
                    ) : (
                        bookings.map((b) => (
                            <div key={b._id} className="bg-white rounded-2xl border border-dark-100 p-5">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xs font-mono text-dark-400">#{b._id.slice(-8).toUpperCase()}</span>
                                            <StatusBadge status={b.status} />
                                            <PaymentBadge status={b.paymentStatus} />
                                        </div>
                                        <p className="font-bold text-dark-800">{b.services?.map((s) => s.service?.name).join(', ')}</p>
                                        <p className="text-xs text-dark-400 mt-1">
                                            Consumer: {b.consumer?.name || 'N/A'} • Provider: {b.provider?.name || 'Unassigned'}
                                        </p>
                                        {b.address && (
                                            <p className="text-xs text-dark-400 mt-1">📍 {b.address.street}, {b.address.city}</p>
                                        )}
                                        <p className="text-xs text-dark-300 mt-1">
                                            Commission: <strong className="text-primary-600">₹{b.commission}</strong>
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-extrabold text-dark-900">₹{b.totalAmount}</p>
                                        {b.paymentStatus !== 'paid' && (
                                            <button onClick={() => confirmPayment(b._id)}
                                                className="mt-2 px-3 py-1 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700">
                                                Confirm Paid
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

// Helper components
const StatCard = ({ icon: Icon, label, value, sub, color }) => (
    <div className={`bg-gradient-to-br ${color} rounded-2xl p-5 text-white`}>
        <Icon className="w-6 h-6 text-white/60 mb-2" />
        <p className="text-2xl font-extrabold">{value}</p>
        <p className="text-sm text-white/80">{label}</p>
        {sub && <p className="text-xs text-white/50 mt-1">{sub}</p>}
    </div>
);

const StatRow = ({ label, value }) => (
    <div className="flex items-center justify-between">
        <span className="text-dark-500 text-sm capitalize">{label}</span>
        <span className="font-bold text-dark-800">{value}</span>
    </div>
);

const StatusBadge = ({ status }) => {
    const colors = {
        booked: 'bg-gray-100 text-gray-700', assigned: 'bg-blue-100 text-blue-700',
        'on-the-way': 'bg-orange-100 text-orange-700', arrived: 'bg-teal-100 text-teal-700',
        'in-progress': 'bg-yellow-100 text-yellow-700', completed: 'bg-emerald-100 text-emerald-700',
        reviewed: 'bg-purple-100 text-purple-700', cancelled: 'bg-red-100 text-red-700',
    };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${colors[status] || 'bg-gray-100'}`}>{status}</span>;
};

const PaymentBadge = ({ status }) => {
    const colors = { paid: 'bg-emerald-100 text-emerald-700', pending: 'bg-yellow-100 text-yellow-700', failed: 'bg-red-100 text-red-700' };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${colors[status] || 'bg-gray-100'}`}>{status}</span>;
};

export default AdminDashboard;
