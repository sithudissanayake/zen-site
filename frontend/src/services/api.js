import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
});

export const getAllDrivers = () => api.get('/drivers');
export const createDriver = (driver) => api.post('/drivers', driver);
export const updateDriver = (driverId, driver) => api.put(`/drivers/${driverId}`, driver);
export const deleteDriver = (driverId) => api.delete(`/drivers/${driverId}`);

export const getAllDeliveryOrders = () => api.get('/delivery-orders');
export const createDeliveryOrder = (order) => api.post('/delivery-orders', order);
export const deleteDeliveryOrder = (orderId) => api.delete(`/delivery-orders/${orderId}`);

export const getAllOrders = () => api.get('/orders');
export const createOrder = (order) => api.post('/orders', order);
export const deleteOrder = (orderId) => api.delete(`/orders/${orderId}`);

export default api;