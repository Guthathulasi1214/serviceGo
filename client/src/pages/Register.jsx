import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { UserPlus, Mail, Lock, User, Phone, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', confirmPassword: '', role: 'consumer', phone: '',
    });
    const [loading, setLoading] = useState(false);
    const { register, googleLogin } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            return toast.error('Passwords do not match');
        }
        setLoading(true);
        try {
            const { confirmPassword: _confirmPassword, ...data } = formData;
            const user = await register(data);
            toast.success(`Welcome, ${user.name}!`);
            switch (user.role) {
                case 'provider': navigate('/provider'); break;
                default: navigate('/dashboard');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const user = await googleLogin(credentialResponse.credential, formData.role);
            toast.success(`Welcome, ${user.name}!`);
            switch (user.role) {
                case 'provider': navigate('/provider'); break;
                default: navigate('/dashboard');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Google sign-up failed');
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                <div className="text-center mb-8 animate-fade-in">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-primary-500/25">
                        <UserPlus className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-dark-900">Create Account</h1>
                    <p className="text-dark-500 mt-2">Join ServiceGo today</p>
                </div>

                <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl border border-dark-100 p-8 space-y-4 animate-slide-up">
                    {/* Role Toggle */}
                    <div className="flex rounded-xl bg-dark-100 p-1">
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, role: 'consumer' })}
                            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${formData.role === 'consumer'
                                ? 'bg-white text-primary-600 shadow-md'
                                : 'text-dark-500 hover:text-dark-700'
                                }`}
                        >
                            🏠 Customer
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, role: 'provider' })}
                            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${formData.role === 'provider'
                                ? 'bg-white text-primary-600 shadow-md'
                                : 'text-dark-500 hover:text-dark-700'
                                }`}
                        >
                            🔧 Service Provider
                        </button>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-dark-700 mb-1.5">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                            <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="John Doe" required
                                className="w-full pl-11 pr-4 py-3 rounded-xl border border-dark-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all text-sm" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-dark-700 mb-1.5">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" required
                                className="w-full pl-11 pr-4 py-3 rounded-xl border border-dark-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all text-sm" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-dark-700 mb-1.5">Phone</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+91 98765 43210"
                                className="w-full pl-11 pr-4 py-3 rounded-xl border border-dark-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all text-sm" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-semibold text-dark-700 mb-1.5">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                                <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="••••••" required minLength={6}
                                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-dark-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all text-sm" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-dark-700 mb-1.5">Confirm</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="••••••" required
                                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-dark-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all text-sm" />
                            </div>
                        </div>
                    </div>

                    <button type="submit" disabled={loading}
                        className="w-full py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:from-primary-600 hover:to-primary-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <> Create Account <ArrowRight className="w-4 h-4" /> </>
                        )}
                    </button>

                    <p className="text-center text-sm text-dark-500">
                        Already have an account?{' '}
                        <Link to="/login" className="text-primary-600 font-semibold hover:text-primary-700">Sign In</Link>
                    </p>

                    {/* Divider */}
                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-dark-200" />
                        <span className="text-xs text-dark-400 font-medium">OR</span>
                        <div className="flex-1 h-px bg-dark-200" />
                    </div>

                    {/* Google Sign Up */}
                    <div className="flex justify-center">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => toast.error('Google Sign-Up failed')}
                            theme="outline"
                            size="large"
                            width="100%"
                            text="signup_with"
                            shape="pill"
                        />
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;
