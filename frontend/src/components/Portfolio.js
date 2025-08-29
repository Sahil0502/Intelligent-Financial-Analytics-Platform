import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Row, Col, Card, Form, Button, Table, Modal, Alert } from 'react-bootstrap';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, TrendingUp, TrendingDown, Plus, Trash2, DollarSign, Target, BarChart3 } from 'lucide-react';
import ApiService from '../services/ApiService';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Portfolio = () => {
  const [portfolios, setPortfolios] = useState([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddHoldingModal, setShowAddHoldingModal] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState('');
  const [newHolding, setNewHolding] = useState({
    symbol: '',
    quantity: '',
    averagePrice: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);
  const [isBackendAvailable, setIsBackendAvailable] = useState(true);
  
  // Refs to prevent unnecessary re-renders
  const loadingRef = useRef(false);
  const errorRef = useRef(null);
  const retryTimeoutRef = useRef(null);

  const loadPortfolios = useCallback(async (isRetry = false) => {
    // Prevent multiple simultaneous calls
    if (loadingRef.current && !isRetry) {
      return;
    }

    // Don't retry if we've already determined backend is unavailable
    if (!isBackendAvailable && !isRetry) {
      return;
    }

    try {
      loadingRef.current = true;
      setLoading(true);
      
      // Clear any existing error on new attempt
      if (!isRetry) {
        setError(null);
        errorRef.current = null;
      }
      
      const data = await ApiService.getAllPortfolios();
      
      // Success - clear error states
      setError(null);
      errorRef.current = null;
      setIsBackendAvailable(true);
      setHasAttemptedLoad(true);
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid portfolio data received');
      }
      
      setPortfolios(data);
      
      // Update selected portfolio logic
      if (selectedPortfolio) {
        const updatedPortfolio = data.find(p => p.id === selectedPortfolio.id);
        if (updatedPortfolio) {
          setSelectedPortfolio(updatedPortfolio);
        } else if (data.length > 0) {
          setSelectedPortfolio(data[0]);
        } else {
          setSelectedPortfolio(null);
        }
      } else if (data.length > 0) {
        setSelectedPortfolio(data[0]);
      } else {
        setSelectedPortfolio(null);
      }
      
    } catch (error) {
      console.error('Portfolio loading error:', error);
      
      // Set error state only if it's different to prevent unnecessary re-renders
      if (errorRef.current !== error.message) {
        setError(error.message);
        errorRef.current = error.message;
      }
      
      // Mark backend as unavailable if it's a connection error
      if (error.message.includes('Cannot connect') || error.message.includes('ECONNREFUSED')) {
        setIsBackendAvailable(false);
      }
      
      setHasAttemptedLoad(true);
      
      // Clear portfolios on error
      setPortfolios([]);
      setSelectedPortfolio(null);
      
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [selectedPortfolio]);

  // Initial load with retry logic
  useEffect(() => {
    if (!hasAttemptedLoad) {
      loadPortfolios();
    }
  }, [hasAttemptedLoad, loadPortfolios]);

  // Cleanup retry timeout on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  const handleRetry = useCallback(() => {
    // Clear any existing retry timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    
    // Reset backend availability and retry
    setIsBackendAvailable(true);
    setError(null);
    errorRef.current = null;
    loadPortfolios(true);
  }, [loadPortfolios]);

  const handleCreatePortfolio = async () => {
    try {
      if (!newPortfolioName.trim()) {
        setError('Portfolio name cannot be empty');
        return;
      }
      
      setLoading(true);
      await ApiService.createPortfolio(newPortfolioName);
      setNewPortfolioName('');
      setShowCreateModal(false);
      setError(null);
      await loadPortfolios();
    } catch (error) {
      setError(error.message || 'Failed to create portfolio');
    } finally {
      setLoading(false);
    }
  };

  const handleAddHolding = async () => {
    try {
      if (!selectedPortfolio) {
        setError('Please select a portfolio first');
        return;
      }
      
      if (!newHolding.symbol || !newHolding.quantity || !newHolding.averagePrice) {
        setError('Please fill in all fields for the holding');
        return;
      }

      if (isNaN(newHolding.quantity) || parseInt(newHolding.quantity) <= 0) {
        setError('Quantity must be a positive number');
        return;
      }

      if (isNaN(newHolding.averagePrice) || parseFloat(newHolding.averagePrice) <= 0) {
        setError('Average price must be a positive number');
        return;
      }

      setLoading(true);
      await ApiService.addHolding(
        selectedPortfolio.id,
        newHolding.symbol.toUpperCase(),
        parseInt(newHolding.quantity),
        parseFloat(newHolding.averagePrice)
      );

      setNewHolding({ symbol: '', quantity: '', averagePrice: '' });
      setShowAddHoldingModal(false);
      setError(null);
      await loadPortfolios();
    } catch (error) {
      setError(error.message || 'Failed to add holding');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveHolding = async (symbol) => {
    try {
      if (!selectedPortfolio) return;
      
      await ApiService.removeHolding(selectedPortfolio.id, symbol);
      loadPortfolios();
    } catch (error) {
      setError('Failed to remove holding');
    }
  };

  const getPortfolioAllocationData = () => {
    if (!selectedPortfolio || !selectedPortfolio.holdings || selectedPortfolio.holdings.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }

    const labels = selectedPortfolio.holdings.map(holding => holding.symbol || 'Unknown');
    const data = selectedPortfolio.holdings.map(holding => holding.totalValue || 0);
    const colors = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
      '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
    ];

    return {
      labels,
      datasets: [{
        data,
        backgroundColor: colors.slice(0, labels.length),
        hoverBackgroundColor: colors.slice(0, labels.length),
      }]
    };
  };

  const getPerformanceData = () => {
    if (!selectedPortfolio || !selectedPortfolio.holdings || selectedPortfolio.holdings.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }

    const labels = selectedPortfolio.holdings.map(holding => holding.symbol || 'Unknown');
    const gainLossData = selectedPortfolio.holdings.map(holding => holding.gainLoss || 0);

    return {
      labels,
      datasets: [{
        label: 'Gain/Loss ($)',
        data: gainLossData,
        backgroundColor: gainLossData.map(value => value >= 0 ? '#28a745' : '#dc3545'),
        borderColor: gainLossData.map(value => value >= 0 ? '#28a745' : '#dc3545'),
        borderWidth: 1,
      }]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: 'rgba(255, 255, 255, 0.8)',
          font: {
            size: 12,
            weight: '600'
          },
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 15
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 10,
        displayColors: true
      }
    },
    animation: {
      duration: 2000,
      easing: 'easeInOutQuart'
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  const cardHoverVariants = {
    hover: {
      scale: 1.02,
      transition: {
        duration: 0.2,
        ease: "easeInOut"
      }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div 
        variants={itemVariants}
        className="d-flex justify-content-between align-items-center mb-4"
      >
        <div className="d-flex align-items-center">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="me-3"
          >
            <PieChart size={32} className="text-primary" />
          </motion.div>
          <h2 className="mb-0">Portfolio Management</h2>
        </div>
        <div className="d-flex align-items-center">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="me-2"
          >
            <Button 
              variant="primary" 
              onClick={() => setShowCreateModal(true)}
              className="d-flex align-items-center"
            >
              <Plus size={16} className="me-2" />
              Create Portfolio
            </Button>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              variant="outline-secondary" 
              onClick={handleRetry}
              disabled={loading}
              className="d-flex align-items-center"
            >
              <motion.div
                animate={loading ? { rotate: 360 } : {}}
                transition={{ duration: 1, repeat: loading ? Infinity : 0, ease: "linear" }}
              >
                <Target size={16} className="me-2" />
              </motion.div>
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Error Display - Only show if there's an error and we've attempted to load */}
      <AnimatePresence>
        {error && hasAttemptedLoad && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <Alert variant="danger" onClose={() => setError(null)} dismissible className="d-flex align-items-center">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: 2 }}
                className="me-2"
              >
                <TrendingDown size={20} />
              </motion.div>
              <div className="flex-grow-1">
                <strong>Connection Error</strong>
                <br />
                <small>{error}</small>
              </div>
              {!isBackendAvailable && (
                <Button 
                  variant="outline-light" 
                  size="sm" 
                  onClick={handleRetry}
                  className="ms-2"
                >
                  Retry Connection
                </Button>
              )}
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backend Unavailable State - Show when backend is down */}
      {!isBackendAvailable && hasAttemptedLoad && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Row className="mb-4">
            <Col md={12}>
              <motion.div
                variants={cardHoverVariants}
                whileHover="hover"
              >
                <Card className="text-center py-5 border-warning">
                  <Card.Body>
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="mb-3"
                    >
                      <TrendingDown size={64} className="text-warning" />
                    </motion.div>
                    <h4 className="mb-3 text-warning">Backend Server Unavailable</h4>
                    <p className="text-muted mb-4">
                      The portfolio service is currently unavailable. Please ensure the backend server is running on port 8080.
                    </p>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button 
                        variant="warning" 
                        size="lg"
                        onClick={handleRetry}
                        className="d-flex align-items-center mx-auto"
                      >
                        <Target size={20} className="me-2" />
                        Retry Connection
                      </Button>
                    </motion.div>
                  </Card.Body>
                </Card>
              </motion.div>
            </Col>
          </Row>
        </motion.div>
      )}

      {/* Loading Indicator - Only show when actively loading */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Row className="mb-4">
              <Col md={12}>
                <motion.div
                  variants={cardHoverVariants}
                  whileHover="hover"
                >
                  <Card className="text-center py-5">
                    <Card.Body>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="mb-3"
                      >
                        <PieChart size={48} className="text-primary" />
                      </motion.div>
                      <h5 className="mb-2">Loading Portfolios...</h5>
                      <p className="text-muted">Please wait while we fetch your portfolio data</p>
                    </Card.Body>
                  </Card>
                </motion.div>
              </Col>
            </Row>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Portfolio Content - Only show when not loading and backend is available */}
      {!loading && isBackendAvailable && (
        <>
          {/* Portfolio Selection */}
          <motion.div variants={itemVariants}>
            <Row className="mb-4">
              <Col md={6}>
                <motion.div
                  variants={cardHoverVariants}
                  whileHover="hover"
                >
                  <Card>
                    <Card.Header className="d-flex align-items-center justify-content-between">
                      <h5 className="mb-0 d-flex align-items-center">
                        <Target size={20} className="me-2 text-primary" />
                        Select Portfolio
                      </h5>
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <BarChart3 size={20} className="text-info" />
                      </motion.div>
                    </Card.Header>
                    <Card.Body>
                      {portfolios.length > 0 ? (
                        <motion.div
                          whileHover={{ scale: 1.01 }}
                          whileFocus={{ scale: 1.01 }}
                        >
                          <Form.Select
                            value={selectedPortfolio?.id || ''}
                            onChange={(e) => {
                              const portfolio = portfolios.find(p => p.id === parseInt(e.target.value));
                              setSelectedPortfolio(portfolio);
                            }}
                          >
                            <option value="">Select a portfolio...</option>
                            {portfolios.map(portfolio => (
                              <option key={portfolio.id} value={portfolio.id}>
                                {portfolio.name}
                              </option>
                            ))}
                          </Form.Select>
                        </motion.div>
                      ) : (
                        <motion.div 
                          className="text-center py-4"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="mb-3"
                          >
                            <Target size={48} className="text-muted" style={{ opacity: 0.3 }} />
                          </motion.div>
                          <p className="text-muted mb-3">No portfolios yet</p>
                          <Button 
                            variant="primary" 
                            size="sm"
                            onClick={() => setShowCreateModal(true)}
                            className="d-flex align-items-center mx-auto"
                          >
                            <Plus size={16} className="me-2" />
                            Create Your First Portfolio
                          </Button>
                        </motion.div>
                      )}
                    </Card.Body>
                  </Card>
                </motion.div>
              </Col>

              <AnimatePresence>
                {selectedPortfolio && (
                  <Col md={6}>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, x: 50 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.9, x: 50 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      variants={cardHoverVariants}
                      whileHover="hover"
                    >
                      <Card className="portfolio-summary position-relative overflow-hidden">
                        <motion.div
                          className="position-absolute top-0 start-0 w-100"
                          style={{ height: '4px' }}
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ duration: 1, delay: 0.3 }}
                        >
                          <div style={{
                            height: '100%',
                            background: (selectedPortfolio.totalGainLoss || 0) >= 0 ? 
                              'linear-gradient(90deg, #48bb78, #38f9d7)' : 
                              'linear-gradient(90deg, #f56565, #fa709a)'
                          }} />
                        </motion.div>
                        <Card.Body>
                          <div className="d-flex align-items-center justify-content-between mb-3">
                            <h5 className="mb-0">{selectedPortfolio.name}</h5>
                            <motion.div
                              animate={{ rotate: [0, 360] }}
                              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                            >
                              <DollarSign size={20} className="text-success" />
                            </motion.div>
                          </div>
                          <Row>
                            <Col md={6}>
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                              >
                                <p className="mb-2">
                                  <strong className="text-white-50">Total Value:</strong><br />
                                  <motion.span 
                                    className="text-white fs-5 fw-bold"
                                    key={selectedPortfolio.totalValue}
                                    initial={{ scale: 1.1, color: '#4facfe' }}
                                    animate={{ scale: 1, color: 'white' }}
                                    transition={{ duration: 0.3 }}
                                  >
                                    ${selectedPortfolio.totalValue?.toFixed(2) || '0.00'}
                                  </motion.span>
                                </p>
                                <p className="mb-1">
                                  <strong className="text-white-50">Total Investment:</strong><br />
                                  <span className="text-white">
                                    ${selectedPortfolio.totalInvestment?.toFixed(2) || '0.00'}
                                  </span>
                                </p>
                              </motion.div>
                            </Col>
                            <Col md={6}>
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                              >
                                <p className="mb-2">
                                  <strong className="text-white-50">Total Gain/Loss:</strong><br />
                                  <motion.span 
                                    className={`fs-5 fw-bold d-flex align-items-center ${(selectedPortfolio.totalGainLoss || 0) >= 0 ? 'text-success' : 'text-danger'}`}
                                    initial={{ scale: 1.1 }}
                                    animate={{ scale: 1 }}
                                    transition={{ duration: 0.3 }}
                                  >
                                    {(selectedPortfolio.totalGainLoss || 0) >= 0 ? 
                                      <TrendingUp size={18} className="me-1" /> : 
                                      <TrendingDown size={18} className="me-1" />
                                    }
                                    ${selectedPortfolio.totalGainLoss?.toFixed(2) || '0.00'}
                                  </motion.span>
                                </p>
                                <p className="mb-1">
                                  <strong className="text-white-50">Return %:</strong><br />
                                  <motion.span 
                                    className={`fw-bold ${(selectedPortfolio.totalGainLossPercentage || 0) >= 0 ? 'text-success' : 'text-danger'}`}
                                    animate={{ scale: [1, 1.05, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                  >
                                    {selectedPortfolio.totalGainLossPercentage?.toFixed(2) || '0.00'}%
                                  </motion.span>
                                </p>
                              </motion.div>
                            </Col>
                          </Row>
                        </Card.Body>
                      </Card>
                    </motion.div>
                  </Col>
                )}
              </AnimatePresence>
            </Row>
          </motion.div>

          {/* Show message when no portfolios exist */}
          {portfolios.length === 0 && !loading && (
            <motion.div 
              variants={itemVariants}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Row>
                <Col md={12}>
                  <motion.div
                    variants={cardHoverVariants}
                    whileHover="hover"
                  >
                    <Card className="text-center py-5">
                      <Card.Body>
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="mb-4"
                        >
                          <PieChart size={64} className="text-primary" />
                        </motion.div>
                        <h4 className="mb-3">Welcome to Portfolio Management!</h4>
                        <p className="text-muted mb-4">
                          Create your first portfolio to start tracking your investments and analyzing performance.
                        </p>
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button 
                            variant="primary" 
                            size="lg"
                            onClick={() => setShowCreateModal(true)}
                            className="d-flex align-items-center mx-auto"
                          >
                            <Plus size={20} className="me-2" />
                            Create Your First Portfolio
                          </Button>
                        </motion.div>
                      </Card.Body>
                    </Card>
                  </motion.div>
                </Col>
              </Row>
            </motion.div>
          )}

          {selectedPortfolio && (
            <motion.div variants={itemVariants}>
              {/* Charts */}
              <Row className="mb-4">
                <Col md={6}>
                  <motion.div
                    variants={cardHoverVariants}
                    whileHover="hover"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <Card>
                      <Card.Header className="d-flex align-items-center justify-content-between">
                        <h5 className="mb-0 d-flex align-items-center">
                          <PieChart size={20} className="me-2 text-primary" />
                          Portfolio Allocation
                        </h5>
                        <motion.div
                          animate={{ rotate: [0, 360] }}
                          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                        >
                          <PieChart size={20} className="text-info" />
                        </motion.div>
                      </Card.Header>
                      <Card.Body>
                        <motion.div 
                          className="chart-container"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.8, delay: 0.4 }}
                        >
                          <AnimatePresence>
                            {getPortfolioAllocationData() ? (
                              <motion.div
                                initial={{ opacity: 0, rotate: -180 }}
                                animate={{ opacity: 1, rotate: 0 }}
                                exit={{ opacity: 0, rotate: 180 }}
                                transition={{ duration: 1 }}
                              >
                                <Doughnut data={getPortfolioAllocationData()} options={chartOptions} />
                              </motion.div>
                            ) : (
                              <motion.div 
                                className="text-center py-5"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                              >
                                <motion.div
                                  animate={{ scale: [1, 1.1, 1] }}
                                  transition={{ duration: 2, repeat: Infinity }}
                                  className="mb-3"
                                >
                                  <PieChart size={48} className="text-muted" style={{ opacity: 0.3 }} />
                                </motion.div>
                                <p className="text-muted">No holdings to display</p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      </Card.Body>
                    </Card>
                  </motion.div>
                </Col>

                <Col md={6}>
                  <motion.div
                    variants={cardHoverVariants}
                    whileHover="hover"
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  >
                    <Card>
                      <Card.Header className="d-flex align-items-center justify-content-between">
                        <h5 className="mb-0 d-flex align-items-center">
                          <BarChart3 size={20} className="me-2 text-success" />
                          Performance by Holding
                        </h5>
                        <motion.div
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <TrendingUp size={20} className="text-success" />
                        </motion.div>
                      </Card.Header>
                      <Card.Body>
                        <motion.div 
                          className="chart-container"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.8, delay: 0.6 }}
                        >
                          <AnimatePresence>
                            {getPerformanceData() ? (
                              <motion.div
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -50 }}
                                transition={{ duration: 0.8 }}
                              >
                                <Bar data={getPerformanceData()} options={chartOptions} />
                              </motion.div>
                            ) : (
                              <motion.div 
                                className="text-center py-5"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                              >
                                <motion.div
                                  animate={{ scale: [1, 1.1, 1] }}
                                  transition={{ duration: 2, repeat: Infinity }}
                                  className="mb-3"
                                >
                                  <BarChart3 size={48} className="text-muted" style={{ opacity: 0.3 }} />
                                </motion.div>
                                <p className="text-muted">No performance data</p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      </Card.Body>
                    </Card>
                  </motion.div>
                </Col>
              </Row>

              {/* Holdings Table */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <Row>
                  <Col md={12}>
                    <motion.div
                      variants={cardHoverVariants}
                      whileHover="hover"
                    >
                      <Card>
                        <Card.Header className="d-flex justify-content-between align-items-center">
                          <h5 className="mb-0 d-flex align-items-center">
                            <Target size={20} className="me-2 text-info" />
                            Holdings
                          </h5>
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Button 
                              variant="success" 
                              size="sm"
                              onClick={() => setShowAddHoldingModal(true)}
                              className="d-flex align-items-center"
                            >
                              <Plus size={14} className="me-1" />
                              Add Holding
                            </Button>
                          </motion.div>
                        </Card.Header>
                        <Card.Body>
                          <AnimatePresence>
                            {selectedPortfolio.holdings && selectedPortfolio.holdings.length > 0 ? (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                              >
                                <Table responsive hover>
                                  <thead>
                                    <tr>
                                      <th>Symbol</th>
                                      <th>Quantity</th>
                                      <th>Avg Price</th>
                                      <th>Current Price</th>
                                      <th>Total Value</th>
                                      <th>Gain/Loss</th>
                                      <th>Return %</th>
                                      <th>Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <AnimatePresence>
                                      {selectedPortfolio.holdings.map((holding, index) => (
                                        <motion.tr 
                                          key={holding.symbol || index}
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
                                            <motion.div
                                              animate={{ scale: [1, 1.2, 1] }}
                                              transition={{ duration: 2, repeat: Infinity, delay: index * 0.5 }}
                                              className="me-2"
                                            >
                                              <div style={{
                                                width: '8px',
                                                height: '8px',
                                                borderRadius: '50%',
                                                backgroundColor: holding.gainLoss >= 0 ? '#48bb78' : '#f56565'
                                              }} />
                                            </motion.div>
                                            <strong>{holding.symbol}</strong>
                                          </td>
                                          <td>
                                            <span className="badge bg-secondary">{holding.quantity}</span>
                                          </td>
                                          <td>${holding.averagePrice?.toFixed(2)}</td>
                                          <td>
                                            <motion.span
                                              key={holding.currentPrice}
                                              initial={{ scale: 1.1, color: '#4facfe' }}
                                              animate={{ scale: 1, color: 'rgba(255, 255, 255, 0.8)' }}
                                              transition={{ duration: 0.3 }}
                                            >
                                              ${holding.currentPrice?.toFixed(2)}
                                            </motion.span>
                                          </td>
                                          <td>
                                            <motion.span
                                              className="fw-bold"
                                              animate={{ scale: [1, 1.02, 1] }}
                                              transition={{ duration: 1.5, repeat: Infinity }}
                                            >
                                              ${holding.totalValue?.toFixed(2)}
                                            </motion.span>
                                          </td>
                                          <td className={`d-flex align-items-center ${(holding.gainLoss || 0) >= 0 ? 'price-positive' : 'price-negative'}`}>
                                            {(holding.gainLoss || 0) >= 0 ? 
                                              <TrendingUp size={14} className="me-1" /> : 
                                              <TrendingDown size={14} className="me-1" />
                                            }
                                            {(holding.gainLoss || 0) >= 0 ? '+' : ''}${holding.gainLoss?.toFixed(2) || '0.00'}
                                          </td>
                                          <td className={(holding.gainLossPercentage || 0) >= 0 ? 'price-positive' : 'price-negative'}>
                                            <motion.span
                                              animate={{ scale: [1, 1.05, 1] }}
                                              transition={{ duration: 2, repeat: Infinity }}
                                            >
                                              {(holding.gainLossPercentage || 0) >= 0 ? '+' : ''}{holding.gainLossPercentage?.toFixed(2) || '0.00'}%
                                            </motion.span>
                                          </td>
                                          <td>
                                            <motion.div
                                              whileHover={{ scale: 1.05 }}
                                              whileTap={{ scale: 0.95 }}
                                            >
                                              <Button 
                                                variant="outline-danger" 
                                                size="sm"
                                                onClick={() => handleRemoveHolding(holding.symbol)}
                                                className="d-flex align-items-center"
                                              >
                                                <Trash2 size={12} className="me-1" />
                                                Remove
                                              </Button>
                                            </motion.div>
                                          </td>
                                        </motion.tr>
                                      ))}
                                    </AnimatePresence>
                                  </tbody>
                                </Table>
                              </motion.div>
                            ) : (
                              <motion.div 
                                className="text-center py-5"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                              >
                                <motion.div
                                  animate={{ scale: [1, 1.1, 1] }}
                                  transition={{ duration: 2, repeat: Infinity }}
                                  className="mb-3"
                                >
                                  <Target size={48} className="text-muted" style={{ opacity: 0.3 }} />
                                </motion.div>
                                <p className="text-muted">No holdings in this portfolio</p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </Card.Body>
                      </Card>
                    </motion.div>
                  </Col>
                </Row>
              </motion.div>
            </motion.div>
          )}
        </>
      )}

      {/* Create Portfolio Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create New Portfolio</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Portfolio Name</Form.Label>
            <Form.Control
              type="text"
              value={newPortfolioName}
              onChange={(e) => setNewPortfolioName(e.target.value)}
              placeholder="Enter portfolio name"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleCreatePortfolio}>
            Create Portfolio
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add Holding Modal */}
      <Modal show={showAddHoldingModal} onHide={() => setShowAddHoldingModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Holding</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Stock Symbol</Form.Label>
            <Form.Control
              type="text"
              value={newHolding.symbol}
              onChange={(e) => setNewHolding({...newHolding, symbol: e.target.value})}
              placeholder="e.g., AAPL"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Quantity</Form.Label>
            <Form.Control
              type="number"
              value={newHolding.quantity}
              onChange={(e) => setNewHolding({...newHolding, quantity: e.target.value})}
              placeholder="Number of shares"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Average Price</Form.Label>
            <Form.Control
              type="number"
              step="0.01"
              value={newHolding.averagePrice}
              onChange={(e) => setNewHolding({...newHolding, averagePrice: e.target.value})}
              placeholder="Price per share"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddHoldingModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAddHolding}>
            Add Holding
          </Button>
        </Modal.Footer>
      </Modal>
    </motion.div>
  );
};

export default Portfolio;
