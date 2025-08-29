import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge } from 'react-bootstrap';
import { Line } from 'react-chartjs-2';
import moment from 'moment';
import ApiService from '../services/ApiService';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  PieChart,
  BarChart3
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import './Dashboard.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = ({ stockUpdates }) => {
  const [marketOverview, setMarketOverview] = useState([]);
  const [portfolioSummary, setPortfolioSummary] = useState(null);
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);

  // Animation variants
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
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  const cardHoverVariants = {
    hover: {
      scale: 1.02,
      boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
      transition: { duration: 0.2 }
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load recent stock updates
      const recentUpdates = await ApiService.getRecentUpdates(24);
      setMarketOverview(recentUpdates.slice(0, 10));
      
      // Load portfolios
      const portfolioData = await ApiService.getAllPortfolios();
      setPortfolios(portfolioData);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getChartData = () => {
    const last24Hours = stockUpdates.slice(-24);
    
    return {
      labels: last24Hours.map(update => moment(update.timestamp).format('HH:mm')),
      datasets: [
        {
          label: 'Market Activity',
          data: last24Hours.map(update => update.currentPrice),
          borderColor: 'rgba(0, 0, 0, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Real-time Market Activity',
      },
    },
    scales: {
      y: {
        beginAtZero: false,
      },
    },
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <h2 className="mb-4">Financial Analytics Dashboard</h2>
      
      {/* Market Overview Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="metric-card">
            <Card.Body>
              <h6 className="text-muted">Active Stocks</h6>
              <h3 className="text-primary">{marketOverview.length}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="metric-card">
            <Card.Body>
              <h6 className="text-muted">Portfolios</h6>
              <h3 className="text-success">{portfolios.length}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="metric-card">
            <Card.Body>
              <h6 className="text-muted">Live Updates</h6>
              <h3 className="text-info">{stockUpdates.length}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="metric-card">
            <Card.Body>
              <h6 className="text-muted">Market Status</h6>
              <h3 className="text-warning">Active</h3>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Real-time Chart */}
      <Row className="mb-4">
        <Col md={12}>
          <Card>
            <Card.Header>
              <h5>Real-time Market Activity</h5>
            </Card.Header>
            <Card.Body>
              <div className="chart-container">
                {stockUpdates.length > 0 ? (
                  <Line data={getChartData()} options={chartOptions} />
                ) : (
                  <div className="text-center py-5">
                    <p>Waiting for real-time data...</p>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Market Overview Table */}
      <Row className="mb-4">
        <Col md={8}>
          <Card className="market-overview-card">
            <Card.Header>
              <h5 className="mb-0">Market Overview</h5>
            </Card.Header>
            <Card.Body className="p-0">
              <Table responsive hover className="market-overview-table mb-0">
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Current Price</th>
                    <th>Change</th>
                    <th>Change %</th>
                    <th>Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {marketOverview.map((stock, index) => (
                    <tr key={index}>
                      <td className="symbol-cell">{stock.symbol}</td>
                      <td className="price-cell">${stock.currentPrice?.toFixed(2)}</td>
                      <td className={stock.change >= 0 ? 'price-positive' : 'price-negative'}>
                        {stock.change >= 0 ? '+' : ''}${stock.change?.toFixed(2)}
                      </td>
                      <td className={stock.changePercent >= 0 ? 'price-positive' : 'price-negative'}>
                        {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent?.toFixed(2)}%
                      </td>
                      <td className="timestamp-cell">{moment(stock.timestamp).fromNow()}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
        
          {/* Portfolio Summary */}
          <Col md={4}>
            <motion.div
              variants={cardHoverVariants}
              whileHover="hover"
            >
              <Card>
                <Card.Header className="d-flex align-items-center justify-content-between">
                  <h5 className="mb-0">Portfolio Summary</h5>
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  >
                    <PieChart size={20} className="text-info" />
                  </motion.div>
                </Card.Header>
                <Card.Body>
                  <AnimatePresence>
                    {portfolios.length > 0 ? (
                      portfolios.map((portfolio, index) => (
                        <motion.div 
                          key={portfolio.id || index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ delay: index * 0.1 }}
                          className="mb-3 p-3 border rounded position-relative overflow-hidden"
                          style={{ 
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            background: 'rgba(255, 255, 255, 0.05)'
                          }}
                          whileHover={{ 
                            scale: 1.02,
                            backgroundColor: 'rgba(255, 255, 255, 0.08)'
                          }}
                        >
                          <motion.div
                            className="position-absolute top-0 start-0 w-100"
                            style={{ height: '3px' }}
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ delay: index * 0.2, duration: 0.8 }}
                          >
                            <div 
                              style={{
                                height: '100%',
                                background: portfolio.totalValue >= portfolio.totalInvestment ? 
                                  'linear-gradient(90deg, #48bb78, #38f9d7)' : 
                                  'linear-gradient(90deg, #f56565, #fa709a)'
                              }}
                            />
                          </motion.div>
                          <h6 className="text-white mb-2">{portfolio.name}</h6>
                          <p className="mb-1 text-white-50">
                            <small>Total Value: </small>
                            <motion.strong 
                              className="text-white"
                              key={portfolio.totalValue}
                              initial={{ scale: 1.1 }}
                              animate={{ scale: 1 }}
                              transition={{ duration: 0.3 }}
                            >
                              ${portfolio.totalValue?.toFixed(2)}
                            </motion.strong>
                          </p>
                          <p className="mb-2 text-white-50">
                            <small>Total Investment: </small>
                            <span className="text-white">${portfolio.totalInvestment?.toFixed(2)}</span>
                          </p>
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: index * 0.3, type: "spring" }}
                          >
                            <Badge 
                              bg={portfolio.totalValue >= portfolio.totalInvestment ? 'success' : 'danger'}
                              className="d-flex align-items-center justify-content-center"
                              style={{ width: 'fit-content' }}
                            >
                              {portfolio.totalValue >= portfolio.totalInvestment ? 
                                <><TrendingUp size={14} className="me-1" />Profit</> : 
                                <><TrendingDown size={14} className="me-1" />Loss</>
                              }
                            </Badge>
                          </motion.div>
                        </motion.div>
                      ))
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-4"
                      >
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="mb-3"
                        >
                          <PieChart size={48} className="text-muted" style={{ opacity: 0.3 }} />
                        </motion.div>
                        <p className="text-muted">No portfolios created yet.</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card.Body>
              </Card>
            </motion.div>
          </Col>
      </Row>

      {/* Recent Live Updates */}
      <motion.div variants={itemVariants}>
        <Row>
          <Col md={12}>
            <motion.div variants={cardHoverVariants} whileHover="hover">
              <Card>
                <Card.Header className="d-flex align-items-center justify-content-between">
                  <h5 className="mb-0">Recent Live Updates</h5>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}>
                    <Activity size={20} className="text-success" />
                  </motion.div>
                </Card.Header>
                <Card.Body>
                  <AnimatePresence>
                    {stockUpdates.length > 0 ? (
                      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {stockUpdates.slice(-10).reverse().map((update, index) => (
                          <motion.div 
                            key={`${update.symbol}-${update.timestamp}`}
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 50 }}
                            transition={{ delay: index * 0.05 }}
                            className="d-flex justify-content-between align-items-center py-2 border-bottom"
                            style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
                            whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', scale: 1.01 }}
                          >
                            <div className="d-flex align-items-center">
                              <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
                                className="me-2"
                              >
                                <div style={{
                                  width: '8px',
                                  height: '8px',
                                  borderRadius: '50%',
                                  backgroundColor: update.change >= 0 ? '#48bb78' : '#f56565'
                                }} />
                              </motion.div>
                              <div>
                                <strong className="text-white">{update.symbol}</strong>
                                <motion.span 
                                  className="ms-2 text-white-50"
                                  key={update.currentPrice}
                                  initial={{ color: '#4facfe' }}
                                  animate={{ color: 'rgba(255, 255, 255, 0.5)' }}
                                  transition={{ duration: 0.5 }}
                                >
                                  ${update.currentPrice?.toFixed(2)}
                                </motion.span>
                              </div>
                            </div>
                            <div className="text-end">
                              <motion.span 
                                className={`d-flex align-items-center ${update.change >= 0 ? 'price-positive' : 'price-negative'}`}
                                initial={{ scale: 1.1 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 0.3 }}
                              >
                                {update.change >= 0 ? <TrendingUp size={14} className="me-1" /> : <TrendingDown size={14} className="me-1" />}
                                {update.change >= 0 ? '+' : ''}{update.changePercent?.toFixed(2)}%
                              </motion.span>
                              <small className="text-muted d-block">
                                {moment(update.timestamp).format('HH:mm:ss')}
                              </small>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <motion.div 
                        className="text-center py-5"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="mb-3">
                          <Activity size={48} className="text-muted" style={{ opacity: 0.3 }} />
                        </motion.div>
                        <p className="text-muted">No live updates yet. Waiting for data...</p>
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
  );
};

export default Dashboard;