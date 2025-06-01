import { useState, useEffect, useCallback } from 'react';
import { analyticsService } from '../services/analyticsService';

export const useAnalytics = (type = 'trading', timeframe = '30d', deviceId = null) => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let response;
      
      switch (type) {
        case 'trading':
          response = await analyticsService.getTradingAnalytics(timeframe);
          break;
        case 'device':
          response = await analyticsService.getDeviceAnalytics(deviceId, timeframe);
          break;
        case 'carbon':
          response = await analyticsService.getCarbonCreditAnalytics(timeframe);
          break;
        case 'market':
          response = await analyticsService.getMarketData();
          break;
        default:
          throw new Error(`Unknown analytics type: ${type}`);
      }

      if (response.success) {
        setAnalyticsData(response.data);
      } else {
        throw new Error(response.error || 'Failed to load analytics data');
      }
    } catch (err) {
      console.error('Analytics loading error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [type, timeframe, deviceId]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const refreshAnalytics = useCallback(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  return {
    analyticsData,
    loading,
    error,
    refreshAnalytics
  };
};
