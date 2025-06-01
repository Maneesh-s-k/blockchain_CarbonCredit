import React, { useState } from 'react';
import apiClient from '../../services/apiService';

export default function ApiTest() {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testHealthCheck = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/health');
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testRegister = async () => {
    setLoading(true);
    try {
      const response = await apiClient.register({
        username: 'testuser123',
        email: 'test@example.com',
        password: 'Test123456',
        firstName: 'Test',
        lastName: 'User'
      });
      setResult(JSON.stringify(response, null, 2));
    } catch (error) {
      setResult(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>API Connection Test</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={testHealthCheck} disabled={loading}>
          Test Health Check
        </button>
        <button onClick={testRegister} disabled={loading} style={{ marginLeft: '10px' }}>
          Test Registration
        </button>
      </div>

      {loading && <p>Loading...</p>}
      
      <pre style={{ 
        background: '#f5f5f5', 
        padding: '10px', 
        borderRadius: '5px',
        maxHeight: '400px',
        overflow: 'auto'
      }}>
        {result}
      </pre>
    </div>
  );
}
