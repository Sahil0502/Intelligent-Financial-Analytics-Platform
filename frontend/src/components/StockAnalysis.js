import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Card, Form, Button, Table, Alert } from 'react-bootstrap';
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
} from 'chart.js';
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
  Legend
);

const StockAnalysis = ({ stockUpdates }) => {
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [historicalData, setHistoricalData] = useState([]);
  const [currentStock, setCurrentStock] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadStockData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load current stock data
      const currentData = await ApiService.getLatestStockData(selectedSymbol);
      setCurrentStock(currentData);

      // Load historical data (last 30 days)
      const historical = await ApiService.getRecentData(selectedSymbol, 30);
      setHistoricalData(historical); // Data is already ordered correctly from backend

    } catch (error) {
      console.error('Error loading stock data:', error);
      setError(error.response?.data?.message || 'Failed to load stock data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedSymbol]);

  useEffect(() => {
    if (selectedSymbol) {
      loadStockData();
    }
  }, [selectedSymbol, loadStockData]);

  const handleSymbolChange = (e) => {
    const symbol = e.target.value.toUpperCase();
    // Basic validation for stock symbol format
    if (/^[A-Z]{1,5}$/.test(symbol)) {
      setSelectedSymbol(symbol);
      setError(null);
    } else {
      setError('Invalid stock symbol. Please enter 1-5 uppercase letters.');
    }
  };

  const handleQuoteRefresh = async () => {
    try {
      setLoading(true);
      const quote = await ApiService.getStockQuote(selectedSymbol);
      setCurrentStock(quote);
    } catch (error) {
      setError('Failed to fetch latest quote');
    } finally {
      setLoading(false);
    }
  };

  const getPriceChartData = () => {
    return {
      labels: historicalData.map(data => moment(data.timestamp).format('MM/DD')),
      datasets: [
        {
          label: 'Close Price',
          data: historicalData.map(data => data.currentPrice),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1,
        },
        {
          label: 'High',
          data: historicalData.map(data => data.highPrice),
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          tension: 0.1,
        },
        {
          label: 'Low',
          data: historicalData.map(data => data.lowPrice),
          borderColor: 'rgb(54, 162, 235)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          tension: 0.1,
        },
      ],
    };
  };

  const getVolumeChartData = () => {
    return {
      labels: historicalData.map(data => moment(data.timestamp).format('MM/DD')),
      datasets: [
        {
          label: 'Volume',
          data: historicalData.map(data => data.volume),
          backgroundColor: 'rgba(153, 102, 255, 0.6)',
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 1,
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
    },
    scales: {
      y: {
        beginAtZero: false,
      },
    },
  };

  return (
    <div>
      <h2 className="mb-4">Stock Analysis</h2>

      {/* Stock Selection */}
      <Row className="mb-4">
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5>Stock Selection</h5>
            </Card.Header>
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Label>Enter Stock Symbol</Form.Label>
                <div className="d-flex">
                  <Form.Control
                    type="text"
                    value={selectedSymbol}
                    onChange={handleSymbolChange}
                    placeholder="e.g., AAPL, GOOGL, MSFT"
                    className="me-2"
                  />
                  <Button 
                    variant="primary" 
                    onClick={handleQuoteRefresh}
                    disabled={loading}
                  >
                    {loading ? 'Loading...' : 'Get Quote'}
                  </Button>
                </div>
              </Form.Group>
            </Card.Body>
          </Card>
        </Col>

        {/* Current Stock Info */}
        <Col md={6}>
          {currentStock && (
            <Card className="stock-card">
              <Card.Header>
                <h5>{selectedSymbol} - Current Quote</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <h3>${currentStock.currentPrice?.toFixed(2)}</h3>
                    <p className={currentStock.change >= 0 ? 'price-positive' : 'price-negative'}>
                      {currentStock.change >= 0 ? '+' : ''}${currentStock.change?.toFixed(2)} 
                      ({currentStock.changePercent >= 0 ? '+' : ''}{currentStock.changePercent?.toFixed(2)}%)
                    </p>
                  </Col>
                  <Col md={6}>
                    <p><small>Open: ${currentStock.openPrice?.toFixed(2)}</small></p>
                    <p><small>High: ${currentStock.highPrice?.toFixed(2)}</small></p>
                    <p><small>Low: ${currentStock.lowPrice?.toFixed(2)}</small></p>
                    <p><small>Prev Close: ${currentStock.previousClose?.toFixed(2)}</small></p>
                  </Col>
                </Row>
                <small className="text-muted">
                  Last updated: {moment(currentStock.timestamp).format('YYYY-MM-DD HH:mm:ss')}
                </small>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      {/* Price Chart */}
      <Row className="mb-4">
        <Col md={12}>
          <Card>
            <Card.Header>
              <h5>{selectedSymbol} - Price History (30 Days)</h5>
            </Card.Header>
            <Card.Body>
              <div className="chart-container">
                {historicalData.length > 0 ? (
                  <Line data={getPriceChartData()} options={chartOptions} />
                ) : (
                  <div className="text-center py-5">
                    <p>No historical data available</p>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Volume Chart */}
      <Row className="mb-4">
        <Col md={12}>
          <Card>
            <Card.Header>
              <h5>{selectedSymbol} - Volume History</h5>
            </Card.Header>
            <Card.Body>
              <div className="chart-container">
                {historicalData.length > 0 ? (
                  <Bar data={getVolumeChartData()} options={chartOptions} />
                ) : (
                  <div className="text-center py-5">
                    <p>No volume data available</p>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Historical Data Table */}
      <Row>
        <Col md={12}>
          <Card>
            <Card.Header>
              <h5>Historical Data</h5>
            </Card.Header>
            <Card.Body>
              {historicalData.length > 0 ? (
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <Table responsive striped hover>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Open</th>
                        <th>High</th>
                        <th>Low</th>
                        <th>Close</th>
                        <th>Change</th>
                        <th>Change %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historicalData.slice().reverse().map((data, index) => (
                        <tr key={index}>
                          <td>{moment(data.timestamp).format('YYYY-MM-DD')}</td>
                          <td>${data.openPrice?.toFixed(2)}</td>
                          <td>${data.highPrice?.toFixed(2)}</td>
                          <td>${data.lowPrice?.toFixed(2)}</td>
                          <td>${data.currentPrice?.toFixed(2)}</td>
                          <td className={data.change >= 0 ? 'price-positive' : 'price-negative'}>
                            {data.change >= 0 ? '+' : ''}${data.change?.toFixed(2)}
                          </td>
                          <td className={data.changePercent >= 0 ? 'price-positive' : 'price-negative'}>
                            {data.changePercent >= 0 ? '+' : ''}{data.changePercent?.toFixed(2)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <p className="text-center py-3">No historical data available</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default StockAnalysis;
