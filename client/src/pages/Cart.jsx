import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';

const Cart = () => {
    const { items, removeFromCart, updateQuantity, totalAmount, clearCart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();

    if (items.length === 0) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-20 text-center">
                <ShoppingCart className="w-20 h-20 text-dark-200 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-dark-700">Your cart is empty</h2>
                <p className="text-dark-400 mt-2 mb-6">Browse our services and add them to your cart</p>
                <Link
                    to="/services"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-all"
                >
                    Browse Services <ArrowRight className="w-4 h-4" />
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-extrabold text-dark-900 mb-8 animate-fade-in">Your Cart</h1>

            <div className="space-y-4 mb-8">
                {items.map((item) => (
                    <div
                        key={item._id}
                        className="bg-white rounded-2xl border border-dark-100 p-5 flex items-center gap-5 animate-slide-up hover:shadow-lg transition-shadow"
                    >
                        <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center shrink-0">
                            <span className="text-2xl">🔧</span>
                        </div>

                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-dark-800 truncate">{item.name}</h3>
                            <span className="text-xs px-2 py-0.5 bg-primary-50 text-primary-600 rounded-full capitalize">
                                {item.category}
                            </span>
                            <p className="text-lg font-extrabold text-dark-900 mt-1">₹{item.price}</p>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => updateQuantity(item._id, item.quantity - 1)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-dark-100 hover:bg-dark-200 text-dark-600 transition-colors"
                            >
                                <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center font-bold text-dark-800">{item.quantity}</span>
                            <button
                                onClick={() => updateQuantity(item._id, item.quantity + 1)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-dark-100 hover:bg-dark-200 text-dark-600 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="text-right">
                            <p className="font-extrabold text-dark-900">₹{item.price * item.quantity}</p>
                            <button
                                onClick={() => {
                                    removeFromCart(item._id);
                                    toast.success('Removed from cart');
                                }}
                                className="text-danger-500 hover:text-danger-500/80 mt-1"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Summary */}
            <div className="bg-white rounded-2xl border border-dark-100 p-6">
                <div className="flex justify-between items-center mb-3">
                    <span className="text-dark-500">Subtotal</span>
                    <span className="font-bold text-dark-800">₹{totalAmount}</span>
                </div>
                <div className="flex justify-between items-center mb-3">
                    <span className="text-dark-500">Platform Fee</span>
                    <span className="font-bold text-dark-800">₹0</span>
                </div>
                <div className="border-t border-dark-100 pt-3 flex justify-between items-center">
                    <span className="text-lg font-bold text-dark-900">Total</span>
                    <span className="text-2xl font-extrabold text-primary-600">₹{totalAmount}</span>
                </div>

                <Link
                    to="/checkout"
                    className="w-full mt-6 py-3.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 transition-all flex items-center justify-center gap-2"
                >
                    <ShoppingBag className="w-5 h-5" />
                    Proceed to Checkout
                </Link>
            </div>
        </div>
    );
};

export default Cart;
