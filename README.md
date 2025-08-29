# Intelligent Financial Analytics Platform

A comprehensive real-time financial analytics platform built with Spring Boot, React, and machine learning capabilities for stock market analysis, portfolio management, and predictive analytics.

## 🚀 Features

### Core Functionality
- **Real-time Stock Data**: Live stock quotes and market updates using Finnhub API
- **Portfolio Management**: Create and manage investment portfolios with real-time tracking
- **LSTM Predictions**: Machine learning-powered stock price predictions
- **Sentiment Analysis**: News sentiment analysis using Stanford CoreNLP
- **Interactive Dashboard**: Modern, responsive dashboard with live charts and metrics
- **WebSocket Integration**: Real-time data streaming for live market updates

### Technical Features
- **RESTful APIs**: Comprehensive backend API for all financial operations
- **Real-time Updates**: WebSocket-based live data broadcasting
- **Database Integration**: H2 in-memory database for development, PostgreSQL for production
- **Rate Limiting**: API rate limiting for optimal performance
- **Responsive Design**: Mobile-friendly React frontend with Bootstrap
- **Animation Effects**: Smooth animations using Framer Motion

## 🛠️ Technology Stack

### Backend
- **Java 17** - Modern Java features and performance
- **Spring Boot 3.1.5** - Enterprise-grade framework
- **Spring Data JPA** - Database abstraction layer
- **Spring WebSocket** - Real-time communication
- **H2 Database** - In-memory database for development
- **PostgreSQL** - Production database
- **Stanford CoreNLP** - Natural language processing
- **Quartz Scheduler** - Job scheduling for data updates
- **Maven** - Dependency management

### Frontend
- **React 18** - Modern UI library
- **React Router** - Client-side routing
- **Bootstrap 5** - Responsive design framework
- **Chart.js** - Interactive charts and graphs
- **Framer Motion** - Smooth animations
- **Axios** - HTTP client for API calls
- **WebSocket Client** - Real-time data reception

### External APIs
- **Finnhub API** - Real-time stock market data
- **WebSocket Streaming** - Live market updates

## 📋 Prerequisites

Before running this application, make sure you have:

- **Java 17 or higher** installed
- **Node.js 16 or higher** and npm
- **Maven 3.6+** for building the backend
- **Git** for version control
- **Finnhub API Key** (free registration required)

## 🔧 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/Sahil0502/Intelligent-Financial-Analytics-Platform.git
cd Intelligent-Financial-Analytics-Platform
```

### 2. Backend Setup

#### Configure Application Properties
Navigate to `backend/src/main/resources/application.yml` and configure:

```yaml
# Database Configuration (H2 for development)
spring:
  datasource:
    url: jdbc:h2:mem:testdb
    username: sa
    password: password

# Server Configuration
server:
  port: 8080
  servlet:
    context-path: /api

# External API Configuration
finnhub:
  api:
    key: YOUR_FINNHUB_API_KEY_HERE
    base-url: https://finnhub.io/api/v1
```

#### Build and Run Backend
```bash
cd backend
mvn clean install
mvn spring-boot:run
```

Or run using the JAR file:
```bash
java -jar target/analytics-platform-0.0.1-SNAPSHOT.jar
```

The backend will start on `http://localhost:8080`

### 3. Frontend Setup

#### Install Dependencies
```bash
cd frontend
npm install
```

#### Start Development Server
```bash
npm start
```

The frontend will start on `http://localhost:3000`

## 🔑 API Configuration

