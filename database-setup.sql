-- PostgreSQL Database Setup for Financial Analytics Platform
-- Run this script to set up the production database
-- Using existing postgres database and user

-- Connect to the postgres database (using existing credentials)
\c postgres;

-- Create tables
CREATE TABLE IF NOT EXISTS stock_data (
    id BIGSERIAL PRIMARY KEY,
    symbol VARCHAR(10) NOT NULL,
    current_price DECIMAL(10,2) NOT NULL,
    change_amount DECIMAL(10,2),
    change_percent DECIMAL(5,2),
    volume BIGINT,
    market_cap BIGINT,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS portfolios (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    total_value DECIMAL(15,2) DEFAULT 0.00,
    total_investment DECIMAL(15,2) DEFAULT 0.00,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS portfolio_holdings (
    id BIGSERIAL PRIMARY KEY,
    portfolio_id BIGINT NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    symbol VARCHAR(10) NOT NULL,
    quantity INTEGER NOT NULL,
    average_price DECIMAL(10,2) NOT NULL,
    current_price DECIMAL(10,2),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(portfolio_id, symbol)
);

-- Create indexes for better performance
CREATE INDEX idx_stock_data_symbol ON stock_data(symbol);
CREATE INDEX idx_stock_data_timestamp ON stock_data(timestamp);
CREATE INDEX idx_portfolio_holdings_portfolio_id ON portfolio_holdings(portfolio_id);
CREATE INDEX idx_portfolio_holdings_symbol ON portfolio_holdings(symbol);

-- Grant table privileges
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO financial_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO financial_user;

-- Insert sample data for testing
INSERT INTO stock_data (symbol, current_price, change_amount, change_percent, volume, market_cap) VALUES
('AAPL', 175.50, 2.30, 1.33, 45000000, 2800000000000),
('GOOGL', 2750.80, -15.20, -0.55, 1200000, 1850000000000),
('MSFT', 335.90, 4.10, 1.23, 25000000, 2500000000000),
('AMZN', 3380.00, 25.50, 0.76, 3500000, 1700000000000),
('TSLA', 245.60, -8.90, -3.50, 75000000, 780000000000);

-- Create sample portfolio
INSERT INTO portfolios (name, total_value, total_investment) VALUES
('Tech Growth Portfolio', 50000.00, 45000.00);

-- Add sample holdings
INSERT INTO portfolio_holdings (portfolio_id, symbol, quantity, average_price, current_price) VALUES
(1, 'AAPL', 100, 170.00, 175.50),
(1, 'GOOGL', 10, 2700.00, 2750.80),
(1, 'MSFT', 50, 320.00, 335.90);

COMMIT;
