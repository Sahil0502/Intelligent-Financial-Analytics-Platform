# 🏦 Intelligent Financial Analytics Platform

A comprehensive real-time financial analytics platform built with **Spring Boot**, **React**, and **machine learning** capabilities for stock market analysis, portfolio management, and predictive analytics.

[![Java](https://img.shields.io/badge/Java-17-orange.svg)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.1.5-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 🌟 Project Highlights

> **Perfect for demonstrating full-stack development skills, real-time systems, and financial technology expertise**

- **Real-time Financial Data Processing** with WebSocket streaming
- **Machine Learning Integration** using LSTM neural networks for price prediction
- **Modern Full-Stack Architecture** with Spring Boot + React
- **Professional UI/UX Design** with responsive layout and smooth animations
- **Enterprise-Grade Features** including API rate limiting, database management, and error handling

## 🚀 Key Features

### 📊 **Real-Time Analytics**
- Live stock market data streaming via WebSocket
- Interactive charts and visualizations using Chart.js
- Real-time portfolio valuation and performance tracking
- Market sentiment analysis with Stanford CoreNLP

### 🤖 **Machine Learning**
- LSTM neural networks for stock price prediction
- Sentiment analysis for market news and social media
- Historical pattern recognition and trend analysis
- Prediction accuracy scoring and model validation

### 💼 **Portfolio Management**
- Multi-portfolio creation and management
- Real-time asset allocation tracking
- Performance analytics with risk assessment
- Automated portfolio rebalancing suggestions

### 🔄 **Live Data Integration**
- Finnhub API integration for real-time market data
- WebSocket-based live updates across all clients
- Automated data fetching with scheduled jobs
- Rate-limited API calls for optimal performance

## 🛠️ Technology Stack

### **Backend Architecture**
```
Spring Boot 3.1.5 + Java 17
├── Spring Data JPA (Database Layer)
├── Spring WebSocket (Real-time Communication)
├── Spring Security (Authentication & Authorization)
├── Quartz Scheduler (Automated Jobs)
├── Stanford CoreNLP (Natural Language Processing)
└── Maven (Dependency Management)
```

### **Frontend Architecture**
```
React 18 + Modern JavaScript
├── React Router (Navigation)
├── Chart.js (Data Visualization)
├── Framer Motion (Animations)
├── Bootstrap 5 (Responsive Design)
├── Axios (HTTP Client)
└── WebSocket Client (Real-time Updates)
```

### **Data & APIs**
- **Database**: H2 (Development) / PostgreSQL (Production)
- **External APIs**: Finnhub (Market Data), News APIs
- **Real-time**: WebSocket streaming for live updates
- **ML Libraries**: Custom LSTM implementation for predictions

## 📱 Live Demo

### Dashboard Overview
- **Real-time Market Data**: Live stock prices, market indices, and trading volumes
- **Portfolio Analytics**: Performance metrics, asset allocation, and P&L tracking
- **Interactive Charts**: Candlestick, line charts, and technical indicators
- **News Sentiment**: Real-time sentiment analysis of market news

### Key Screens
1. **Dashboard** - Overview of markets and portfolios
2. **Stock Analysis** - Detailed stock research with charts and predictions
3. **Portfolio Manager** - Portfolio creation and management tools
4. **Predictions** - ML-powered price forecasting
5. **Sentiment Analysis** - Market sentiment tracking

## � Quick Start Guide

### Prerequisites
- Java 17+ and Maven 3.6+
- Node.js 16+ and npm
- Git for version control
- [Finnhub API Key](https://finnhub.io/) (free registration)

### 1️⃣ Clone & Setup
```bash
# Clone the repository
git clone https://github.com/Sahil0502/Intelligent-Financial-Analytics-Platform.git
cd Intelligent-Financial-Analytics-Platform

# Backend setup
cd backend
mvn clean install
# Configure your Finnhub API key in application.yml
mvn spring-boot:run

# Frontend setup (in new terminal)
cd frontend
npm install
npm start
```

### 2️⃣ Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080/api
- **H2 Database Console**: http://localhost:8080/h2-console

### 3️⃣ API Configuration
Update `backend/src/main/resources/application.yml`:
```yaml
finnhub:
  api:
    key: YOUR_API_KEY_HERE
    base-url: https://finnhub.io/api/v1
```

## 🏗️ Architecture & Design

### System Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Client  │◄──►│   Spring Boot    │◄──►│  External APIs  │
│                 │    │     Backend      │    │   (Finnhub)     │
├─────────────────┤    ├──────────────────┤    ├─────────────────┤
│ • Dashboard     │    │ • REST APIs      │    │ • Stock Data    │
│ • Charts        │    │ • WebSocket      │    │ • Market News   │
│ • Real-time UI  │    │ • ML Processing  │    │ • Real-time     │
│ • Portfolio Mgmt│    │ • Database       │    │   Streaming     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │
         └───────────────────────┘
              WebSocket Connection
```

### Project Structure
```
📦 Intelligent-Financial-Analytics-Platform
├── 🍃 backend/                    # Spring Boot Application
│   ├── 📁 src/main/java/com/financial/analytics/
│   │   ├── 🎮 controller/         # REST API Controllers
│   │   ├── 🔧 service/            # Business Logic Layer
│   │   ├── 📊 model/              # JPA Entity Classes
│   │   ├── 🗄️ repository/         # Data Access Layer
│   │   ├── 📤 dto/                # Data Transfer Objects
│   │   └── ⚙️ config/             # Configuration Classes
│   └── 📁 src/main/resources/
│       ├── application.yml        # App Configuration
│       └── application-prod.yml   # Production Config
├── ⚛️ frontend/                   # React Application
│   ├── 📁 src/
│   │   ├── 🧩 components/         # React Components
│   │   ├── 🌐 services/           # API Integration
│   │   ├── App.js                 # Main Component
│   │   └── index.js               # Entry Point
│   └── package.json               # Dependencies
├── 🗃️ database-setup.sql         # Database Schema
└── 📖 README.md                   # Documentation
```

## 🔌 API Documentation

### Core Endpoints

#### 📈 Stock Data APIs
```http
GET    /api/stocks/{symbol}/quote          # Real-time stock quote
GET    /api/stocks/{symbol}/history        # Historical price data
POST   /api/stocks/predict                 # ML price predictions
GET    /api/stocks/recent-updates          # Recent market activity
```

#### 💼 Portfolio Management APIs
```http
GET    /api/portfolios                     # List all portfolios
POST   /api/portfolios                     # Create new portfolio
PUT    /api/portfolios/{id}                # Update portfolio
DELETE /api/portfolios/{id}                # Delete portfolio
POST   /api/portfolios/{id}/holdings       # Add stock to portfolio
DELETE /api/portfolios/{id}/holdings/{symbol} # Remove stock
```

#### 🧠 Analytics & ML APIs
```http
POST   /api/predictions/stock              # Generate LSTM predictions
GET    /api/predictions/accuracy           # Model accuracy metrics
POST   /api/sentiment/analyze              # Text sentiment analysis
GET    /api/sentiment/market               # Market sentiment overview
```

#### 🔄 Real-time WebSocket Topics
```
/topic/stock-updates        # Live stock price updates
/topic/portfolio-updates    # Portfolio value changes
/topic/market-alerts        # Breaking market news
/topic/sentiment-updates    # Sentiment analysis results
```

## 🧪 Testing & Quality

### Backend Testing
```bash
cd backend
mvn test                    # Run unit tests
mvn verify                  # Run integration tests
mvn jacoco:report          # Generate test coverage report
```

### Frontend Testing
```bash
cd frontend
npm test                    # Run Jest unit tests
npm run test:coverage      # Generate coverage report
npm run lint               # Run ESLint code analysis
```

### Code Quality Metrics
- **Backend**: JUnit 5, Mockito, Spring Boot Test
- **Frontend**: Jest, React Testing Library, ESLint
- **API Testing**: Postman collection included
- **Performance**: JMeter test scripts available

## 🚀 Deployment & Production

### Docker Deployment (Recommended)
```bash
# Backend
docker build -t financial-backend ./backend
docker run -p 8080:8080 financial-backend

# Frontend  
docker build -t financial-frontend ./frontend
docker run -p 3000:3000 financial-frontend
```

### Traditional Deployment
```bash
# Backend production build
cd backend
mvn clean package -Pprod
java -jar target/analytics-platform-0.0.1-SNAPSHOT.jar

# Frontend production build
cd frontend
npm run build
# Deploy build/ directory to web server (Nginx, Apache, etc.)
```

### Environment Configuration
- **Development**: H2 in-memory database
- **Production**: PostgreSQL with connection pooling
- **API Keys**: Environment variables for security
- **Monitoring**: Spring Actuator endpoints enabled

## 🎯 Key Learning Outcomes

This project demonstrates proficiency in:

### **Full-Stack Development**
- ✅ Modern Java development with Spring Boot 3
- ✅ React 18 with hooks and functional components
- ✅ RESTful API design and implementation
- ✅ Real-time communication with WebSockets

### **Data Engineering**
- ✅ External API integration and data processing
- ✅ Database design and JPA/Hibernate ORM
- ✅ Real-time data streaming and caching
- ✅ Automated data fetching with scheduled jobs

### **Machine Learning Integration**
- ✅ LSTM neural networks for time series prediction
- ✅ Natural Language Processing for sentiment analysis
- ✅ Model training, validation, and deployment
- ✅ Performance metrics and accuracy tracking

### **Software Engineering Best Practices**
- ✅ Clean architecture with separation of concerns
- ✅ Comprehensive testing (unit, integration, end-to-end)
- ✅ Version control with Git and GitHub
- ✅ Documentation and code quality standards

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Process
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 About the Developer

**Sahil** - Full Stack Developer specializing in Financial Technology

- 🔗 **GitHub**: [@Sahil0502](https://github.com/Sahil0502)
- � **LinkedIn**: [Connect with me](https://www.linkedin.com/in/sahil-singh-ss9824/)
- 📧 **Email**: Contact via GitHub

### Skills Demonstrated
- **Backend**: Java, Spring Boot, JPA/Hibernate, RESTful APIs
- **Frontend**: React, JavaScript, HTML5/CSS3, Bootstrap
- **Database**: H2, PostgreSQL, SQL optimization
- **DevOps**: Maven, Docker, CI/CD, Git
- **ML/AI**: LSTM, NLP, Sentiment Analysis, Predictive Modeling
- **Financial**: Market data analysis, Portfolio management, Trading systems

## 🙏 Acknowledgments

- **[Finnhub.io](https://finnhub.io/)** - Comprehensive financial market data API
- **[Stanford CoreNLP](https://stanfordnlp.github.io/CoreNLP/)** - Advanced natural language processing
- **[Chart.js](https://www.chartjs.org/)** - Beautiful and responsive charts
- **[Spring Framework](https://spring.io/)** - Enterprise Java development platform
- **[React](https://reactjs.org/)** - Modern frontend library

## 📞 Support & Questions

- 🐛 **Bug Reports**: [Create an issue](https://github.com/Sahil0502/Intelligent-Financial-Analytics-Platform/issues)
- 💡 **Feature Requests**: [Start a discussion](https://github.com/Sahil0502/Intelligent-Financial-Analytics-Platform/discussions)
- 📧 **General Questions**: [sahilsinghm32@gmail.com](sahilsinghm32@gmail.com)

---

<div align="center">

### ⭐ If this project helped you learn something new, please give it a star! ⭐

**[📖 Documentation](https://github.com/Sahil0502/Intelligent-Financial-Analytics-Platform/wiki)** | **[🐛 Report Bug](https://github.com/Sahil0502/Intelligent-Financial-Analytics-Platform/issues)**

*Built with ❤️ for the developer community*

</div>