### Finnhub API Key Setup
1. Register for a free account at [Finnhub.io](https://finnhub.io/)
2. Get your API key from the dashboard
3. Replace `YOUR_FINNHUB_API_KEY_HERE` in the application.yml file

## 📱 Usage

### Accessing the Application
1. Start the backend server (port 8080)
2. Start the frontend development server (port 3000)
3. Open your browser and navigate to `http://localhost:3000`

### Main Features

#### Dashboard
- View real-time market overview
- Monitor portfolio performance
- Track live stock updates
- Interactive charts and metrics

#### Stock Analysis
- Real-time stock quotes
- Historical price charts
- Technical indicators
- Market sentiment analysis

#### Portfolio Management
- Create and manage portfolios
- Add/remove stock holdings
- Track investment performance
- Real-time portfolio valuation

#### Predictions
- LSTM-based price predictions
- Machine learning insights
- Forecast accuracy metrics
- Historical prediction analysis

## 🏗️ Project Structure

```
Intelligent-Financial-Analytics-Platform/
├── backend/                          # Spring Boot backend
│   ├── src/main/java/
│   │   └── com/financial/analytics/
│   │       ├── controller/           # REST controllers
│   │       ├── service/              # Business logic
│   │       ├── model/                # Entity classes
│   │       ├── repository/           # Data access layer
│   │       ├── dto/                  # Data transfer objects
│   │       └── config/               # Configuration classes
│   ├── src/main/resources/
│   │   ├── application.yml           # Application configuration
│   │   └── application-prod.yml      # Production configuration
│   └── pom.xml                       # Maven dependencies
├── frontend/                         # React frontend
│   ├── src/
│   │   ├── components/               # React components
│   │   ├── services/                 # API services
│   │   ├── App.js                    # Main application component
│   │   └── index.js                  # Application entry point
│   ├── public/                       # Static assets
│   └── package.json                  # npm dependencies
├── database-setup.sql                # Database schema
├── setup-database.bat               # Database setup script
└── README.md                        # Project documentation
```

## 🔌 API Endpoints

### Stock Data
- `GET /api/stocks/symbols` - Get available stock symbols
- `GET /api/stocks/{symbol}/quote` - Get real-time quote
- `GET /api/stocks/{symbol}/recent` - Get recent price history
- `GET /api/stocks/recent-updates` - Get recent market updates

### Portfolio Management
- `GET /api/portfolios` - Get all portfolios
- `POST /api/portfolios` - Create new portfolio
- `PUT /api/portfolios/{id}` - Update portfolio
- `DELETE /api/portfolios/{id}` - Delete portfolio
- `POST /api/portfolios/{id}/holdings` - Add stock holding

### Predictions
- `POST /api/predictions/stock` - Get stock price prediction
- `GET /api/predictions/accuracy` - Get prediction accuracy metrics

### Sentiment Analysis
- `POST /api/sentiment/analyze` - Analyze text sentiment
- `GET /api/sentiment/news/{symbol}` - Get news sentiment for symbol

## 🌐 WebSocket Endpoints

Real-time data streaming:
- `/ws/stock-updates` - Live stock price updates
- `/ws/portfolio-updates` - Portfolio value changes
- `/ws/market-news` - Breaking market news

## 🧪 Testing

### Backend Testing
```bash
cd backend
mvn test
```

### Frontend Testing
```bash
cd frontend
npm test
```

## 🚀 Deployment

### Production Backend
1. Configure PostgreSQL database in `application-prod.yml`
2. Build production JAR: `mvn clean package -Pprod`
3. Deploy JAR to your server
4. Set environment variables for API keys

### Production Frontend
1. Build production bundle: `npm run build`
2. Deploy build folder to web server
3. Configure proxy for API calls

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Sahil** - [GitHub](https://github.com/Sahil0502)

## 🙏 Acknowledgments

- [Finnhub.io](https://finnhub.io/) for providing free stock market API
- [Stanford CoreNLP](https://stanfordnlp.github.io/CoreNLP/) for sentiment analysis
- [Chart.js](https://www.chartjs.org/) for beautiful charts
- [Spring Boot](https://spring.io/projects/spring-boot) for the robust backend framework
- [React](https://reactjs.org/) for the dynamic frontend

## 📞 Support

If you have any questions or need help with setup, please open an issue on GitHub or contact the maintainer.

---

⭐ **Star this repository if you found it helpful!**

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies and run:
```bash
mvn clean install
mvn spring-boot:run
```

The backend will start on `http://localhost:8080`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The frontend will start on `http://localhost:3000`

## API Configuration

The application uses the Finnhub API for real-time market data. The API key is configured in `backend/src/main/resources/application.yml`:

```yaml
finnhub:
  api:
    key: d2go7v1r01qq1lhvukcgd2go7v1r01qq1lhvukd0
    base-url: https://finnhub.io/api/v1
```

## API Endpoints

### Stock Data
- `GET /api/stocks/{symbol}/quote` - Get real-time stock quote
- `GET /api/stocks/{symbol}/latest` - Get latest stored stock data
- `GET /api/stocks/{symbol}/history` - Get historical data
- `POST /api/stocks/predict` - Generate LSTM predictions

### Portfolio Management
- `GET /api/portfolios` - Get all portfolios
- `POST /api/portfolios` - Create new portfolio
- `POST /api/portfolios/{id}/holdings` - Add holding to portfolio
- `DELETE /api/portfolios/{id}/holdings/{symbol}` - Remove holding

### Sentiment Analysis
- `POST /api/sentiment/analyze` - Analyze text sentiment
- `POST /api/sentiment/market` - Analyze market sentiment from headlines

## WebSocket Topics

- `/topic/stock-updates` - Real-time stock price updates
- `/topic/portfolio-updates` - Portfolio value updates
- `/topic/market-alerts` - Market alerts and notifications

## Features Overview

### 1. Dashboard
- Real-time market activity chart
- Portfolio summaries
- Live stock updates
- Market overview table

### 2. Stock Analysis
- Interactive price charts (Line, Bar)
- Historical data visualization
- Real-time quote fetching
- Volume analysis

### 3. Portfolio Management
- Create and manage multiple portfolios
- Add/remove stock holdings
- Portfolio allocation charts (Doughnut)
- Performance tracking (Bar charts)
- Risk assessment calculations

### 4. LSTM Predictions
- Generate stock price predictions (1-30 days)
- Confidence scoring
- Historical vs predicted price visualization
- Multiple prediction models

### 5. Sentiment Analysis
- Individual text sentiment analysis
- Market sentiment from news headlines
- Sentiment history tracking
- Visual sentiment distribution

## Architecture

```
Frontend (React) ←→ REST APIs ←→ Backend (Spring Boot)
     ↓                              ↓
WebSocket Client ←→ WebSocket Server
     ↓                              ↓
Real-time UI ←→ Real-time Data Processing
                                   ↓
                            External APIs (Finnhub)
```

## Database Schema

The application uses H2 in-memory database with the following entities:
- `StockData` - Historical stock prices and data
- `Portfolio` - Portfolio information
- `PortfolioHolding` - Individual stock holdings

## Development

### Adding New Features
1. Backend: Add controllers, services, and models in respective packages
2. Frontend: Add components in `src/components/`
3. Update API service in `src/services/ApiService.js`

### Testing
- Backend: Run `mvn test`
- Frontend: Run `npm test`

## Production Deployment

### Backend
```bash
mvn clean package
java -jar target/analytics-platform-0.0.1-SNAPSHOT.jar
```

### Frontend
```bash
npm run build
# Deploy build/ directory to web server
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please create an issue in the repository.
