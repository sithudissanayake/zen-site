import React, { useState } from 'react';
import ProductsManagement from './components/ProductsManagement';
import SupplierManagement from './components/SupplierManagement';
import ManageDrivers from './components/ManageDrivers';
import DeliveryHome from './components/DeliveryHome';
import ToDeliver from './components/ToDeliver';
import MonthlyReport from './components/MonthlyReport';
import AdminOrderList from './pages/AdminOrderList'; // ✅ changed
import OrderDetails from './pages/OrderDetails';
import './App.css';

function DeliveryModule() {
  const [activeView, setActiveView] = useState('DeliveryHome');

  const isDeliverySection = activeView !== 'ManageDrivers';

  return (
    <div className="delivery-module">
      <div className="delivery-subnav">
        <button
          type="button"
          className={`submodule-item ${isDeliverySection ? 'active' : ''}`}
          onClick={() => setActiveView('DeliveryHome')}
        >
          Delivery
        </button>
        <button
          type="button"
          className={`submodule-item ${!isDeliverySection ? 'active' : ''}`}
          onClick={() => setActiveView('ManageDrivers')}
        >
          Drivers
        </button>
      </div>

      <div className="delivery-module-content">
        {activeView === 'DeliveryHome' && <DeliveryHome onNavigate={setActiveView} />}
        {activeView === 'ManageDrivers' && <ManageDrivers />}
        {activeView === 'ToDeliver' && <ToDeliver />}
        {activeView === 'MonthlyReport' && <MonthlyReport />}
      </div>
    </div>
  );
}

function OrdersManagement() {
  const [activeView, setActiveView] = useState('list');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isNewOrder, setIsNewOrder] = useState(false);

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setIsNewOrder(false);
    setActiveView('details');
  };

  const handleAddNewOrder = () => {
    setSelectedOrder(null);
    setIsNewOrder(true);
    setActiveView('details');
  };

  const handleBackToList = () => {
    setActiveView('list');
  };

  return (
    <div className="orders-module">
      {activeView === 'details' ? (
        <OrderDetails
          order={selectedOrder}
          isNew={isNewOrder}
          onBack={handleBackToList}
        />
      ) : (
        <AdminOrderList // ✅ changed from OrderList to AdminOrderList
          onViewDetails={handleViewDetails}
          onAddNewOrder={handleAddNewOrder}
        />
      )}
    </div>
  );
}

function UsersManagement() {
  return (
    <div className="placeholder-page">
      <h1>Users</h1>
      <p>This module will display user management tools.</p>
    </div>
  );
}

function AdminDashboard({ onLogout }) {
  const [activeModule, setActiveModule] = useState('Products');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (onLogout) {
      onLogout();
    }
    window.location.href = '/';
  };

  const renderModule = () => {
    switch (activeModule) {
      case 'Suppliers':
        return <SupplierManagement />;
      case 'Delivery':
        return <DeliveryModule />;
      case 'Orders':
        return <OrdersManagement />;
      case 'Users':
        return <UsersManagement />;
      case 'Products':
      default:
        return <ProductsManagement />;
    }
  };

  return (
    <div className="App">
      <header className="header">
        <div className="header-container">
          <div className="logo-section">
            <button type="button" className="logo-placeholder" onClick={() => setActiveModule('Products')}>
              <img src="zen.jpg" alt="Zenvora Logistics logo" className="logo-image" />
            </button>
          </div>

          <div className="nav-modules">
            <button
              type="button"
              className={`module-item ${activeModule === 'Products' ? 'active' : ''}`}
              onClick={() => setActiveModule('Products')}
            >
              <span className="module-icon">🛒</span>
              <span className="module-name">Products</span>
            </button>
            <button
              type="button"
              className={`module-item ${activeModule === 'Suppliers' ? 'active' : ''}`}
              onClick={() => setActiveModule('Suppliers')}
            >
              <span className="module-icon">🏷️</span>
              <span className="module-name">Suppliers</span>
            </button>
            <button
              type="button"
              className={`module-item ${activeModule === 'Delivery' ? 'active' : ''}`}
              onClick={() => setActiveModule('Delivery')}
            >
              <span className="module-icon">📦</span>
              <span className="module-name">Delivery</span>
            </button>
            <button
              type="button"
              className={`module-item ${activeModule === 'Orders' ? 'active' : ''}`}
              onClick={() => setActiveModule('Orders')}
            >
              <span className="module-icon">🧾</span>
              <span className="module-name">Orders</span>
            </button>
            <button
              type="button"
              className={`module-item ${activeModule === 'Users' ? 'active' : ''}`}
              onClick={() => setActiveModule('Users')}
            >
              <span className="module-icon">👥</span>
              <span className="module-name">Users</span>
            </button>
          </div>

          <div className="admin-logout">
            <button className="logout-btn-admin" onClick={handleLogout}>
              <span>🚪</span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="app-content">
        {renderModule()}
      </main>
    </div>
  );
}

export default AdminDashboard;