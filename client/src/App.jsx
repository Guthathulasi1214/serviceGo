import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Services from './pages/Services';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Bookings from './pages/Bookings';
import BookingDetail from './pages/BookingDetail';
import ConsumerDashboard from './pages/ConsumerDashboard';
import ProviderDashboard from './pages/ProviderDashboard';
import AdminDashboard from './pages/AdminDashboard';
import LiveTracking from './pages/LiveTracking';
import QRPaymentPage from './pages/QRPaymentPage';

function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
      <Router>
        <AuthProvider>
          <CartProvider>
            <div className="min-h-screen flex flex-col bg-dark-50">
              <Navbar />
              <main className="flex-1">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/services" element={<Services />} />

                  {/* Consumer Routes */}
                  <Route path="/dashboard" element={
                    <ProtectedRoute roles={['consumer']}><ConsumerDashboard /></ProtectedRoute>
                  } />
                  <Route path="/cart" element={
                    <ProtectedRoute roles={['consumer']}><Cart /></ProtectedRoute>
                  } />
                  <Route path="/checkout" element={
                    <ProtectedRoute roles={['consumer']}><Checkout /></ProtectedRoute>
                  } />
                  <Route path="/bookings" element={
                    <ProtectedRoute roles={['consumer', 'provider']}><Bookings /></ProtectedRoute>
                  } />
                  <Route path="/bookings/:id" element={
                    <ProtectedRoute roles={['consumer', 'provider', 'admin']}><BookingDetail /></ProtectedRoute>
                  } />
                  <Route path="/track/:bookingId" element={
                    <ProtectedRoute roles={['consumer']}><LiveTracking /></ProtectedRoute>
                  } />
                  <Route path="/pay/:bookingId" element={
                    <ProtectedRoute roles={['consumer']}><QRPaymentPage /></ProtectedRoute>
                  } />

                  {/* Provider Routes */}
                  <Route path="/provider" element={
                    <ProtectedRoute roles={['provider']}><ProviderDashboard /></ProtectedRoute>
                  } />

                  {/* Admin Routes */}
                  <Route path="/admin" element={
                    <ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>
                  } />
                </Routes>
              </main>
              <Footer />
            </div>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  borderRadius: '12px',
                  background: '#1e293b',
                  color: '#f8fafc',
                  fontSize: '14px',
                },
              }}
            />
          </CartProvider>
        </AuthProvider>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
