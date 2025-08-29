import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

class WebSocketService {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  connect(onStockUpdate, onConnect, onDisconnect) {
    const socket = new SockJS('http://localhost:8080/api/ws');
    
    this.client = new Client({
      webSocketFactory: () => socket,
      connectHeaders: {},
      debug: (str) => {
        console.log('WebSocket Debug:', str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.client.onConnect = (frame) => {
      console.log('Connected to WebSocket:', frame);
      this.isConnected = true;
      
      // Subscribe to stock updates
      this.client.subscribe('/topic/stock-updates', (message) => {
        try {
          const stockData = JSON.parse(message.body);
          onStockUpdate(stockData);
        } catch (error) {
          console.error('Error parsing stock update:', error);
        }
      });

      // Subscribe to portfolio updates
      this.client.subscribe('/topic/portfolio-updates', (message) => {
        console.log('Portfolio update received:', message.body);
      });

      // Subscribe to market alerts
      this.client.subscribe('/topic/market-alerts', (message) => {
        console.log('Market alert:', message.body);
      });

      if (onConnect) onConnect();
    };

    this.client.onStompError = (frame) => {
      console.error('Broker reported error:', frame.headers['message']);
      console.error('Additional details:', frame.body);
      this.isConnected = false;
      if (onDisconnect) onDisconnect();
    };

    this.client.onWebSocketClose = (event) => {
      console.log('WebSocket connection closed:', event);
      this.isConnected = false;
      if (onDisconnect) onDisconnect();
    };

    this.client.activate();
  }

  disconnect() {
    if (this.client && this.isConnected) {
      this.client.deactivate();
      this.isConnected = false;
      console.log('WebSocket disconnected');
    }
  }

  sendMessage(destination, message) {
    if (this.client && this.isConnected) {
      this.client.publish({
        destination: destination,
        body: JSON.stringify(message)
      });
    }
  }
}

export default WebSocketService;
