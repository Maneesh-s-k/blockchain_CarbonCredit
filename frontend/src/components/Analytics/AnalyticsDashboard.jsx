// components/Analytics/AnalyticsDashboard.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { format, subDays, parseISO } from 'date-fns';
import { analyticsService } from '../../services/analyticsService';
import { 
  FiTrendingUp, FiTrendingDown, FiActivity, FiZap, 
  FiDollarSign, FiGrid, FiDownload, FiRefreshCw,
  FiBarChart2, FiPieChart, FiCalendar, FiFilter
} from 'react-icons/fi';

const AnalyticsDashboard = () => {
  const [analyticsData, setAnalyticsData] = useState({
    overview: {},
    energyProduction: [],
    tradingVolume: [],
    priceAnalysis: [],
    carbonCredits: [],
    marketComparison: {}
  });
  
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('energy');
  const [realTimeData, setRealTimeData] = useState({});
  const [filters, setFilters] = useState({
    energyType: 'all',
    region: 'all',
    deviceType: 'all'
  });

  useEffect(() => {
    loadAnalyticsData();
    setupRealTimeUpdates();
  }, [timeframe, filters]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      const [
        dashboardData,
        tradingData,
        marketData
      ] = await Promise.all([
        analyticsService.getDashboardAnalytics(timeframe),
        analyticsService.getTradingAnalytics(timeframe),
        analyticsService.getMarketData()
      ]);

      if (dashboardData.success && tradingData.success) {
        setAnalyticsData({
          overview: {
            totalEnergyProduced: dashboardData.data.metrics.totalEnergyProduced,
            totalRevenue: dashboardData.data.metrics.totalRevenue,
            activeTrades: dashboardData.data.metrics.activeTrades,
            carbonCredits: dashboardData.data.metrics.carbonCredits,
            efficiency: calculateEfficiency(dashboardData.data),
            growthRate: dashboardData.data.metrics.monthlyGrowth
          },
          energyProduction: generateEnergyProductionData(timeframe),
          tradingVolume: generateTradingVolumeData(timeframe),
          priceAnalysis: generatePriceAnalysisData(timeframe),
          carbonCredits: generateCarbonCreditData(timeframe),
          marketComparison: tradingData.data.marketComparison || {}
        });
      }
    } catch (error) {
      console.error('Analytics loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealTimeUpdates = () => {
    const unsubscribe = analyticsService.subscribe('analytics_update', (data) => {
      setRealTimeData(prev => ({ ...prev, ...data }));
      updateChartData(data);
    });

    return () => unsubscribe();
  };

  const updateChartData = (newData) => {
    setAnalyticsData(prev => ({
      ...prev,
      overview: { ...prev.overview, ...newData.metrics },
      energyProduction: updateTimeSeriesData(prev.energyProduction, newData.energyProduction),
      tradingVolume: updateTimeSeriesData(prev.tradingVolume, newData.tradingVolume)
    }));
  };

  const updateTimeSeriesData = (existingData, newDataPoint) => {
    if (!newDataPoint) return existingData;
    
    const updated = [...existingData];
    const lastIndex = updated.length - 1;
    
    if (lastIndex >= 0) {
      updated[lastIndex] = { ...updated[lastIndex], ...newDataPoint };
    }
    
    return updated;
  };

  // Chart data generators with realistic patterns
  const generateEnergyProductionData = (timeframe) => {
    const days = timeframe === '24h' ? 24 : timeframe === '7d' ? 7 : 30;
    const data = [];
    
    for (let i = 0; i < days; i++) {
      const date = subDays(new Date(), days - i - 1);
      const baseProduction = 100 + Math.sin(i * 0.5) * 20;
      const solarVariation = Math.sin((i * 2 * Math.PI) / 7) * 15; // Weekly pattern
      const randomVariation = (Math.random() - 0.5) * 10;
      
      data.push({
        date: format(date, timeframe === '24h' ? 'HH:mm' : 'MMM dd'),
        timestamp: date.toISOString(),
        solar: Math.max(0, baseProduction + solarVariation + randomVariation),
        wind: Math.max(0, 80 + Math.cos(i * 0.3) * 25 + randomVariation),
        hydro: Math.max(0, 60 + Math.sin(i * 0.2) * 10 + randomVariation * 0.5),
        total: 0
      });
    }
    
    // Calculate totals
    return data.map(item => ({
      ...item,
      total: item.solar + item.wind + item.hydro
    }));
  };

  const generateTradingVolumeData = (timeframe) => {
    const days = timeframe === '24h' ? 24 : timeframe === '7d' ? 7 : 30;
    const data = [];
    
    for (let i = 0; i < days; i++) {
      const date = subDays(new Date(), days - i - 1);
      const baseVolume = 1000 + Math.sin(i * 0.4) * 200;
      const marketVolatility = Math.random() * 300;
      
      data.push({
        date: format(date, timeframe === '24h' ? 'HH:mm' : 'MMM dd'),
        timestamp: date.toISOString(),
        volume: Math.max(0, baseVolume + marketVolatility),
        value: Math.max(0, (baseVolume + marketVolatility) * (0.12 + Math.random() * 0.06)),
        transactions: Math.floor(Math.random() * 50) + 10
      });
    }
    
    return data;
  };

  const generatePriceAnalysisData = (timeframe) => {
    const days = timeframe === '24h' ? 24 : timeframe === '7d' ? 7 : 30;
    const data = [];
    let currentPrice = 0.15;
    
    for (let i = 0; i < days; i++) {
      const date = subDays(new Date(), days - i - 1);
      const priceChange = (Math.random() - 0.5) * 0.01;
      currentPrice = Math.max(0.08, Math.min(0.25, currentPrice + priceChange));
      
      data.push({
        date: format(date, timeframe === '24h' ? 'HH:mm' : 'MMM dd'),
        timestamp: date.toISOString(),
        price: Number(currentPrice.toFixed(4)),
        high: Number((currentPrice * 1.05).toFixed(4)),
        low: Number((currentPrice * 0.95).toFixed(4)),
        volume: Math.floor(Math.random() * 1000) + 500
      });
    }
    
    return data;
  };

  const generateCarbonCreditData = (timeframe) => {
    return [
      { name: 'Solar Credits', value: 45, color: '#FFD700' },
      { name: 'Wind Credits', value: 30, color: '#00CED1' },
      { name: 'Hydro Credits', value: 20, color: '#32CD32' },
      { name: 'Other', value: 5, color: '#FF6347' }
    ];
  };

  const calculateEfficiency = (data) => {
    const theoretical = data.metrics?.devicesConnected * 100 * 24; // Theoretical max
    const actual = data.metrics?.totalEnergyProduced || 0;
    return theoretical > 0 ? Math.round((actual / theoretical) * 100) : 0;
  };

  // Export functionality
  const exportData = (format) => {
    const dataToExport = {
      overview: analyticsData.overview,
      energyProduction: analyticsData.energyProduction,
      tradingVolume: analyticsData.tradingVolume,
      exportedAt: new Date().toISOString(),
      timeframe
    };

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `energy-analytics-${timeframe}-${format(new Date(), 'yyyy-MM-dd')}.json`;
      a.click();
    } else if (format === 'csv') {
      const csv = convertToCSV(analyticsData.energyProduction);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `energy-production-${timeframe}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
    }
  };

  const convertToCSV = (data) => {
    const headers = Object.keys(data[0] || {}).join(',');
    const rows = data.map(row => Object.values(row).join(','));
    return [headers, ...rows].join('\n');
  };

  // Custom chart components
  const MetricCard = ({ title, value, change, icon: Icon, color, onClick }) => (
    <div 
      className={`metric-card ${color} ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
    >
      <div className="metric-header">
        <Icon className="metric-icon" />
        <span className="metric-title">{title}</span>
      </div>
      <div className="metric-value">{value}</div>
      {change && (
        <div className={`metric-change ${change >= 0 ? 'positive' : 'negative'}`}>
          {change >= 0 ? <FiTrendingUp /> : <FiTrendingDown />}
          {Math.abs(change).toFixed(1)}%
        </div>
      )}
    </div>
  );

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <p className="tooltip-label">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.dataKey}: ${entry.value.toLocaleString()}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="analytics-loading">
        <FiRefreshCw className="spinning" />
        <h3>Loading Analytics...</h3>
        <p>Fetching your energy data and market insights</p>
      </div>
    );
  }

  return (
    <div className="analytics-dashboard">
      {/* Header */}
      <div className="analytics-header">
        <div className="header-content">
          <h1>Energy Analytics Dashboard</h1>
          <p>Comprehensive insights into your energy production, trading, and market performance</p>
        </div>
        
        <div className="header-controls">
          <div className="timeframe-selector">
            {['24h', '7d', '30d', '90d'].map(period => (
              <button
                key={period}
                className={`timeframe-btn ${timeframe === period ? 'active' : ''}`}
                onClick={() => setTimeframe(period)}
              >
                {period}
              </button>
            ))}
          </div>
          
          <div className="export-controls">
            <button 
              className="export-btn"
              onClick={() => exportData('json')}
            >
              <FiDownload />
              Export JSON
            </button>
            <button 
              className="export-btn"
              onClick={() => exportData('csv')}
            >
              <FiDownload />
              Export CSV
            </button>
          </div>
          
          <button 
            className="refresh-btn"
            onClick={loadAnalyticsData}
            disabled={loading}
          >
            <FiRefreshCw className={loading ? 'spinning' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="kpi-overview">
        <MetricCard
          title="Total Energy Produced"
          value={`${analyticsData.overview.totalEnergyProduced?.toLocaleString() || 0} kWh`}
          change={analyticsData.overview.growthRate}
          icon={FiZap}
          color="energy"
          onClick={() => setSelectedMetric('energy')}
        />
        <MetricCard
          title="Total Revenue"
          value={`$${analyticsData.overview.totalRevenue?.toLocaleString() || 0}`}
          change={15.2}
          icon={FiDollarSign}
          color="revenue"
          onClick={() => setSelectedMetric('revenue')}
        />
        <MetricCard
          title="Active Trades"
          value={analyticsData.overview.activeTrades || 0}
          change={8.7}
          icon={FiActivity}
          color="trades"
          onClick={() => setSelectedMetric('trading')}
        />
        <MetricCard
          title="Carbon Credits"
          value={analyticsData.overview.carbonCredits || 0}
          change={12.3}
          icon={FiGrid}
          color="credits"
          onClick={() => setSelectedMetric('carbon')}
        />
        <MetricCard
          title="System Efficiency"
          value={`${analyticsData.overview.efficiency || 0}%`}
          change={2.1}
          icon={FiBarChart2}
          color="efficiency"
        />
      </div>

      {/* Main Charts Grid */}
      <div className="charts-grid">
        {/* Energy Production Chart */}
        <div className="chart-container large">
          <div className="chart-header">
            <h3>Energy Production by Source</h3>
            <div className="chart-controls">
              <button className={`chart-type-btn ${selectedMetric === 'energy' ? 'active' : ''}`}>
                <FiBarChart2 />
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={analyticsData.energyProduction}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="date" 
                stroke="rgba(255,255,255,0.7)"
                fontSize={12}
              />
              <YAxis 
                stroke="rgba(255,255,255,0.7)"
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="solar" 
                stackId="1" 
                stroke="#FFD700" 
                fill="#FFD700" 
                fillOpacity={0.6}
                name="Solar"
              />
              <Area 
                type="monotone" 
                dataKey="wind" 
                stackId="1" 
                stroke="#00CED1" 
                fill="#00CED1" 
                fillOpacity={0.6}
                name="Wind"
              />
              <Area 
                type="monotone" 
                dataKey="hydro" 
                stackId="1" 
                stroke="#32CD32" 
                fill="#32CD32" 
                fillOpacity={0.6}
                name="Hydro"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Trading Volume Chart */}
        <div className="chart-container medium">
          <div className="chart-header">
            <h3>Trading Volume & Value</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.tradingVolume}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="date" 
                stroke="rgba(255,255,255,0.7)"
                fontSize={12}
              />
              <YAxis 
                stroke="rgba(255,255,255,0.7)"
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="volume" fill="#00ffff" fillOpacity={0.8} name="Volume (kWh)" />
              <Bar dataKey="value" fill="#ff6b6b" fillOpacity={0.8} name="Value ($)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Price Analysis Chart */}
        <div className="chart-container medium">
          <div className="chart-header">
            <h3>Energy Price Trends</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analyticsData.priceAnalysis}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="date" 
                stroke="rgba(255,255,255,0.7)"
                fontSize={12}
              />
              <YAxis 
                stroke="rgba(255,255,255,0.7)"
                fontSize={12}
                domain={['dataMin - 0.01', 'dataMax + 0.01']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="#00ffff" 
                strokeWidth={3}
                dot={{ fill: '#00ffff', strokeWidth: 2, r: 4 }}
                name="Price ($/kWh)"
              />
              <Line 
                type="monotone" 
                dataKey="high" 
                stroke="#4ade80" 
                strokeWidth={1}
                strokeDasharray="5 5"
                dot={false}
                name="High"
              />
              <Line 
                type="monotone" 
                dataKey="low" 
                stroke="#f87171" 
                strokeWidth={1}
                strokeDasharray="5 5"
                dot={false}
                name="Low"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Carbon Credits Distribution */}
        <div className="chart-container small">
          <div className="chart-header">
            <h3>Carbon Credits by Source</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analyticsData.carbonCredits}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {analyticsData.carbonCredits.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="insights-section">
        <h3>Performance Insights</h3>
        <div className="insights-grid">
          <div className="insight-card">
            <h4>Energy Efficiency</h4>
            <p>Your system is operating at <strong>{analyticsData.overview.efficiency}% efficiency</strong>, which is above the industry average of 78%.</p>
            <div className="insight-recommendation">
              💡 Consider optimizing solar panel angles for 5% efficiency gain
            </div>
          </div>
          
          <div className="insight-card">
            <h4>Trading Performance</h4>
            <p>Your average selling price is <strong>12% above market rate</strong>, indicating excellent timing and strategy.</p>
            <div className="insight-recommendation">
              📈 Current market conditions favor increased trading volume
            </div>
          </div>
          
          <div className="insight-card">
            <h4>Carbon Impact</h4>
            <p>Generated <strong>{analyticsData.overview.carbonCredits} carbon credits</strong> this period, equivalent to planting 47 trees.</p>
            <div className="insight-recommendation">
              🌱 On track to exceed annual sustainability goals by 15%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
