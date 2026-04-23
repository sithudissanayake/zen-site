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
    // If response has success flag and data property, return the data array directly
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
export const getAllDeliveryOrders = () => api.get('/delivery-orders');
export const createDeliveryOrder = (order) => api.post('/delivery-orders', order);
export const deleteDeliveryOrder = (orderId) => api.delete(`/delivery-orders/${orderId}`);

export default api;