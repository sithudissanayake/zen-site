import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor to unwrap data from backend
api.interceptors.response.use(
  (response) => {
    if (response.data && response.data.success === true && response.data.data) {
      return { ...response, data: response.data.data };
    }
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Driver APIs
export const getAllDrivers = async () => {
  try {
    const response = await api.get('/drivers');
    return response;
  } catch (error) {
    console.error('Error in getAllDrivers:', error);
    throw error;
  }
};

export const createDriver = async (driver) => {
  try {
    const driverData = {
      driverId: driver.driverId,
      name: driver.name,
      phone: driver.phone,
      vehicleNo: driver.vehicleNo,
      vehicleType: driver.vehicleType,
      address: driver.address,
      status: driver.status || 'ACTIVE'
    };
    const response = await api.post('/drivers', driverData);
    return response;
  } catch (error) {
    console.error('Error in createDriver:', error);
    throw error;
  }
};

export const updateDriver = async (driverId, driver) => {
  try {
    const response = await api.put(`/drivers/${driverId}`, driver);
    return response;
  } catch (error) {
    console.error('Error in updateDriver:', error);
    throw error;
  }
};

export const deleteDriver = async (driverId) => {
  try {
    const response = await api.delete(`/drivers/${driverId}`);
    return response;
  } catch (error) {
    console.error('Error in deleteDriver:', error);
    throw error;
  }
};

// Order APIs
export const getAllOrders = async () => {
  try {
    const response = await api.get('/orders');
    return response;
  } catch (error) {
    console.error('Error in getAllOrders:', error);
    throw error;
  }
};

export const createOrder = async (order) => {
  try {
    const response = await api.post('/orders', order);
    return response;
  } catch (error) {
    console.error('Error in createOrder:', error);
    throw error;
  }
};

export const deleteOrder = async (orderId) => {
  try {
    const response = await api.delete(`/orders/${orderId}`);
    return response;
  } catch (error) {
    console.error('Error in deleteOrder:', error);
    throw error;
  }
};

// Delivery Order APIs
export const getAllDeliveryOrders = async () => {
  try {
    const response = await api.get('/delivery-orders');
    return response;
  } catch (error) {
    console.error('Error in getAllDeliveryOrders:', error);
    throw error;
  }
};

export const createDeliveryOrder = async (order) => {
  try {
    const response = await api.post('/delivery-orders', order);
    return response;
  } catch (error) {
    console.error('Error in createDeliveryOrder:', error);
    throw error;
  }
};

export const updateDeliveryOrder = async (orderId, orderData) => {
  try {
    const response = await api.put(`/delivery-orders/${orderId}`, orderData);
    return response;
  } catch (error) {
    console.error('Error in updateDeliveryOrder:', error);
    throw error;
  }
};

export const updateDeliveryOrderStatus = async (orderId, status) => {
  try {
    const response = await api.patch(`/delivery-orders/${orderId}/status`, { status });
    return response;
  } catch (error) {
    console.error('Error in updateDeliveryOrderStatus:', error);
    throw error;
  }
};

export const deleteDeliveryOrder = async (orderId) => {
  try {
    const response = await api.delete(`/delivery-orders/${orderId}`);
    return response;
  } catch (error) {
    console.error('Error in deleteDeliveryOrder:', error);
    throw error;
  }
};

// Auth APIs
export const getCurrentUser = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await api.get('/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response;
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    throw error;
  }
};

export const updateUserProfile = async (updates) => {
  try {
    const token = localStorage.getItem('token');
    const response = await api.put('/auth/me', updates, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response;
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    throw error;
  }
};

export const deleteUser = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await api.delete('/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response;
  } catch (error) {
    console.error('Error in deleteUser:', error);
    throw error;
  }
};

export default api;