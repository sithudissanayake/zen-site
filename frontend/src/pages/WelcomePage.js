import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './WelcomePage.css';

const WelcomePage = ({ isAuthenticated, user, onLogout, onShowLogin, onShowRegister }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsLoaded(true);
    
    // If admin is already logged in, redirect to admin dashboard
    if (isAuthenticated && user?.role === 'admin') {
      navigate('/admin');
    }
  }, [isAuthenticated, user, navigate]);

  const handleLoginClick = () => {
    onShowLogin();
  };

  const handleRegisterClick = () => {
    onShowRegister();
  };

  const handleLogout = () => {
    onLogout();
  };

  const handleExploreProducts = () => {
    navigate('/products');
  };
  
  const handleProfileClick = () => {
    navigate('/profile');
  };

  const features = [
    {
      icon: '⚡',
      title: 'Quality Products',
      description: 'Premium electrical items from trusted brands'
    },
    {
      icon: '🚚',
      title: 'Fast Delivery',
      description: 'Quick and reliable shipping to your doorstep'
    },
    {
      icon: '💰',
      title: 'Best Prices',
      description: 'Competitive prices with exclusive deals'
    },
    {
      icon: '🛡️',
      title: 'Warranty',
      description: 'Extended warranty on all products'
    }
  ];

  const categories = [
    { name: 'Lighting', icon: '💡', count: '500+' },
    { name: 'Switches', icon: '🔌', count: '300+' },
    { name: 'Cables', icon: '🔗', count: '200+' },
    { name: 'Tools', icon: '🔧', count: '150+' },
    { name: 'Safety', icon: '🛡️', count: '100+' },
    { name: 'Smart Home', icon: '🏠', count: '80+' }
  ];

  return (
    <div className="welcome-page">
      {/* Navigation */}
      <nav className={`navbar ${isLoaded ? 'loaded' : ''}`}>
        <div className="nav-container">
          <div className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <span className="logo-text">Zenvora</span>
            <span className="logo-subtitle">Electrical</span>
          </div>
          <div className="nav-links">
            <button onClick={() => navigate('/')} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              Home
            </button>
            <button onClick={() => navigate('/products')} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              Products
            </button>
            <a href="#about" className="nav-link">About</a>
            <button onClick={() => navigate('/contact')} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              Contact
            </button>
          </div>
          <div className="nav-buttons">
            <button
              type="button"
              className="profile-icon-button"
              onClick={handleProfileClick}
              aria-label="User profile"
              title="User Profile"
            >
              <span className="profile-icon">
                {user?.fullName ? user.fullName.charAt(0).toUpperCase() : '👤'}
              </span>
            </button>
            {isAuthenticated ? (
              <>
                <span className="user-greeting">Welcome, {user?.fullName?.split(' ')[0]}</span>
                {user?.role === 'admin' && (
                  <button className="btn btn-primary" onClick={() => navigate('/admin')} style={{ marginRight: '0.5rem' }}>
                    Dashboard
                  </button>
                )}
                <button className="btn btn-outline" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <button className="btn btn-outline" onClick={handleLoginClick}>
                  Login
                </button>
                <button className="btn btn-primary" onClick={handleRegisterClick}>
                  Register
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={`hero ${isLoaded ? 'loaded' : ''}`} id="home">
        <div className="hero-background">
          <div className="hero-shape shape-1"></div>
          <div className="hero-shape shape-2"></div>
          <div className="hero-shape shape-3"></div>
          <div className="grid-pattern"></div>
        </div>
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-icon">⚡</span>
            <span>Premium Electrical Solutions</span>
          </div>
          <h1 className="hero-title">
            Powering Your World With
            <span className="highlight"> Quality Electrical</span> Products
          </h1>
          <p className="hero-description">
            Discover our extensive range of premium electrical items. From lighting
            solutions to smart home devices, we provide everything you need to
            power your home and business.
          </p>
          <div className="hero-buttons">
            <button className="btn btn-primary btn-large" onClick={handleExploreProducts}>
              <span>Explore Products</span>
              <span className="btn-icon">→</span>
            </button>
            {!isAuthenticated && (
              <button className="btn btn-outline btn-large" onClick={handleRegisterClick}>
                <span>Get Started</span>
              </button>
            )}
          </div>
          <div className="hero-stats">
            <div className="stat">
              <span className="stat-number">10K+</span>
              <span className="stat-label">Products</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat">
              <span className="stat-number">50K+</span>
              <span className="stat-label">Customers</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat">
              <span className="stat-number">99%</span>
              <span className="stat-label">Satisfaction</span>
            </div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-image-container">
            <div className="floating-card card-1">
              <span className="card-icon">💡</span>
              <span>LED Lighting</span>
            </div>
            <div className="floating-card card-2">
              <span className="card-icon">🔌</span>
              <span>Smart Plugs</span>
            </div>
            <div className="floating-card card-3">
              <span className="card-icon">⚡</span>
              <span>Power Solutions</span>
            </div>
            <div className="central-circle">
              <div className="circle-inner">
                <span className="circle-icon">⚡</span>
              </div>
              <div className="circle-ring ring-1"></div>
              <div className="circle-ring ring-2"></div>
              <div className="circle-ring ring-3"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section" id="products">
        <div className="section-container">
          <div className="section-header">
            <span className="section-badge">Why Choose Us</span>
            <h2 className="section-title">Experience Excellence in Every Purchase</h2>
            <p className="section-description">
              We're committed to providing the best electrical products with unmatched service
            </p>
          </div>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div className="feature-card" key={index} style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories-section">
        <div className="section-container">
          <div className="section-header">
            <span className="section-badge">Our Categories</span>
            <h2 className="section-title">Browse Our Product Range</h2>
            <p className="section-description">
              Explore our wide selection of electrical products for every need
            </p>
          </div>
          <div className="categories-grid">
            {categories.map((category, index) => (
              <div className="category-card" key={index} onClick={() => navigate('/products')}>
                <div className="category-icon">{category.icon}</div>
                <h3 className="category-name">{category.name}</h3>
                <span className="category-count">{category.count} Items</span>
                <div className="category-hover">
                  <span>Explore →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <div className="cta-content">
            <h2 className="cta-title">Ready to Get Started?</h2>
            <p className="cta-description">
              Join thousands of satisfied customers. Register now and get exclusive
              access to deals and offers.
            </p>
            <div className="cta-buttons">
              {!isAuthenticated ? (
                <>
                  <button className="btn btn-white btn-large" onClick={handleRegisterClick}>
                    Create Account
                  </button>
                  <button className="btn btn-outline-white btn-large" onClick={handleLoginClick}>
                    Sign In
                  </button>
                </>
              ) : (
                <button className="btn btn-white btn-large" onClick={() => navigate('/contact')}>
                  Contact Us
                </button>
              )}
            </div>
          </div>
          <div className="cta-decoration">
            <div className="cta-circle"></div>
            <div className="cta-circle cta-circle-2"></div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-main">
            <div className="footer-brand">
              <div className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
                <img src="/zen.jpg" alt="Zenvora Logo" className="logo-image" />
                <span className="logo-text">Zenvora</span>
              </div>
              <p className="footer-tagline">
                Your trusted partner for quality electrical products
              </p>
            </div>
            <div className="footer-links">
              <div className="footer-column">
                <h4>Products</h4>
                <button onClick={() => navigate('/products')} className="footer-link-btn">Lighting</button>
                <button onClick={() => navigate('/products')} className="footer-link-btn">Switches</button>
                <button onClick={() => navigate('/products')} className="footer-link-btn">Cables</button>
                <button onClick={() => navigate('/products')} className="footer-link-btn">Tools</button>
              </div>
              <div className="footer-column">
                <h4>Company</h4>
                <a href="#about">About Us</a>
                <a href="#careers">Careers</a>
                <button onClick={() => navigate('/contact')} className="footer-link-btn">Contact</button>
                <a href="#blog">Blog</a>
              </div>
              <div className="footer-column">
                <h4>Support</h4>
                <a href="#help">Help Center</a>
                <a href="#faq">FAQ</a>
                <a href="#shipping">Shipping</a>
                <a href="#returns">Returns</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 Zenvora Electrical. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default WelcomePage;
