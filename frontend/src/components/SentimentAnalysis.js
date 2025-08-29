import React, { useState } from 'react';
import { Row, Col, Card, Form, Button, Alert, Table, Badge } from 'react-bootstrap';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import ApiService from '../services/ApiService';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const SentimentAnalysis = () => {
  const [textInput, setTextInput] = useState('');
  const [headlinesInput, setHeadlinesInput] = useState('');
  const [sentimentResult, setSentimentResult] = useState(null);
  const [marketSentiment, setMarketSentiment] = useState(null);
  const [sentimentHistory, setSentimentHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAnalyzeSentiment = async () => {
    if (!textInput.trim()) return;

    try {
      setLoading(true);
      setError(null);

      const result = await ApiService.analyzeSentiment(textInput);
      setSentimentResult(result);

      // Add to history
      setSentimentHistory(prev => [
        {
          text: textInput.substring(0, 100) + (textInput.length > 100 ? '...' : ''),
          result: result,
          timestamp: new Date()
        },
        ...prev.slice(0, 9) // Keep only last 10 results
      ]);

      setTextInput('');
    } catch (error) {
      setError('Failed to analyze sentiment');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeMarketSentiment = async () => {
    if (!headlinesInput.trim()) return;

    try {
      setLoading(true);
      setError(null);

      const headlines = headlinesInput.split('\n').filter(line => line.trim());
      const result = await ApiService.analyzeMarketSentiment(headlines);
      setMarketSentiment({
        score: result,
        headlines: headlines,
        timestamp: new Date()
      });

      setHeadlinesInput('');
    } catch (error) {
      setError('Failed to analyze market sentiment');
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = (label) => {
    switch (label) {
      case 'VERY_POSITIVE': return 'success';
      case 'POSITIVE': return 'success';
      case 'NEUTRAL': return 'secondary';
      case 'NEGATIVE': return 'danger';
      case 'VERY_NEGATIVE': return 'danger';
      default: return 'secondary';
    }
  };

  const getSentimentHistoryChart = () => {
    if (sentimentHistory.length === 0) return null;

    const labels = sentimentHistory.slice().reverse().map((_, index) => `Analysis ${index + 1}`);
    const data = sentimentHistory.slice().reverse().map(item => item.result.score);

    return {
      labels,
      datasets: [{
        label: 'Sentiment Score',
        data,
        backgroundColor: data.map(score => {
          if (score > 0.3) return 'rgba(40, 167, 69, 0.6)';
          if (score < -0.3) return 'rgba(220, 53, 69, 0.6)';
          return 'rgba(108, 117, 125, 0.6)';
        }),
        borderColor: data.map(score => {
          if (score > 0.3) return 'rgba(40, 167, 69, 1)';
          if (score < -0.3) return 'rgba(220, 53, 69, 1)';
          return 'rgba(108, 117, 125, 1)';
        }),
        borderWidth: 1,
      }]
    };
  };

  const getMarketSentimentChart = () => {
    if (!marketSentiment) return null;

    const score = marketSentiment.score;
    const positive = Math.max(0, score);
    const negative = Math.abs(Math.min(0, score));
    const neutral = 1 - positive - negative;

    return {
      labels: ['Positive', 'Neutral', 'Negative'],
      datasets: [{
        data: [positive, neutral, negative],
        backgroundColor: [
          'rgba(40, 167, 69, 0.6)',
          'rgba(108, 117, 125, 0.6)',
          'rgba(220, 53, 69, 0.6)'
        ],
        borderColor: [
          'rgba(40, 167, 69, 1)',
          'rgba(108, 117, 125, 1)',
          'rgba(220, 53, 69, 1)'
        ],
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
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        min: -1,
        max: 1,
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  return (
    <div>
      <h2 className="mb-4">Sentiment Analysis</h2>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      {/* Text Sentiment Analysis */}
      <Row className="mb-4">
        <Col md={8}>
          <Card>
            <Card.Header>
              <h5>Text Sentiment Analysis</h5>
            </Card.Header>
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Label>Enter text to analyze</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Enter news article, social media post, or any text related to stocks or market..."
                />
              </Form.Group>
              <Button 
                variant="primary" 
                onClick={handleAnalyzeSentiment}
                disabled={loading || !textInput.trim()}
              >
                {loading ? 'Analyzing...' : 'Analyze Sentiment'}
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          {sentimentResult && (
            <Card>
              <Card.Header>
                <h5>Sentiment Result</h5>
              </Card.Header>
              <Card.Body>
                <div className="text-center">
                  <h3>
                    <Badge bg={getSentimentColor(sentimentResult.label)}>
                      {sentimentResult.label.replace('_', ' ')}
                    </Badge>
                  </h3>
                  <p className="mb-2">
                    <strong>Score:</strong> {sentimentResult.score.toFixed(3)}
                  </p>
                  <p className="mb-0">
                    <small className="text-muted">
                      Range: -1 (Very Negative) to +1 (Very Positive)
                    </small>
                  </p>
                </div>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>

      {/* Market Sentiment Analysis */}
      <Row className="mb-4">
        <Col md={8}>
          <Card>
            <Card.Header>
              <h5>Market Sentiment Analysis</h5>
            </Card.Header>
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Label>Enter news headlines (one per line)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={6}
                  value={headlinesInput}
                  onChange={(e) => setHeadlinesInput(e.target.value)}
                  placeholder={`Apple reports record quarterly earnings
Tesla stock surges on new model announcement
Market volatility increases amid economic uncertainty
Tech stocks rally on positive outlook
Federal Reserve considers interest rate changes`}
                />
              </Form.Group>
              <Button 
                variant="success" 
                onClick={handleAnalyzeMarketSentiment}
                disabled={loading || !headlinesInput.trim()}
              >
                {loading ? 'Analyzing...' : 'Analyze Market Sentiment'}
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          {marketSentiment && (
            <Card>
              <Card.Header>
                <h5>Market Sentiment</h5>
              </Card.Header>
              <Card.Body>
                <div className="text-center">
                  <h3 className={marketSentiment.score > 0 ? 'text-success' : marketSentiment.score < 0 ? 'text-danger' : 'text-secondary'}>
                    {marketSentiment.score > 0.2 ? 'BULLISH' : 
                     marketSentiment.score < -0.2 ? 'BEARISH' : 'NEUTRAL'}
                  </h3>
                  <p className="mb-2">
                    <strong>Score:</strong> {marketSentiment.score.toFixed(3)}
                  </p>
                  <p className="mb-0">
                    <small className="text-muted">
                      Based on {marketSentiment.headlines.length} headlines
                    </small>
                  </p>
                </div>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>

      {/* Charts */}
      <Row className="mb-4">
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5>Sentiment History</h5>
            </Card.Header>
            <Card.Body>
              <div className="chart-container">
                {sentimentHistory.length > 0 ? (
                  <Bar data={getSentimentHistoryChart()} options={chartOptions} />
                ) : (
                  <div className="text-center py-5">
                    <p>No sentiment analysis history yet</p>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card>
            <Card.Header>
              <h5>Market Sentiment Distribution</h5>
            </Card.Header>
            <Card.Body>
              <div className="chart-container">
                {marketSentiment ? (
                  <Doughnut data={getMarketSentimentChart()} options={doughnutOptions} />
                ) : (
                  <div className="text-center py-5">
                    <p>No market sentiment data yet</p>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Sentiment History Table */}
      {sentimentHistory.length > 0 && (
        <Row>
          <Col md={12}>
            <Card>
              <Card.Header>
                <h5>Analysis History</h5>
              </Card.Header>
              <Card.Body>
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Text Preview</th>
                      <th>Sentiment</th>
                      <th>Score</th>
                      <th>Analyzed At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sentimentHistory.map((item, index) => (
                      <tr key={index}>
                        <td>{item.text}</td>
                        <td>
                          <Badge bg={getSentimentColor(item.result.label)}>
                            {item.result.label.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className={item.result.score > 0 ? 'text-success' : item.result.score < 0 ? 'text-danger' : 'text-secondary'}>
                          {item.result.score.toFixed(3)}
                        </td>
                        <td>{item.timestamp.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Information Panel */}
      <Row className="mt-4">
        <Col md={12}>
          <Card>
            <Card.Header>
              <h5>About Sentiment Analysis</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <h6>How it works:</h6>
                  <ul>
                    <li>Uses Stanford CoreNLP for natural language processing</li>
                    <li>Analyzes text for emotional tone and opinion</li>
                    <li>Scores range from -1 (very negative) to +1 (very positive)</li>
                    <li>Market sentiment aggregates multiple news headlines</li>
                  </ul>
                </Col>
                <Col md={6}>
                  <h6>Use cases:</h6>
                  <ul>
                    <li>Analyze news articles about specific stocks</li>
                    <li>Gauge market sentiment from social media</li>
                    <li>Assess overall market mood from headlines</li>
                    <li>Support investment decision making</li>
                  </ul>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default SentimentAnalysis;
