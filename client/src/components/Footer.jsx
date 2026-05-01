import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, ArrowRight } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-dark-900 text-dark-400">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
                    {/* Brand */}
                    <div className="col-span-2 md:col-span-1">
                        <div className="flex items-center gap-2.5 mb-5">
                            <div className="w-9 h-9 bg-primary-500 rounded-xl flex items-center justify-center">
                                <span className="text-white font-extrabold text-sm">S</span>
                            </div>
                            <span className="text-lg font-extrabold text-white">service<span className="text-primary-400">go</span></span>
                        </div>
                        <p className="text-sm leading-relaxed mb-6">
                            India's most trusted platform for booking verified home services — quick, transparent, reliable.
                        </p>
                        {/* Social icons */}
                        <div className="flex items-center gap-3">
                            {[
                                { label: 'X', path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' },
                                { label: 'Ig', path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z' },
                                { label: 'Fb', path: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' },
                            ].map((s, i) => (
                                <a key={i} href="#" className="w-9 h-9 bg-dark-800 hover:bg-primary-500 rounded-xl flex items-center justify-center transition-all duration-300 group">
                                    <svg className="w-4 h-4 fill-dark-400 group-hover:fill-white transition-colors" viewBox="0 0 24 24">
                                        <path d={s.path} />
                                    </svg>
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Services */}
                    <div>
                        <h4 className="text-white font-bold text-sm mb-5">Services</h4>
                        <div className="flex flex-col gap-3">
                            {['Cleaning', 'Plumbing', 'Electrical', 'Beauty', 'Cooking', 'Appliance Repair', 'Home Repair'].map((s) => (
                                <Link key={s} to={`/services?category=${s.toLowerCase().replace(' ', '-')}`}
                                    className="text-sm hover:text-primary-400 hover:translate-x-1 transition-all duration-200">{s}</Link>
                            ))}
                        </div>
                    </div>

                    {/* Company */}
                    <div>
                        <h4 className="text-white font-bold text-sm mb-5">Company</h4>
                        <div className="flex flex-col gap-3">
                            <Link to="/services" className="text-sm hover:text-primary-400 hover:translate-x-1 transition-all duration-200">Browse Services</Link>
                            <Link to="/register" className="text-sm hover:text-primary-400 hover:translate-x-1 transition-all duration-200">Become a Pro</Link>
                            <Link to="/login" className="text-sm hover:text-primary-400 hover:translate-x-1 transition-all duration-200">Login</Link>
                            <span className="text-sm">About Us</span>
                            <span className="text-sm">Careers</span>
                        </div>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="text-white font-bold text-sm mb-5">Legal</h4>
                        <div className="flex flex-col gap-3">
                            <span className="text-sm">Terms of Service</span>
                            <span className="text-sm">Privacy Policy</span>
                            <span className="text-sm">Refund Policy</span>
                            <span className="text-sm">Cookie Policy</span>
                        </div>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="text-white font-bold text-sm mb-5">Contact</h4>
                        <div className="flex flex-col gap-4">
                            <div className="flex items-start gap-3">
                                <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-primary-400" />
                                <p className="text-sm">Hyderabad, Telangana, India</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Phone className="w-4 h-4 shrink-0 text-primary-400" />
                                <p className="text-sm">+91 98765 43210</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Mail className="w-4 h-4 shrink-0 text-primary-400" />
                                <p className="text-sm">support@servicego.in</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom bar */}
            <div className="border-t border-dark-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-xs">© {new Date().getFullYear()} ServiceGo. All rights reserved.</p>
                    <div className="flex items-center gap-4 text-xs">
                        <span>Terms</span>
                        <span className="w-1 h-1 bg-dark-600 rounded-full" />
                        <span>Privacy</span>
                        <span className="w-1 h-1 bg-dark-600 rounded-full" />
                        <span>Made with ❤️ in India</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
