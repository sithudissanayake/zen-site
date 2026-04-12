import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import WelcomePage from './pages/WelcomePage';
import ContactPage from './pages/ContactPage';
import ProductDisplayPage from './pages/ProductDisplayPage';
import AdminDashboard from './AdminDashboard';
import LoginModal from './components/LoginModal';
import RegisterModal from './components/RegisterModal';
import OrderList from './pages/OrderList';
import OrderDetails from './pages/OrderDetails';
import AdminOrderList from './pages/AdminOrderList';
import AdminOrderDetails from './pages/AdminOrderDetails';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [isAdminOrderView, setIsAdminOrderView] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (e) {
        console.error('Error parsing user data:', e);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
    setSelectedOrder(null);
    setShowOrderDetails(false);
  };

  const handleViewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
    setIsAdminOrderView(false);
  };

  const handleAdminViewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
    setIsAdminOrderView(true);
  };

  const handleBackToOrders = () => {
    setSelectedOrder(null);
    setShowOrderDetails(false);
    setIsAdminOrderView(false);
  };

  // Protected route for admin only
  const AdminRoute = ({ children }) => {
    if (!isAuthenticated) {
      return <Navigate to="/" replace />;
    }
    if (user?.role !== 'admin') {
      return <Navigate to="/" replace />;
    }
    return children;
  };

  // Protected route for authenticated users only
  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated) {
      return <Navigate to="/" replace />;
    }
    return children;
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#0a1628',
        color: 'white'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/" 
          element={
            <WelcomePage 
              isAuthenticated={isAuthenticated}
              user={user}
              onLogout={handleLogout}
              onShowLogin={() => setShowLogin(true)}
              onShowRegister={() => setShowRegister(true)}
            />
          } 
        />
        
        <Route 
          path="/contact" 
          element={
            <ContactPage 
              isAuthenticated={isAuthenticated}
              user={user}
              onLogout={handleLogout}
              onShowLogin={() => setShowLogin(true)}
              onShowRegister={() => setShowRegister(true)}
            />
          } 
        />
        
        <Route 
          path="/products" 
          element={
            <ProductDisplayPage 
              isAuthenticated={isAuthenticated}
              user={user}
              onLogout={handleLogout}
              onShowLogin={() => setShowLogin(true)}
              onShowRegister={() => setShowRegister(true)}
            />
          } 
        />
        
        {/* User Orders Routes - Protected (User must be logged in) */}
        <Route 
          path="/orders" 
          element={
            <ProtectedRoute>
              {showOrderDetails && !isAdminOrderView ? (
                <OrderDetails 
                  order={selectedOrder}
                  onBack={handleBackToOrders}
                />
              ) : (
                <OrderList 
                  onViewDetails={handleViewOrderDetails}
                  user={user}
                />
              )}
            </ProtectedRoute>
          } 
        />
        
        {/* Direct Order Details Route - Fetches by ID from URL */}
        <Route 
          path="/order/:id" 
          element={
            <ProtectedRoute>
              <OrderDetails />
            </ProtectedRoute>
          } 
        />
        
        {/* Admin Order Management Routes */}
        <Route 
          path="/admin/orders" 
          element={
            <AdminRoute>
              {showOrderDetails && isAdminOrderView ? (
                <AdminOrderDetails 
                  order={selectedOrder}
                  onBack={handleBackToOrders}
                  onOrderUpdated={() => {
                    // Refresh order list after update
                    setShowOrderDetails(false);
                    setIsAdminOrderView(false);
                  }}
                />
              ) : (
                <AdminOrderList 
                  onViewDetails={handleAdminViewOrderDetails}
                />
              )}
            </AdminRoute>
          } 
        />
        
        {/* Admin Dashboard Route */}
        <Route 
          path="/admin" 
          element={
            <AdminRoute>
              <AdminDashboard onLogout={handleLogout} />
            </AdminRoute>
          } 
        />
      </Routes>

      {/* Modals */}
      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onSwitchToRegister={() => {
          setShowLogin(false);
          setShowRegister(true);
        }}
        onLoginSuccess={handleLogin}
      />
      <RegisterModal
        isOpen={showRegister}
        onClose={() => setShowRegister(false)}
        onSwitchToLogin={() => {
          setShowRegister(false);
          setShowLogin(true);
        }}
        onRegisterSuccess={handleLogin}
      />
    </Router>
  );
}

export default App;