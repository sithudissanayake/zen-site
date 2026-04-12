import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './ProductDisplayPage.css';

const ProductDisplayPage = ({ isAuthenticated, user, onLogout, onShowLogin, onShowRegister }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalItems, setTotalItems] = useState(0);
  const [categories, setCategories] = useState([]);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  
  const [checkoutData, setCheckoutData] = useState({
    fullName: '',
    address: '',
    city: '',
    phone: '',
    notes: ''
  });
  
  const navigate = useNavigate();

  // Fetch products from the working endpoint
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let url = 'http://localhost:8080/api/products/all';
      
      console.log('Fetching products from:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('Products response:', data);
      
      if (data && data.success === true) {
        let productsArray = data.data || [];
        console.log('Total products from API:', productsArray.length);
        
        // Filter by category
        if (activeCategory !== 'all') {
          productsArray = productsArray.filter(p => p.category === activeCategory);
          console.log(`Filtered by category ${activeCategory}: ${productsArray.length} products`);
        }
        
        // Filter by search term
        if (searchTerm) {
          productsArray = productsArray.filter(p => 
            p.name.toLowerCase().includes(searchTerm.toLowerCase())
          );
          console.log(`Filtered by search "${searchTerm}": ${productsArray.length} products`);
        }
        
        setProducts(productsArray);
        setTotalItems(productsArray.length);
        console.log(`✅ Displaying ${productsArray.length} products`);
        
        if (productsArray.length === 0) {
          setError('No products found');
        }
      } else {
        setError(data.message || 'Failed to fetch products');
        setProducts([]);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Cannot connect to backend. Please make sure the server is running on port 8080.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, searchTerm]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8080/api/products/all');
      const data = await response.json();
      
      console.log('Categories response:', data);
      
      if (data && data.success === true && data.data) {
        const productsArray = data.data;
        const uniqueCategories = ['all', ...new Set(productsArray.map(p => p.category).filter(Boolean))];
        setCategories(uniqueCategories);
        console.log('Categories found:', uniqueCategories);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCart(parsedCart);
        setCartCount(parsedCart.reduce((sum, item) => sum + item.quantity, 0));
      } catch (e) {
        console.error('Error parsing cart:', e);
      }
    }
    
    setIsLoaded(true);
    
    if (user) {
      setCheckoutData(prev => ({
        ...prev,
        fullName: user.fullName || user.name || '',
        phone: user.phone || user.mobile || ''
      }));
    }
  }, [user]);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
    setCartCount(cart.reduce((sum, item) => sum + item.quantity, 0));
  }, [cart]);

  const getImageUrl = (photo) => {
    if (!photo) return null;
    if (photo.startsWith('data:image')) return photo;
    if (photo.startsWith('http://') || photo.startsWith('https://')) return photo;
    return null;
  };

  const addToCart = (product) => {
    if (product.stock === 0) {
      alert('This product is out of stock!');
      return;
    }
    
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      const currentQuantity = existingItem ? existingItem.quantity : 0;
      
      if (currentQuantity + 1 > product.stock) {
        alert(`Only ${product.stock} items available in stock!`);
        return prevCart;
      }
      
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [{ ...product, quantity: 1 }, ...prevCart];
    });
  };

  // NEW: Buy Now - Adds to cart and directly proceeds to checkout
  const buyNow = (product) => {
    if (product.stock === 0) {
      alert('This product is out of stock!');
      return;
    }
    
    // Clear existing cart and add only this product
    setCart([{ ...product, quantity: 1 }]);
    
    // Check if user is authenticated
    if (!isAuthenticated) {
      onShowLogin();
      alert('Please login to proceed with checkout');
      return;
    }
    
    // Pre-fill checkout data with user info
    if (user) {
      setCheckoutData({
        fullName: user.fullName || user.name || '',
        address: '',
        city: '',
        phone: user.phone || user.mobile || '',
        notes: ''
      });
    }
    
    // Show checkout form
    setShowCart(true);
    setShowCheckoutForm(true);
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    const product = products.find(p => p.id === productId);
    if (product && newQuantity > product.stock) {
      alert(`Only ${product.stock} items available in stock!`);
      return;
    }
    
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const getTotalPrice = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleCheckoutInputChange = (e) => {
    setCheckoutData({
      ...checkoutData,
      [e.target.name]: e.target.value
    });
  };

  const handleProceedToCheckout = () => {
    if (!isAuthenticated) {
      onShowLogin();
      alert('Please login to proceed with checkout');
      return;
    }

    if (cart.length === 0) {
      alert('Your cart is empty');
      return;
    }

    setShowCheckoutForm(true);
  };

  const handleSubmitOrder = async () => {
    if (!checkoutData.fullName) {
      alert('Please enter your full name');
      return;
    }
    if (!checkoutData.address) {
      alert('Please enter your shipping address');
      return;
    }
    if (!checkoutData.city) {
      alert('Please enter your city');
      return;
    }
    if (!checkoutData.phone) {
      alert('Please enter your phone number');
      return;
    }

    setCheckoutLoading(true);

    const totalAmount = getTotalPrice();
    const customerEmail = user?.email || user?.emailAddress || '';
    const customerId = user?.id || user?.userId || null;

    const cartItems = cart.map(item => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      price: item.price
    }));

    const orderData = {
      customerName: checkoutData.fullName,
      customerEmail: customerEmail,
      customerId: customerId,
      customerPhone: checkoutData.phone,
      shippingAddress: checkoutData.address,
      city: checkoutData.city,
      orderNotes: checkoutData.notes || '',
      totalAmount: totalAmount,
      status: 'PENDING',
      cartItems: cartItems
    };

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(orderData)
      });

      if (response.ok) {
        alert('Order placed successfully!');
        setCart([]);
        localStorage.removeItem('cart');
        setShowCart(false);
        setShowCheckoutForm(false);
        navigate('/orders');
      } else {
        const errorData = await response.json();
        alert('Failed to place order: ' + (errorData.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Error placing order: ' + error.message);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleBackToCart = () => {
    setShowCheckoutForm(false);
  };

  const getCategoryIcon = (categoryName) => {
    const icons = {
      'Switches': '🔌',
      'Cables': '🔗',
      'Lighting': '💡',
      'Tools': '🔧',
      'Safety': '🛡️',
      'Smart Home': '🏠',
      'Sockets': '🔌',
      'General': '📦'
    };
    return icons[categoryName] || '📦';
  };

  const scrollToAbout = () => {
    navigate('/');
    setTimeout(() => {
      const aboutSection = document.getElementById('about');
      if (aboutSection) {
        aboutSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading products...</p>
      </div>
    );
  }

  return (
    <div className="product-page">
      {/* Navigation */}
      <nav className={`product-navbar ${isLoaded ? 'loaded' : ''}`}>
        <div className="nav-container">
          <div className="logo" onClick={() => navigate('/')}>
            <span className="logo-text">Zenvora</span>
            <span className="logo-subtitle">Electrical</span>
          </div>
          <div className="nav-links">
            <button onClick={() => navigate('/')} className="nav-link">Home</button>
            <button className="nav-link active">Products</button>
            <button onClick={scrollToAbout} className="nav-link">About</button>
            <button onClick={() => navigate('/contact')} className="nav-link">Contact Us</button>
          </div>
          <div className="nav-buttons">
            <button className="cart-btn" onClick={() => {
              setShowCart(!showCart);
              setShowCheckoutForm(false);
            }}>
              🛒 Cart
              {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
            </button>
            <button className="orders-btn" onClick={() => navigate('/orders')}>
              📋 My Orders
            </button>
            {isAuthenticated ? (
              <>
                <span className="user-greeting">👤 {user?.fullName?.split(' ')[0] || user?.name?.split(' ')[0]}</span>
                {user?.role === 'admin' && (
                  <button className="btn btn-primary" onClick={() => navigate('/admin')}>
                    Dashboard
                  </button>
                )}
                <button className="btn btn-outline" onClick={onLogout}>Logout</button>
              </>
            ) : (
              <>
                <button className="btn btn-outline" onClick={onShowLogin}>Login</button>
                <button className="btn btn-primary" onClick={onShowRegister}>Register</button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="product-hero">
        <div className="hero-background">
          <div className="hero-shape shape-1"></div>
          <div className="hero-shape shape-2"></div>
        </div>
        <div className="hero-content">
          <h1 className="hero-title">Our <span className="highlight">Products</span></h1>
          <p className="hero-description">
            Browse our extensive range of high-quality electrical products
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="product-main">
        {/* Sidebar */}
        <aside className="product-sidebar">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search for a product..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
              }}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>

          <div className="category-list">
            <h3>Categories</h3>
            {categories.map(cat => (
              <button
                key={cat}
                className={`category-item ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => {
                  setActiveCategory(cat);
                }}
              >
                <span className="category-icon">{getCategoryIcon(cat)}</span>
                <span>{cat === 'all' ? 'All Products' : cat}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Product Grid */}
        <main className="product-content">
          <div className="category-header">
            <h2>{activeCategory === 'all' ? 'All Products' : activeCategory}</h2>
            <p>{totalItems} products found</p>
          </div>

          {error ? (
            <div className="error-message">
              <p>{error}</p>
              <button onClick={() => fetchProducts()} className="retry-btn">Retry</button>
            </div>
          ) : products.length === 0 ? (
            <div className="no-products">
              <p>No products found.</p>
            </div>
          ) : (
            <div className="products-grid">
              {products.map((product) => {
                const imageUrl = getImageUrl(product.photo);
                return (
                  <div className="product-card" key={product.id}>
                    <div className="product-image">
                      {imageUrl ? (
                        <img 
                          src={imageUrl} 
                          alt={product.name}
                          className="product-img"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            if (e.target.parentElement?.querySelector('.image-placeholder')) {
                              e.target.parentElement.querySelector('.image-placeholder').style.display = 'flex';
                            }
                          }}
                        />
                      ) : (
                        <div className="image-placeholder">
                          <span style={{ fontSize: '3rem' }}>{getCategoryIcon(product.category)}</span>
                          <span style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>No Image</span>
                        </div>
                      )}
                      {product.stock <= 10 && product.stock > 0 && (
                        <span className="low-stock-badge">Low Stock ({product.stock} left)</span>
                      )}
                      {product.stock === 0 && (
                        <span className="out-of-stock-badge">Out of Stock</span>
                      )}
                    </div>
                    <div className="product-info">
                      <h3 className="product-name">{product.name || 'Unnamed Product'}</h3>
                      <p className="product-description">
                        {product.description?.substring(0, 80) || 'No description available'}
                        {product.description?.length > 80 ? '...' : ''}
                      </p>
                      <p className="product-price">Rs.{product.price?.toFixed(2) || '0.00'}</p>
                      <div className="product-meta">
                        <span className="product-category">{product.category || 'General'}</span>
                        <span className="product-stock">Stock: {product.stock || 0}</span>
                      </div>
                      <div className="product-actions">
                        <button 
                          className="btn-add" 
                          onClick={() => addToCart(product)}
                          disabled={product.stock === 0}
                        >
                          {product.stock === 0 ? 'OUT OF STOCK' : '+ ADD TO CART'}
                        </button>
                        <button 
                          className="btn-buy-now" 
                          onClick={() => buyNow(product)}
                          disabled={product.stock === 0}
                        >
                          BUY NOW
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* Cart Sidebar */}
        {showCart && (
          <div className="cart-sidebar">
            <div className="cart-header">
              <h3>{showCheckoutForm ? 'Checkout Information' : 'Shopping Cart'}</h3>
              <button className="cart-close" onClick={() => {
                setShowCart(false);
                setShowCheckoutForm(false);
              }}>✕</button>
            </div>
            
            {!showCheckoutForm ? (
              <>
                <div className="cart-items">
                  {cart.length === 0 ? (
                    <p className="empty-cart">Your cart is empty</p>
                  ) : (
                    cart.map(item => (
                      <div className="cart-item" key={item.id}>
                        <div className="cart-item-info">
                          <h4>{item.name}</h4>
                          <p>Rs.{item.price?.toFixed(2)}</p>
                          <p className="item-subtotal">Total: Rs.{(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                        <div className="cart-item-actions">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                          <span className="quantity">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                          <button className="remove-btn" onClick={() => removeFromCart(item.id)}>🗑</button>
</div>
                      </div>
                    ))
                  )}
                </div>
                {cart.length > 0 && (
                  <div className="cart-footer">
                    <div className="cart-total">
                      <span>Total Items: {cartCount}</span>
                      <strong>Total: Rs.{getTotalPrice().toFixed(2)}</strong>
                    </div>
                    <button className="btn-checkout" onClick={handleProceedToCheckout}>
                      Proceed to Checkout →
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="checkout-form">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input type="text" name="fullName" value={checkoutData.fullName} onChange={handleCheckoutInputChange} required />
                  </div>
                  <div className="form-group">
                    <label>Phone Number *</label>
                    <input type="tel" name="phone" value={checkoutData.phone} onChange={handleCheckoutInputChange} required />
                  </div>
                  <div className="form-group">
                    <label>Shipping Address *</label>
                    <textarea name="address" value={checkoutData.address} onChange={handleCheckoutInputChange} rows="2" required />
                  </div>
                  <div className="form-group">
                    <label>City *</label>
                    <input type="text" name="city" value={checkoutData.city} onChange={handleCheckoutInputChange} required />
                  </div>
                  <div className="form-group">
                    <label>Order Notes (Optional)</label>
                    <textarea name="notes" value={checkoutData.notes} onChange={handleCheckoutInputChange} rows="2" />
                  </div>
                  <div className="order-summary">
                    <h4>Order Summary</h4>
                    <div className="summary-row">
                      <span>Items ({cartCount}):</span>
                      <span>Rs.{getTotalPrice().toFixed(2)}</span>
                    </div>
                    {/* REMOVED Delivery fee line */}
                    <div className="summary-row total">
                      <span>Total:</span>
                      <strong>Rs.{getTotalPrice().toFixed(2)}</strong>
                    </div>
                  </div>
                </div>
                <div className="cart-footer">
                  <button className="btn-back" onClick={handleBackToCart}>← Back to Cart</button>
                  <button className="btn-place-order" onClick={handleSubmitOrder} disabled={checkoutLoading}>
                    {checkoutLoading ? 'Placing Order...' : 'Place Order →'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDisplayPage;