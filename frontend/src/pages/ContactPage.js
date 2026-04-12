import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ContactPage.css';

const ContactPage = ({ isAuthenticated, user, onLogout, onShowLogin, onShowRegister }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    setIsLoaded(true);
    
    // Pre-fill form if user is logged in
    if (isAuthenticated && user) {
      setFormData(prev => ({
        ...prev,
        name: user.fullName || '',
        email: user.email || ''
      }));
    }
  }, [isAuthenticated, user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('http://localhost:8080/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Thank you for contacting us! We will get back to you soon.');
        setFormData(prev => ({
          name: isAuthenticated ? user?.fullName || '' : '',
          email: isAuthenticated ? user?.email || '' : '',
          phone: '',
          message: ''
        }));
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      console.error('Contact error:', err);
      setError('Connection error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginClick = () => {
    onShowLogin();
  };

  const handleRegisterClick = () => {
    onShowRegister();
  };

  const handleLogout = () => {
    onLogout();
  };

  const contactInfo = [
    {
      icon: '📞',
      title: 'Phone',
      details: '+1 (555) 123-4567',
      subtext: 'Mon-Fri 9AM-6PM'
    },
    {
      icon: '✉️',
      title: 'Email',
      details: 'info@zenvora.com',
      subtext: 'We reply within 24hrs'
    },
    {
      icon: '📍',
      title: 'Location',
      details: '123 Electric Ave, Tech City',
      subtext: 'Visit our showroom'
    }
  ];

  return (
    <div className="contact-page">
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
            <button className="nav-link active" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              Contact
            </button>
          </div>
          <div className="nav-buttons">
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
      <section className={`contact-hero ${isLoaded ? 'loaded' : ''}`}>
        <div className="hero-background">
          <div className="hero-shape shape-1"></div>
          <div className="hero-shape shape-2"></div>
          <div className="grid-pattern"></div>
        </div>
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-icon">💬</span>
            <span>Get In Touch</span>
          </div>
          <h1 className="hero-title">
            We'd Love To
            <span className="highlight"> Hear From You</span>
          </h1>
          <p className="hero-description">
            Have questions about our products or services? Our team is here to help.
            Reach out to us and we'll respond as soon as possible.
          </p>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="contact-info-section">
        <div className="section-container">
          <div className="contact-info-grid">
            {contactInfo.map((info, index) => (
              <div
                className="contact-info-card"
                key={index}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="info-icon">{info.icon}</div>
                <h3 className="info-title">{info.title}</h3>
                <p className="info-details">{info.details}</p>
                <p className="info-subtext">{info.subtext}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="contact-form-section">
        <div className="section-container">
          <div className="form-wrapper">
            <div className="form-header">
              <h2 className="section-title">Send Us A Message</h2>
              <p className="section-description">
                Fill out the form below and we'll get back to you shortly
              </p>
            </div>
            
            {error && (
              <div className="error-message" style={{
                padding: '12px',
                marginBottom: '16px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                color: '#ef4444',
                fontSize: '14px',
                textAlign: 'center'
              }}>
                {error}
              </div>
            )}
            
            {success && (
              <div className="success-message" style={{
                padding: '12px',
                marginBottom: '16px',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '8px',
                color: '#22c55e',
                fontSize: '14px',
                textAlign: 'center'
              }}>
                {success}
              </div>
            )}
            
            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Your Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div className="form-group">
                <label htmlFor="message">Your Message *</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tell us how we can help you..."
                  rows="5"
                  required
                ></textarea>
              </div>
              <button type="submit" className="btn btn-primary btn-large btn-submit" disabled={loading}>
                <span>{loading ? 'Sending...' : 'Send Message'}</span>
                <span className="btn-icon">→</span>
              </button>
            </form>
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

export default ContactPage;