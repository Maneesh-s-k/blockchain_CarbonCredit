const API_BASE_URL = process.env.REACT_APP_API_URL+'/api';

class ApiService {
  constructor() {
    // Try multiple token storage keys
    this.token = localStorage.getItem('token') ||
                 localStorage.getItem('authToken') ||
                 localStorage.getItem('accessToken');
  }

  getHeaders() {
    // Refresh token from localStorage on each request
    this.token = localStorage.getItem('token') ||
                 localStorage.getItem('authToken') ||
                 localStorage.getItem('accessToken');
    
    return {
      'Content-Type': 'application/json',
      ...(this.token && { 'Authorization': `Bearer ${this.token}` })
    };
  }

  async handleResponse(response) {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      
      // Handle specific error cases
      if (response.status === 401) {
        console.warn('🚫 Authentication failed - clearing token');
        this.clearAuthToken();
        throw new Error('Username And Password Do NotMatch');
      }

      if (response.status === 401 && response.data.message === 'User account not found') {
      localStorage.removeItem('token');
  
           window.location.href = '/login'; 
       }
      
      if (response.status === 403) {
        throw new Error('Access forbidden. You don\'t have permission.');
      }
      
      if (response.status >= 500) {
        throw new Error('Server error. Please try again later.');
      }
      
      throw new Error(error.message || `API request failed (${response.status})`);
    }
    return response.json();
  }

  // Authentication API calls - matching your backend auth routes
  async login(credentials) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });
    const data = await this.handleResponse(response);
    // Store token after successful login
    if (data.success && (data.token || data.tokens?.accessToken)) {
      this.setAuthToken(data.token || data.tokens.accessToken);
    }
    return data;
  }

  
  async register(userData) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    return this.handleResponse(response);
  }

   async verifyOTP(data) {
    console.log('🔍 ApiService: Verifying OTP with data:', data);
    const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    const result = await this.handleResponse(response);
    
    // Store token after successful OTP verification
    if (result.success && (result.token || result.tokens?.accessToken)) {
      this.setAuthToken(result.token || result.tokens.accessToken);
      console.log('✅ ApiService: Token stored after OTP verification');
    }
    
    return result;
  }

   async sendOTP(data) {
    console.log('📧 ApiService: Sending OTP to:', data.email);
    const response = await fetch(`${API_BASE_URL}/auth/resend-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    const result = await this.handleResponse(response);
    console.log('✅ ApiService: OTP sent successfully');
    return result;
  }

  async getProfile() {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }

  async getProfile() {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }

  async updateProfile(profileData) {
    const response = await fetch(`${API_BASE_URL}/profile`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(profileData)
    });
    return this.handleResponse(response);
  }

  // ADDED: Missing profile methods matching your profile.js routes
  async uploadAvatar(formData) {
    // Remove Content-Type header for FormData - let browser set it
    const headers = { ...this.getHeaders() };
    delete headers['Content-Type'];
    
    const response = await fetch(`${API_BASE_URL}/profile/avatar`, {
      method: 'POST',
      headers: headers,
      body: formData
    });
    return this.handleResponse(response);
  }

  async getDashboardData() {
    const response = await fetch(`${API_BASE_URL}/profile/dashboard`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }

  async updateNotificationPreferences(preferences) {
    const response = await fetch(`${API_BASE_URL}/profile/notifications`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(preferences)
    });
    return this.handleResponse(response);
  }

  async updatePrivacySettings(settings) {
    const response = await fetch(`${API_BASE_URL}/profile/privacy`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(settings)
    });
    return this.handleResponse(response);
  }

  async changePassword(passwordData) {
    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(passwordData)
    });
    return this.handleResponse(response);
  }

  async logout() {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: this.getHeaders()
    });
    // Clear token regardless of response
    this.clearAuthToken();
    return this.handleResponse(response);
  }

  async refreshToken() {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }

  async googleAuth(credential) {
  console.log('🟢 [apiService] Sending credential to backend:', credential?.substring?.(0, 10) + '...');
  const response = await fetch(`${API_BASE_URL}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential })
  });
  const data = await this.handleResponse(response);
  console.log('🟢 [apiService] Response from backend:', data);
  return data;
}


  async forgotPassword(email) {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });
    return this.handleResponse(response);
  }

  async verifyPasswordResetOTP(data) {
  const response = await fetch(`${API_BASE_URL}/auth/verify-password-reset-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  return this.handleResponse(response);
 }


  async resetPassword(data) {
  console.log('🔍 ApiService: Sending reset password request:', data);
  
  const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  
  console.log('🔍 ApiService: Response status:', response.status);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('❌ ApiService: Error response:', errorData);
    throw new Error(errorData.message || 'Failed to reset password');
  }
  
  return this.handleResponse(response);
}


  async resendPasswordResetOTP(data) {
  const response = await fetch(`${API_BASE_URL}/auth/resend-password-reset-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  return this.handleResponse(response);
}

 async verifyEmail(token) {
  const response = await fetch(
    `${API_BASE_URL}/auth/verify-email/${token}`, // Add token to URL
    { method: 'GET' } // Change to GET
  );
  return this.handleResponse(response);
}


  // Trading API calls - matching your backend trading routes
  async getMarketplaceListings(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const response = await fetch(`${API_BASE_URL}/trading/marketplace?${queryParams}`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }

  async getUserListings(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const response = await fetch(`${API_BASE_URL}/trading/listings?${queryParams}`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }

  async createEnergyListing(listingData) {
    const response = await fetch(`${API_BASE_URL}/trading/listings`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(listingData)
    });
    return this.handleResponse(response);
  }

  async purchaseEnergy(purchaseData) {
    const response = await fetch(`${API_BASE_URL}/trading/purchase`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(purchaseData)
    });
    return this.handleResponse(response);
  }

  async cancelListing(listingId) {
    const response = await fetch(`${API_BASE_URL}/trading/listings/${listingId}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }

  async getUserTransactions(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const response = await fetch(`${API_BASE_URL}/trading/transactions?${queryParams}`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }

  async getTradingAnalytics(period = '30d') {
    const response = await fetch(`${API_BASE_URL}/trading/analytics?period=${period}`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }

  // Device Management API calls - matching your backend device routes
  async getUserDevices(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const response = await fetch(`${API_BASE_URL}/devices?${queryParams}`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }

  async registerDevice(formData, isFormData = true) {
  let headers = this.getHeaders();

  if (isFormData) {
    // Remove Content-Type so browser sets it for FormData
    delete headers['Content-Type'];
  }

  const response = await fetch(`${API_BASE_URL}/devices/register`, {
    method: 'POST',
    headers,
    body: formData
  });

  return this.handleResponse(response);
}



  async updateDevice(deviceId, updateData) {
    const response = await fetch(`${API_BASE_URL}/devices/${deviceId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(updateData)
    });
    return this.handleResponse(response);
  }

  async getDeviceStats(deviceId) {
    const response = await fetch(`${API_BASE_URL}/devices/${deviceId}/stats`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }

  // Energy API calls - matching your backend energy routes
  async submitEnergyProduction(deviceId, productionData) {
    const response = await fetch(`${API_BASE_URL}/energy/production/${deviceId}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(productionData)
    });
    return this.handleResponse(response);
  }

  async getEnergyProduction(deviceId, period = '30d') {
    const response = await fetch(`${API_BASE_URL}/energy/production/${deviceId}?period=${period}`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }

  async getEnergyAnalytics(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const response = await fetch(`${API_BASE_URL}/energy/analytics?${queryParams}`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }

  // Payment API calls - matching your backend payment routes
  async getWalletInfo() {
    const response = await fetch(`${API_BASE_URL}/payments/wallet`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }

  async depositFunds(depositData) {
    const response = await fetch(`${API_BASE_URL}/payments/deposit`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(depositData)
    });
    return this.handleResponse(response);
  }

  async withdrawFunds(withdrawData) {
    const response = await fetch(`${API_BASE_URL}/payments/withdraw`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(withdrawData)
    });
    return this.handleResponse(response);
  }

  async getTransactionHistory(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const response = await fetch(`${API_BASE_URL}/payments/history?${queryParams}`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }

  // ADDED: Payment methods matching your backend
  async getPaymentMethods() {
    const response = await fetch(`${API_BASE_URL}/payments/methods`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }

  async addPaymentMethod(paymentMethodData) {
    const response = await fetch(`${API_BASE_URL}/payments/methods`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(paymentMethodData)
    });
    return this.handleResponse(response);
  }

  // User API calls - matching your backend user routes
  async getUsers(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const response = await fetch(`${API_BASE_URL}/users?${queryParams}`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }

  async getUserById(userId) {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }

  async getUserPublicProfile(userId) {
    // FIXED: Remove authentication for public profile
    const response = await fetch(`${API_BASE_URL}/users/${userId}/public`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return this.handleResponse(response);
  }

  async searchUsers(query, page = 1, limit = 20) {
    const queryParams = new URLSearchParams({ q: query, page, limit }).toString();
    const response = await fetch(`${API_BASE_URL}/users/search?${queryParams}`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }

  async getPlatformStats() {
    const response = await fetch(`${API_BASE_URL}/users/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return this.handleResponse(response);
  }

  // Analytics API calls - NEW ANALYTICS INTEGRATION
  async getDashboardAnalytics(timeframe = '30d') {
    const response = await fetch(`${API_BASE_URL}/analytics/dashboard?timeframe=${timeframe}`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }

  async getTradingAnalyticsDetailed(timeframe = '30d') {
    const response = await fetch(`${API_BASE_URL}/analytics/trading?timeframe=${timeframe}`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }

  async getDeviceAnalytics(deviceId = null, timeframe = '30d') {
    const endpoint = deviceId 
      ? `/analytics/devices/${deviceId}?timeframe=${timeframe}`
      : `/analytics/devices?timeframe=${timeframe}`;
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }

  async getCarbonCreditAnalytics(timeframe = '30d') {
    const response = await fetch(`${API_BASE_URL}/analytics/carbon-credits?timeframe=${timeframe}`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }

  async getMarketData() {
    const response = await fetch(`${API_BASE_URL}/analytics/market`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }

  // Real-time WebSocket connection helper
  connectWebSocket(userId) {
    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`;
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('✅ WebSocket connected');
      // Authenticate
      ws.send(JSON.stringify({
        type: 'auth',
        userId: userId
      }));
      // Subscribe to channels
      ws.send(JSON.stringify({
        type: 'subscribe',
        channels: ['market_stream', 'energy_stream', 'trading_stream']
      }));
    };
    
    return ws;
  }

  // Token management methods
  setAuthToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('authToken');
      localStorage.removeItem('accessToken');
    }
  }

  getAuthToken() {
    return this.token;
  }

  clearAuthToken() {
    this.token = null;
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('accessToken');
  }

  // Check if user is authenticated
  isAuthenticated() {
    this.token = localStorage.getItem('token') ||
                 localStorage.getItem('authToken') ||
                 localStorage.getItem('accessToken');
    return !!this.token;
  }

  // Debug authentication
  debugAuth() {
    console.log('🔍 Auth Debug:');
    console.log('Token exists:', !!this.token);
    console.log('Token value:', this.token ? this.token.substring(0, 20) + '...' : 'null');
    console.log('isAuthenticated:', this.isAuthenticated());
    console.log('localStorage keys:', Object.keys(localStorage));
  }

  // API health check
  async healthCheck() {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`, {
      method: 'GET'
    });
    return this.handleResponse(response);
  }

  // API status check
  async getApiStatus() {
    const response = await fetch(`${API_BASE_URL}`, {
      method: 'GET'
    });
    return this.handleResponse(response);
  }
}

// Create and export singleton instance
const apiService = new ApiService();
export { apiService };
export default apiService;
