import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Card, Form, Button, Alert, Table, Badge, ProgressBar } from 'react-bootstrap';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, TrendingUp, TrendingDown, Zap, Target, Clock, BarChart3, Activity, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import ApiService from '../services/ApiService';
import moment from 'moment';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Predictions = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [daysAhead, setDaysAhead] = useState(7);
  const [prediction, setPrediction] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stockAnalysis, setStockAnalysis] = useState(null);
  const [availableSymbols, setAvailableSymbols] = useState(['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'META', 'NVDA', 'NFLX']);
  // New UI/feature states
  const [showIntervals, setShowIntervals] = useState(true);
  const [showBaseline, setShowBaseline] = useState(true);
  const [logScale, setLogScale] = useState(false);
  const [exporting, setExporting] = useState(false);

  const loadHistoricalData = useCallback(async () => {
    try {
      // Fetch the latest quote first to keep data real-time
      try {
        await ApiService.getStockQuote(selectedSymbol);
      } catch (quoteErr) {
        console.warn('Unable to refresh latest quote, using cached data if available:', quoteErr);
      }

      const historical = await ApiService.getRecentData(selectedSymbol, 60);
      setHistoricalData(historical.reverse());
      
      // Calculate stock-specific analysis
      if (historical.length > 0) {
        const analysis = calculateStockAnalysis(historical);
        setStockAnalysis(analysis);
      }
    } catch (error) {
      console.error('Error loading historical data:', error);
    }
  }, [selectedSymbol]);

  useEffect(() => {
    loadHistoricalData();
  }, [loadHistoricalData]);

  // Load available symbols from backend once
  useEffect(() => {
    (async () => {
      try {
        const symbols = await ApiService.getAllTrackedSymbols();
        if (Array.isArray(symbols) && symbols.length > 0) {
          setAvailableSymbols(
            symbols
              .filter(Boolean)
              .map((s) => String(s).toUpperCase())
              .sort()
          );
        }
      } catch (symErr) {
        console.warn('Failed to load symbols list, falling back to defaults:', symErr);
      }
    })();
  }, []);

  const handlePredict = async () => {
    try {
      setLoading(true);
      setError(null);

      const predictionResult = await ApiService.predictStockPrice(selectedSymbol, daysAhead);
      setPrediction(predictionResult);

    } catch (error) {
      console.error('Error making prediction:', error);
      setError('Failed to generate prediction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateStockAnalysis = (data) => {
    if (data.length < 2) return null;

    const prices = data.map(d => d.currentPrice);
    const volumes = data.map(d => d.volume || 0);
    
    // Calculate moving averages
    const sma20 = prices.slice(-20).reduce((a, b) => a + b, 0) / Math.min(20, prices.length);
    const sma50 = prices.slice(-50).reduce((a, b) => a + b, 0) / Math.min(50, prices.length);
    
    // Calculate RSI
    let gains = 0, losses = 0;
    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }
    const avgGain = gains / (prices.length - 1);
    const avgLoss = losses / (prices.length - 1);
    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));
    
    // Calculate volatility
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    const volatility = Math.sqrt(returns.reduce((sum, ret) => sum + ret * ret, 0) / returns.length);
    
    // Calculate trend
    const currentPrice = prices[prices.length - 1];
    const trend = currentPrice > sma20 ? 'Bullish' : 'Bearish';
    const trendStrength = Math.abs(currentPrice - sma20) / sma20;
    
    // Calculate support and resistance
    const support = Math.min(...prices.slice(-20));
    const resistance = Math.max(...prices.slice(-20));
    
    return {
      currentPrice,
      sma20,
      sma50,
      rsi,
      volatility,
      trend,
      trendStrength,
      support,
      resistance,
      volumeAvg: volumes.reduce((a, b) => a + b, 0) / volumes.length,
      priceChange: ((currentPrice - prices[0]) / prices[0]) * 100
    };
  };

  const getPredictionChartData = () => {
    if (!prediction || !historicalData.length || !stockAnalysis) {
      return {
        labels: [],
        datasets: []
      };
    }

    const historicalSlice = historicalData.slice(-30);
    const historicalPrices = historicalSlice.map(d => d.currentPrice);
    // Initial coarse labels (day only)
    let historicalDates = historicalSlice.map(d => moment(d.timestamp).format('MM/DD'));
    // Check duplicate ratio
    const uniqueCount = new Set(historicalDates).size;
    const duplicateRatio = 1 - (uniqueCount / historicalDates.length);
    // If many duplicates (intraday points same day) switch to finer granularity
    if (duplicateRatio > 0.3) {
      historicalDates = historicalSlice.map(d => moment(d.timestamp).format('MM/DD HH:mm'));
    }
    // Compress consecutive identical labels to reduce clutter (keep first occurrence)
    const compressedHistoricalDates = [];
    let lastLabel = null;
    for (let lbl of historicalDates) {
      if (lbl === lastLabel) compressedHistoricalDates.push(''); else { compressedHistoricalDates.push(lbl); lastLabel = lbl; }
    }
    
    const predictionDates = prediction.predictionDates ? 
      prediction.predictionDates.map(date => moment(date).format('MM/DD')) : [];
    // Ensure prediction start date not duplicating last historical label
    const allDates = [...compressedHistoricalDates, ...predictionDates];
    
    // Create a gap between historical and predicted data
    const historicalDataPoints = [...historicalPrices, null];
    const predictionDataPoints = [
      ...new Array(historicalPrices.length - 1).fill(null),
      historicalPrices[historicalPrices.length - 1],
      ...(prediction.predictedPrices || [])
    ];

    // Add moving averages
    const sma20Data = historicalData.slice(-30).map((data, index) => {
      if (index < 19) return null;
      const slice = historicalData.slice(index - 19, index + 1);
      return slice.reduce((sum, d) => sum + d.currentPrice, 0) / slice.length;
    });

    // Baseline (naive) prediction: use average daily return over last 20 periods
    let baselinePoints = [];
    if (showBaseline) {
      const prices = historicalData.map(d => d.currentPrice);
      const slice = prices.slice(-21);
      let returns = [];
      for (let i = 1; i < slice.length; i++) {
        returns.push((slice[i] - slice[i-1]) / slice[i-1]);
      }
      const avgReturn = returns.length ? returns.reduce((a,b)=>a+b,0)/returns.length : 0;
      const lastPrice = prices[prices.length-1];
      baselinePoints = [
        ...new Array(historicalPrices.length - 1).fill(null),
        historicalPrices[historicalPrices.length - 1],
      ];
      for (let i=1;i<=prediction.predictedPrices.length;i++) {
        baselinePoints.push(lastPrice * Math.pow(1+avgReturn, i));
      }
    }

    const datasets = [
      {
        label: 'Historical Prices',
        data: historicalDataPoints,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        tension: 0.1,
        pointRadius: 3,
        fill: false,
        order: 3,
      },
      {
        label: 'Predicted Prices',
        data: predictionDataPoints,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        borderDash: [5, 5],
        tension: 0.1,
        pointRadius: 4,
        fill: false,
        order: 4,
      },
      {
        label: '20-Day SMA',
        data: [...sma20Data, ...new Array(prediction.predictedPrices.length).fill(null)],
        borderColor: 'rgb(255, 205, 86)',
        backgroundColor: 'rgba(255, 205, 86, 0.1)',
        tension: 0.1,
        pointRadius: 2,
        fill: false,
        order: 2,
      }
    ];

    // Interval shading (upper & lower) if available
    if (showIntervals && prediction.upperBounds && prediction.lowerBounds) {
      const upperData = [
        ...new Array(historicalPrices.length).fill(null),
        ...prediction.upperBounds
      ];
      const lowerData = [
        ...new Array(historicalPrices.length).fill(null),
        ...prediction.lowerBounds
      ];
      datasets.unshift({
        label: 'Upper Interval',
        data: upperData,
        borderColor: 'rgba(255, 255, 255, 0.0)',
        backgroundColor: 'rgba(255, 159, 64, 0.08)',
        pointRadius: 0,
        fill: '+1',
        tension: 0.15,
        order: 0,
      });
      datasets.unshift({
        label: 'Lower Interval',
        data: lowerData,
        borderColor: 'rgba(255, 255, 255, 0.0)',
        backgroundColor: 'rgba(255, 159, 64, 0.08)',
        pointRadius: 0,
        fill: false,
        tension: 0.15,
        order: 0,
      });
    }

    if (showBaseline) {
      datasets.push({
        label: 'Baseline (Avg Return)',
        data: baselinePoints,
        borderColor: 'rgba(99, 102, 241, 0.9)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderDash: [2,3],
        pointRadius: 0,
        tension: 0.1,
        fill: false,
        order: 1,
      });
    }

    return { labels: allDates, datasets };
  };

  const getTechnicalIndicatorsChart = () => {
    if (!stockAnalysis || !historicalData.length) return null;

    const dates = historicalData.slice(-20).map(data => moment(data.timestamp).format('MM/DD'));
    const prices = historicalData.slice(-20).map(data => data.currentPrice);
    
    // Calculate RSI for the last 20 days
    const rsiData = [];
    for (let i = 14; i < prices.length; i++) {
      let gains = 0, losses = 0;
      for (let j = i - 13; j <= i; j++) {
        const change = prices[j] - prices[j - 1];
        if (change > 0) gains += change;
        else losses -= change;
      }
      const avgGain = gains / 14;
      const avgLoss = losses / 14;
      const rs = avgGain / avgLoss;
      const rsi = 100 - (100 / (1 + rs));
      rsiData.push(rsi);
    }

    return {
      labels: dates.slice(14),
      datasets: [
        {
          label: 'RSI',
          data: rsiData,
          borderColor: 'rgb(153, 102, 255)',
          backgroundColor: 'rgba(153, 102, 255, 0.1)',
          tension: 0.1,
          pointRadius: 3,
          fill: true,
        }
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: 'rgba(255, 255, 255, 0.8)',
          font: { size: 14, weight: '600' },
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      title: {
        display: true,
        text: `${selectedSymbol} - AI Price Prediction & Technical Analysis`,
        color: 'rgba(255, 255, 255, 0.9)',
        font: { size: 18, weight: '700' }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 99, 132, 0.5)',
        borderWidth: 1,
        cornerRadius: 10,
        displayColors: true,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: $${context.parsed.y?.toFixed(2) || 'N/A'}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.1)', drawBorder: false },
        ticks: { color: 'rgba(255, 255, 255, 0.7)', font: { size: 12 } }
      },
      y: {
        type: logScale ? 'logarithmic' : 'linear',
        beginAtZero: false,
        grid: { color: 'rgba(255, 255, 255, 0.1)', drawBorder: false },
        ticks: { 
          color: 'rgba(255, 255, 255, 0.7)', 
          font: { size: 12 },
          callback: function(value) {
            if (logScale) return '$' + Number(value).toLocaleString();
            return '$' + Number(value).toFixed(2);
          }
        }
      },
    },
    interaction: { intersect: false, mode: 'index' },
    animation: { duration: 2000, easing: 'easeInOutQuart' }
  };

  const rsiChartOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      title: {
        ...chartOptions.plugins.title,
        text: `${selectedSymbol} - RSI Technical Indicator`
      }
    },
    scales: {
      ...chartOptions.scales,
      y: {
        ...chartOptions.scales.y,
        min: 0,
        max: 100,
        ticks: {
          ...chartOptions.scales.y.ticks,
          callback: function(value) {
            return value.toFixed(0);
          }
        }
      }
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'warning';
    return 'danger';
  };

  const getTrendColor = (trend) => {
    return trend === 'Bullish' ? 'success' : 'danger';
  };

  const getRSIColor = (rsi) => {
    if (rsi > 70) return 'danger';
    if (rsi < 30) return 'success';
    return 'warning';
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } }
  };

  const cardHoverVariants = {
    hover: { scale: 1.02, transition: { duration: 0.2, ease: "easeInOut" } }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants} className="d-flex align-items-center mb-4">
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="me-3"
        >
          <Brain size={32} className="text-primary" />
        </motion.div>
        <h2 className="mb-0">AI-Powered Stock Predictions & Technical Analysis</h2>
      </motion.div>

      {/* Prediction Input */}
      <motion.div variants={itemVariants}>
        <Row className="mb-4">
          <Col md={8}>
            <motion.div variants={cardHoverVariants} whileHover="hover">
              <Card>
                <Card.Header className="d-flex align-items-center justify-content-between">
                  <h5 className="mb-0 d-flex align-items-center">
                    <Target size={20} className="me-2 text-primary" />
                    Generate AI Prediction
                  </h5>
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Zap size={20} className="text-warning" />
                  </motion.div>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Stock Symbol</Form.Label>
                        <Form.Control
                          type="text"
                          list="symbolOptions"
                          value={selectedSymbol}
                          onChange={(e) => setSelectedSymbol(e.target.value.toUpperCase())}
                          placeholder="Type to search e.g., AAPL"
                        />
                        <datalist id="symbolOptions">
                          {availableSymbols
                            .filter((s) => !selectedSymbol || s.startsWith(selectedSymbol.toUpperCase()))
                            .slice(0, 200)
                            .map((symbol) => (
                              <option key={symbol} value={symbol} />
                            ))}
                        </datalist>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Prediction Horizon: {daysAhead} day{daysAhead!==1?'s':''}</Form.Label>
                        <Form.Range min={1} max={30} value={daysAhead} onChange={(e)=>setDaysAhead(parseInt(e.target.value))} />
                      </Form.Group>
                      <div className="d-flex flex-wrap small gap-3">
                        <Form.Check type="switch" id="toggle-intervals" label="Intervals" checked={showIntervals} onChange={(e)=>setShowIntervals(e.target.checked)} />
                        <Form.Check type="switch" id="toggle-baseline" label="Baseline" checked={showBaseline} onChange={(e)=>setShowBaseline(e.target.checked)} />
                        <Form.Check type="switch" id="toggle-log" label="Log Scale" checked={logScale} onChange={(e)=>setLogScale(e.target.checked)} />
                      </div>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>&nbsp;</Form.Label>
                        <div>
                          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button 
                              variant="primary" 
                              onClick={handlePredict}
                              disabled={loading}
                              className="w-100 d-flex align-items-center justify-content-center"
                            >
                              {loading ? (
                                <>
                                  <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    className="me-2"
                                  >
                                    <Brain size={16} />
                                  </motion.div>
                                  Analyzing...
                                </>
                              ) : (
                                <>
                                  <BarChart3 size={16} className="me-2" />
                                  Generate Prediction
                                </>
                              )}
                            </Button>
                          </motion.div>
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </motion.div>
          </Col>

          {/* Stock Analysis Summary */}
          <Col md={4}>
            <AnimatePresence>
              {stockAnalysis && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, x: 50 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9, x: 50 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  variants={cardHoverVariants}
                  whileHover="hover"
                >
                  <Card className="analysis-card position-relative overflow-hidden">
                    <Card.Body>
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <h5 className="mb-0">Stock Analysis</h5>
                        <motion.div
                          animate={{ rotate: [0, 360] }}
                          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        >
                          <Activity size={20} className="text-info" />
                        </motion.div>
                      </div>
                      
                      <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span>Current Price:</span>
                          <strong className="text-white">${stockAnalysis.currentPrice.toFixed(2)}</strong>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span>20-Day SMA:</span>
                          <span className="text-white-50">${stockAnalysis.sma20.toFixed(2)}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span>Trend:</span>
                          <Badge bg={getTrendColor(stockAnalysis.trend)}>
                            {stockAnalysis.trend}
                          </Badge>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span>RSI:</span>
                          <Badge bg={getRSIColor(stockAnalysis.rsi)}>
                            {stockAnalysis.rsi.toFixed(1)}
                          </Badge>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span>Volatility:</span>
                          <span className="text-white-50">{(stockAnalysis.volatility * 100).toFixed(2)}%</span>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <small>Support: ${stockAnalysis.support.toFixed(2)}</small>
                          <small>Resistance: ${stockAnalysis.resistance.toFixed(2)}</small>
                        </div>
                        <ProgressBar 
                          now={((stockAnalysis.currentPrice - stockAnalysis.support) / (stockAnalysis.resistance - stockAnalysis.support)) * 100}
                          variant="info"
                          className="mb-2"
                        />
                      </div>
                    </Card.Body>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </Col>
        </Row>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <Alert variant="danger" className="mb-4 d-flex align-items-center">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: 2 }}
                className="me-2"
              >
                <TrendingDown size={20} />
              </motion.div>
              {error}
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Prediction Chart */}
      <AnimatePresence>
        {prediction && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            variants={itemVariants}
          >
            <Row className="mb-4">
              <Col md={12}>
                <motion.div variants={cardHoverVariants} whileHover="hover">
                  <Card>
                    <Card.Header className="d-flex align-items-center justify-content-between">
                      <h5 className="mb-0 d-flex align-items-center">
                        <BarChart3 size={20} className="me-2 text-success" />
                        AI Price Prediction Chart
                      </h5>
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <TrendingUp size={20} className="text-success" />
                      </motion.div>
                    </Card.Header>
                    <Card.Body>
                      <motion.div 
                        className="chart-container"
                        style={{ height: '400px' }}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                      >
                        {getPredictionChartData() && getPredictionChartData().labels.length > 0 ? (
                          <Line data={getPredictionChartData()} options={chartOptions} />
                        ) : (
                          <div className="text-center py-5">
                            <p className="text-muted">No prediction data available. Generate a prediction to see the chart.</p>
                          </div>
                        )}
                      </motion.div>
                    </Card.Body>
                  </Card>
                </motion.div>
              </Col>
            </Row>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Technical Indicators */}
      <AnimatePresence>
        {stockAnalysis && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            variants={itemVariants}
          >
            <Row className="mb-4">
              <Col md={6}>
                <motion.div variants={cardHoverVariants} whileHover="hover">
                  <Card>
                    <Card.Header className="d-flex align-items-center justify-content-between">
                      <h5 className="mb-0 d-flex align-items-center">
                        <Activity size={20} className="me-2 text-warning" />
                        RSI Indicator
                      </h5>
                      <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                      >
                        <Brain size={20} className="text-warning" />
                      </motion.div>
                    </Card.Header>
                    <Card.Body>
                      <div style={{ height: '300px' }}>
                        {getTechnicalIndicatorsChart() ? (
                          <Line data={getTechnicalIndicatorsChart()} options={rsiChartOptions} />
                        ) : (
                          <div className="text-center py-5">
                            <p className="text-muted">Calculating RSI...</p>
                          </div>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                </motion.div>
              </Col>
              
              <Col md={6}>
                <motion.div variants={cardHoverVariants} whileHover="hover">
                  <Card>
                    <Card.Header className="d-flex align-items-center justify-content-between">
                                              <h5 className="mb-0 d-flex align-items-center">
                          <ArrowUpRight size={20} className="me-2 text-info" />
                          Technical Summary
                        </h5>
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Zap size={20} className="text-info" />
                      </motion.div>
                    </Card.Header>
                    <Card.Body>
                      <div className="row text-center">
                        <div className="col-6 mb-3">
                          <div className="p-3 bg-light rounded">
                            <h6 className="text-muted">Price Change</h6>
                            <h4 className={`mb-0 ${stockAnalysis.priceChange >= 0 ? 'text-success' : 'text-danger'}`}>
                              {stockAnalysis.priceChange >= 0 ? '+' : ''}{stockAnalysis.priceChange.toFixed(2)}%
                            </h4>
                          </div>
                        </div>
                        <div className="col-6 mb-3">
                          <div className="p-3 bg-light rounded">
                            <h6 className="text-muted">Volume Avg</h6>
                            <h4 className="mb-0 text-primary">
                              {(stockAnalysis.volumeAvg / 1000000).toFixed(1)}M
                            </h4>
                          </div>
                        </div>
                        <div className="col-6 mb-3">
                          <div className="p-3 bg-light rounded">
                            <h6 className="text-muted">Trend Strength</h6>
                            <h4 className="mb-0 text-warning">
                              {(stockAnalysis.trendStrength * 100).toFixed(1)}%
                            </h4>
                          </div>
                        </div>
                        <div className="col-6 mb-3">
                          <div className="p-3 bg-light rounded">
                            <h6 className="text-muted">Volatility</h6>
                            <h4 className="mb-0 text-info">
                              {(stockAnalysis.volatility * 100).toFixed(2)}%
                            </h4>
                          </div>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </motion.div>
              </Col>
            </Row>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Prediction Details Table */}
      <AnimatePresence>
        {prediction && prediction.predictedPrices.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            variants={itemVariants}
          >
            <Row>
              <Col md={12}>
                <motion.div variants={cardHoverVariants} whileHover="hover">
                  <Card>
                    <Card.Header className="d-flex align-items-center justify-content-between">
                      <h5 className="mb-0 d-flex align-items-center">
                        <Target size={20} className="me-2 text-info" />
                        Detailed AI Predictions
                      </h5>
                      <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                      >
                        <Brain size={20} className="text-info" />
                      </motion.div>
                    </Card.Header>
                    <Card.Body>
                      <div className="mb-3">
                        <div className="d-flex align-items-center justify-content-between">
                          <div>
                            <strong>AI Model:</strong> {prediction.modelUsed}
                            <Badge bg={getConfidenceColor(prediction.confidence)} className="ms-2">
                              Confidence: {(prediction.confidence * 100).toFixed(1)}%
                            </Badge>
                          </div>
                          <div className="text-muted d-flex align-items-center gap-2 flex-wrap">
                            <span><Clock size={14} className="me-1" />{moment(prediction.generatedAt).format('YYYY-MM-DD HH:mm')}</span>
                            {(prediction.mae || prediction.rmse) && (
                              <span className="badge bg-dark border">MAE: {prediction.mae?.toFixed(2)} | RMSE: {prediction.rmse?.toFixed(2)}{prediction.mape ? ` | MAPE: ${prediction.mape.toFixed(2)}%` : ''}</span>
                            )}
                            <Button size="sm" variant="outline-secondary" disabled={exporting} onClick={async()=>{
                              try {
                                setExporting(true);
                                const rows = ['Date,Predicted,Lower,Upper,Baseline'];
                                const lastHistPrice = stockAnalysis?.currentPrice || 0;
                                const baseline = [];
                                if (prediction.predictedPrices?.length) {
                                  // Recreate baseline used in chart for CSV
                                  const prices = historicalData.map(d=>d.currentPrice);
                                  const slice = prices.slice(-21);
                                  let returns = []; for (let i=1;i<slice.length;i++){returns.push((slice[i]-slice[i-1])/slice[i-1]);}
                                  const avgReturn = returns.length? returns.reduce((a,b)=>a+b,0)/returns.length : 0;
                                  for (let i=1;i<=prediction.predictedPrices.length;i++){ baseline.push(lastHistPrice*Math.pow(1+avgReturn,i)); }
                                }
                                prediction.predictedPrices.forEach((p,i)=>{
                                  const date = prediction.predictionDates[i];
                                  rows.push(`${moment(date).format('YYYY-MM-DD')},${p},${prediction.lowerBounds?prediction.lowerBounds[i]:''},${prediction.upperBounds?prediction.upperBounds[i]:''},${baseline[i]||''}`);
                                });
                                const blob = new Blob([rows.join('\n')], {type:'text/csv'});
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url; a.download = `${prediction.symbol}_prediction.csv`; a.click();
                                URL.revokeObjectURL(url);
                              } finally { setExporting(false);} }}>Export CSV</Button>
                          </div>
                        </div>
                      </div>
                      
                      <Table responsive striped hover variant="dark">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Predicted Price</th>
                            <th>Days from Now</th>
                            <th>Change from Current</th>
                            <th>Trend Direction</th>
                          </tr>
                        </thead>
                        <tbody>
                          <AnimatePresence>
                            {prediction.predictedPrices.map((price, index) => {
                              const numPrice = Number(price) || 0;
                              const currentPrice = stockAnalysis ? stockAnalysis.currentPrice : 0;
                              const change = numPrice - currentPrice;
                              const changePercent = currentPrice > 0 ? (change / currentPrice) * 100 : 0;
                              const trend = change >= 0 ? 'Bullish' : 'Bearish';

                              return (
                                <motion.tr 
                                  key={index}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: 20 }}
                                  transition={{ delay: index * 0.1 }}
                                  whileHover={{ 
                                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                    scale: 1.01
                                  }}
                                >
                                  <td className="d-flex align-items-center">
                                    <Clock size={14} className="me-2 text-muted" />
                                    {moment(prediction.predictionDates[index]).format('YYYY-MM-DD')}
                                  </td>
                                  <td>
                                    <motion.span
                                      key={price}
                                      initial={{ scale: 1.1, color: '#4facfe' }}
                                      animate={{ scale: 1, color: 'rgba(255, 255, 255, 0.8)' }}
                                      transition={{ duration: 0.3 }}
                                    >
                                      ${numPrice.toFixed(2)}
                                    </motion.span>
                                  </td>
                                  <td>
                                    <span className="badge bg-secondary">
                                      {index + 1} day{index > 0 ? 's' : ''}
                                    </span>
                                  </td>
                                  <td className={`d-flex align-items-center ${change >= 0 ? 'price-positive' : 'price-negative'}`}>
                                    {change >= 0 ? 
                                      <TrendingUp size={14} className="me-1" /> : 
                                      <TrendingDown size={14} className="me-1" />
                                    }
                                    <motion.span
                                      initial={{ scale: 1.1 }}
                                      animate={{ scale: 1 }}
                                      transition={{ duration: 0.3 }}
                                    >
                                      {change >= 0 ? '+' : ''}${change.toFixed(2)} 
                                      ({change >= 0 ? '+' : ''}{changePercent.toFixed(2)}%)
                                    </motion.span>
                                  </td>
                                  <td>
                                    <Badge bg={trend === 'Bullish' ? 'success' : 'danger'}>
                                      {trend === 'Bullish' ? <ArrowUpRight size={12} className="me-1" /> : <ArrowDownRight size={12} className="me-1" />}
                                      {trend}
                                    </Badge>
                                  </td>
                                </motion.tr>
                              );
                            })}
                          </AnimatePresence>
                        </tbody>
                      </Table>
                    </Card.Body>
                  </Card>
                </motion.div>
              </Col>
            </Row>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Model Information */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.8 }}
      >
        <Row className="mt-4">
          <Col md={12}>
            <motion.div variants={cardHoverVariants} whileHover="hover">
              <Card>
                <Card.Header className="d-flex align-items-center justify-content-between">
                  <h5 className="mb-0 d-flex align-items-center">
                    <Brain size={20} className="me-2 text-primary" />
                    About Enhanced LSTM AI Predictions
                  </h5>
                  <motion.div
                    animate={{ 
                      rotate: [0, 10, -10, 0],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ 
                      duration: 3, 
                      repeat: Infinity,
                      repeatDelay: 2
                    }}
                  >
                    <Zap size={20} className="text-warning" />
                  </motion.div>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <h6 className="d-flex align-items-center mb-3">
                          <BarChart3 size={18} className="me-2 text-success" />
                          Enhanced Features:
                        </h6>
                        <motion.ul className="list-unstyled">
                          {[
                            'Multi-feature LSTM with price, volume, and technical indicators',
                            'Stock-specific model training and caching',
                            'Real-time volatility and trend analysis',
                            'Dynamic confidence scoring based on data quality',
                            'Support and resistance level calculations'
                          ].map((item, index) => (
                            <motion.li 
                              key={index}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.3 + index * 0.1 }}
                              className="mb-2 d-flex align-items-start"
                            >
                              <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ 
                                  duration: 2, 
                                  repeat: Infinity,
                                  delay: index * 0.5
                                }}
                                className="me-2 mt-1"
                              >
                                <div style={{
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  backgroundColor: '#48bb78'
                                }} />
                              </motion.div>
                              <span className="text-white-50">{item}</span>
                            </motion.li>
                          ))}
                        </motion.ul>
                      </motion.div>
                    </Col>
                    <Col md={6}>
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                      >
                        <h6 className="d-flex align-items-center mb-3">
                          <ArrowUpRight size={18} className="me-2 text-warning" />
                          Technical Indicators:
                        </h6>
                        <motion.ul className="list-unstyled">
                          {[
                            'RSI (Relative Strength Index) for overbought/oversold signals',
                            'Moving averages for trend identification',
                            'Volatility calculations for risk assessment',
                            'Volume analysis for market sentiment',
                            'Support/resistance levels for entry/exit points'
                          ].map((item, index) => (
                            <motion.li 
                              key={index}
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.5 + index * 0.1 }}
                              className="mb-2 d-flex align-items-start"
                            >
                              <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ 
                                  duration: 2, 
                                  repeat: Infinity,
                                  delay: index * 0.5 + 1
                                }}
                                className="me-2 mt-1"
                              >
                                <div style={{
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  backgroundColor: '#ed8936'
                                }} />
                              </motion.div>
                              <span className="text-white-50">{item}</span>
                            </motion.li>
                          ))}
                        </motion.ul>
                      </motion.div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </motion.div>
          </Col>
        </Row>
      </motion.div>
    </motion.div>
  );
};

export default Predictions;
