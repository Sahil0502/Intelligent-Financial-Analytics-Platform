# PostgreSQL Setup Guide for Financial Analytics Platform

## 🗄️ Database Credentials & Setup

### 1. PostgreSQL Installation

#### Windows:
```bash
# Download and install PostgreSQL from https://www.postgresql.org/download/windows/
# Or use Chocolatey:
choco install postgresql

# Or use winget:
winget install PostgreSQL.PostgreSQL
```

#### Alternative - Docker (Recommended):
```bash
# Run PostgreSQL in Docker
docker run --name financial-postgres -e POSTGRES_PASSWORD=FinancialAnalytics2024! -p 5432:5432 -d postgres:15

# Connect to create database
docker exec -it financial-postgres psql -U postgres
```

### 2. Database Setup

#### Create Database and User:
```sql
-- Connect as postgres user
CREATE DATABASE financial_analytics;
CREATE USER financial_user WITH PASSWORD 'FinancialAnalytics2024!';
GRANT ALL PRIVILEGES ON DATABASE financial_analytics TO financial_user;
ALTER USER financial_user CREATEDB;
```

#### Run Database Schema:
```bash
# Navigate to project directory
cd "C:\Users\sahil\Downloads\Intelligent Financial Analytics Platform"

# Run the setup script
psql -h localhost -U financial_user -d financial_analytics -f database-setup.sql
```

### 3. Environment Variables Setup

#### Option A: Create .env file in backend directory:
```bash
# Create backend/.env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=financial_analytics
DB_USERNAME=financial_user
DB_PASSWORD=FinancialAnalytics2024!
FINNHUB_API_KEY=d2go7v1r01qq1lhvukcgd2go7v1r01qq1lhvukd0
REDIS_HOST=localhost
REDIS_PORT=6379
```

#### Option B: Set System Environment Variables (Windows):
```cmd
setx DB_HOST "localhost"
setx DB_PORT "5432"
setx DB_NAME "financial_analytics"
setx DB_USERNAME "financial_user"
setx DB_PASSWORD "FinancialAnalytics2024!"
setx FINNHUB_API_KEY "d2go7v1r01qq1lhvukcgd2go7v1r01qq1lhvukd0"
```

### 4. Redis Setup (Optional - for caching)

#### Docker Redis:
```bash
docker run --name financial-redis -p 6379:6379 -d redis:7-alpine
```

#### Windows Redis:
```bash
# Download from https://github.com/microsoftarchive/redis/releases
# Or use Chocolatey:
choco install redis-64
```

### 5. Application Startup

#### Backend:
```bash
cd backend
# Run with production profile
mvn spring-boot:run -Dspring-boot.run.profiles=prod

# Or build and run JAR
mvn clean package
java -jar target/analytics-platform-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod
```

#### Frontend:
```bash
cd frontend
npm install
npm start
```

### 6. Verify Setup

#### Check Database Connection:
```bash
# Test connection
psql -h localhost -U financial_user -d financial_analytics -c "SELECT version();"
```

#### Check Application:
- Backend: http://localhost:8080/api/actuator/health
- Frontend: http://localhost:3000
- H2 Console (dev): http://localhost:8080/api/h2-console

### 7. Production Deployment

#### Environment Variables for Production:
```bash
DB_HOST=your-production-db-host
DB_USERNAME=your-production-username
DB_PASSWORD=your-secure-password
ALLOWED_ORIGINS=https://yourdomain.com
```

#### Security Recommendations:
1. Change default passwords
2. Use strong passwords (minimum 12 characters)
3. Enable SSL for database connections
4. Configure firewall rules
5. Regular database backups

### 8. Troubleshooting

#### Common Issues:
```bash
# Connection refused
- Check PostgreSQL is running: systemctl status postgresql
- Verify port 5432 is open: netstat -an | grep 5432

# Authentication failed
- Verify username/password in pg_hba.conf
- Check user permissions: \du in psql

# Database not found
- Create database: CREATE DATABASE financial_analytics;
- Run setup script again
```

### 9. Current Configuration

Your `application-prod.yml` is configured with:
- **Database**: financial_analytics
- **Username**: financial_user  
- **Password**: FinancialAnalytics2024!
- **Host**: localhost:5432

All credentials can be overridden with environment variables for security.
