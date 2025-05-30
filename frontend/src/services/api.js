const API_BASE_URL = 'http://localhost:3001/api';

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  getAuthToken() {
    return localStorage.getItem('token');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getAuthToken();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    // Remove Content-Type for FormData
    if (options.body instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth endpoints
  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  async getProfile() {
    return this.request('/auth/profile');
  }

  async forgotPassword(email) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token, newPassword) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  }

  // Device endpoints
  async registerDevice(deviceData) {
    return this.request('/devices/register', {
      method: 'POST',
      body: deviceData, // FormData
    });
  }

  async getUserDevices(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/devices?${queryString}`);
  }

  async getDeviceById(deviceId) {
    return this.request(`/devices/${deviceId}`);
  }

  async updateDevice(deviceId, updateData) {
    return this.request(`/devices/${deviceId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  async deleteDevice(deviceId) {
    return this.request(`/devices/${deviceId}`, {
      method: 'DELETE',
    });
  }

  async getDeviceStats() {
    return this.request('/devices/stats');
  }

  async getAvailableDevices(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/devices/available?${queryString}`);
  }

  async updateEnergyProduction(deviceId, energyData) {
    return this.request(`/devices/${deviceId}/energy`, {
      method: 'POST',
      body: JSON.stringify(energyData),
    });
  }

  // Trading endpoints
  async getMarketplaceListings(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/trading/marketplace?${queryString}`);
  }

  async getUserListings(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/trading/listings?${queryString}`);
  }

  async createListing(listingData) {
    return this.request('/trading/listings', {
      method: 'POST',
      body: JSON.stringify(listingData),
    });
  }

  async updateListing(listingId, updateData) {
    return this.request(`/trading/listings/${listingId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  async cancelListing(listingId) {
    return this.request(`/trading/listings/${listingId}`, {
      method: 'DELETE',
    });
  }

  async purchaseEnergy(purchaseData) {
    return this.request('/trading/purchase', {
      method: 'POST',
      body: JSON.stringify(purchaseData),
    });
  }

  async getUserTransactions(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/trading/transactions?${queryString}`);
  }

  async getTradingAnalytics(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/trading/analytics?${queryString}`);
  }

  // Payment endpoints
  async getWalletInfo() {
    return this.request('/payments/wallet');
  }

  async addPaymentMethod(paymentData) {
    return this.request('/payments/methods', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  async depositFunds(depositData) {
    return this.request('/payments/deposit', {
      method: 'POST',
      body: JSON.stringify(depositData),
    });
  }

  async withdrawFunds(withdrawData) {
    return this.request('/payments/withdraw', {
      method: 'POST',
      body: JSON.stringify(withdrawData),
    });
  }

  async getTransactionHistory(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/payments/history?${queryString}`);
  }

  // Profile endpoints
  async updateProfile(profileData) {
    return this.request('/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async uploadAvatar(avatarFile) {
    const formData = new FormData();
    formData.append('avatar', avatarFile);
    
    return this.request('/profile/avatar', {
      method: 'POST',
      body: formData,
    });
  }

  async getDashboardData() {
    return this.request('/profile/dashboard');
  }

  async updateNotificationPreferences(notifications) {
    return this.request('/profile/notifications', {
      method: 'PUT',
      body: JSON.stringify({ notifications }),
    });
  }

  async updatePrivacySettings(privacy) {
    return this.request('/profile/privacy', {
      method: 'PUT',
      body: JSON.stringify({ privacy }),
    });
  }

  // User endpoints
  async searchUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/users/search?${queryString}`);
  }

  async getUserPublicProfile(userId) {
    return this.request(`/users/${userId}/public`);
  }

  async getPlatformStats() {
    return this.request('/users/stats');
  }
}

export default new ApiClient();
