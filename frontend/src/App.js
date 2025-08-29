import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import { motion } from 'framer-motion';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import StockAnalysis from './components/StockAnalysis';
import Portfolio from './components/Portfolio';
import Predictions from './components/Predictions';
import SentimentAnalysis from './components/SentimentAnalysis';
import WebSocketService from './services/WebSocketService';
import './App.css';

function App() {
  const [stockUpdates, setStockUpdates] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const wsService = new WebSocketService();
    
    wsService.connect(
      (stockData) => {
        setStockUpdates(prev => {
          const updated = [...prev];
          const existingIndex = updated.findIndex(stock => stock.symbol === stockData.symbol);
          
          if (existingIndex >= 0) {
            updated[existingIndex] = stockData;
          } else {
            updated.push(stockData);
          }
          
          return updated.slice(-50); // Keep only last 50 updates
        });
      },
      () => setIsConnected(true),
      () => setIsConnected(false)
    );

    return () => {
      wsService.disconnect();
    };
  }, []);

  return (
    <Router>
      <div className="App app-container">
        {/* Floating particle background */}
        <div className="floating-particles">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="particle-bg"
              animate={{
                x: [0, 100, 0],
                y: [0, -50, 0],
                scale: [0.5, 1.2, 0.5],
                opacity: [0.2, 0.6, 0.2]
              }}
              transition={{
                duration: 8 + i * 2,
                repeat: Infinity,
                delay: i * 1.5,
                ease: "easeInOut"
              }}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${20 + Math.random() * 40}px`,
                height: `${20 + Math.random() * 40}px`
              }}
            />
          ))}
        </div>
        
        <Container fluid style={{ position: 'relative', zIndex: 1 }}>
          <Row>
            <Col md={2} className="p-0">
              <Sidebar isConnected={isConnected} />
            </Col>
            <Col md={10} className="main-content">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route 
                    path="/dashboard" 
                    element={<Dashboard stockUpdates={stockUpdates} />} 
                  />
                  <Route 
                    path="/stocks" 
                    element={<StockAnalysis stockUpdates={stockUpdates} />} 
                  />
                  <Route path="/portfolio" element={<Portfolio />} />
                  <Route path="/predictions" element={<Predictions />} />
                  <Route path="/sentiment" element={<SentimentAnalysis />} />
                </Routes>
              </motion.div>
            </Col>
          </Row>
        </Container>
      </div>
    </Router>
  );
}

export default App;
