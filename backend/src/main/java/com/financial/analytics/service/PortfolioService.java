package com.financial.analytics.service;

import com.financial.analytics.model.Portfolio;
import com.financial.analytics.model.PortfolioHolding;
import com.financial.analytics.model.StockData;
import com.financial.analytics.repository.PortfolioRepository;
import com.financial.analytics.repository.PortfolioHoldingRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class PortfolioService {
    
    private static final Logger logger = LoggerFactory.getLogger(PortfolioService.class);
    
    @Autowired
    private PortfolioRepository portfolioRepository;
    
    @Autowired
    private PortfolioHoldingRepository holdingRepository;
    
    @Autowired
    private StockDataService stockDataService;
    
    public Portfolio createPortfolio(String name) {
        String uniqueName = name;
        int counter = 1;
        
        // Make name unique if it already exists
        while (portfolioRepository.existsByName(uniqueName)) {
            uniqueName = name + " (" + counter + ")";
            counter++;
        }
        
        Portfolio portfolio = new Portfolio(uniqueName);
        Portfolio saved = portfolioRepository.save(portfolio);
        logger.info("Created new portfolio: {}", uniqueName);
        return saved;
    }
    
    public List<Portfolio> getAllPortfolios() {
        return portfolioRepository.findAllByOrderByCreatedAtDesc();
    }
    
    public Optional<Portfolio> getPortfolioById(Long id) {
        return portfolioRepository.findById(id);
    }
    
    public Portfolio addHolding(Long portfolioId, String symbol, Integer quantity, Double averagePrice) {
        Portfolio portfolio = portfolioRepository.findById(portfolioId)
                .orElseThrow(() -> new IllegalArgumentException("Portfolio not found"));
        
        Optional<PortfolioHolding> existingHolding = holdingRepository.findByPortfolioIdAndSymbol(portfolioId, symbol);
        
        if (existingHolding.isPresent()) {
            // Update existing holding
            PortfolioHolding holding = existingHolding.get();
            int totalQuantity = holding.getQuantity() + quantity;
            double totalValue = (holding.getAveragePrice() * holding.getQuantity()) + (averagePrice * quantity);
            double newAveragePrice = totalValue / totalQuantity;
            
            holding.setQuantity(totalQuantity);
            holding.setAveragePrice(newAveragePrice);
            holding.setUpdatedAt(LocalDateTime.now());
            
            holdingRepository.save(holding);
            logger.info("Updated holding for {} in portfolio {}", symbol, portfolio.getName());
        } else {
            // Create new holding
            PortfolioHolding newHolding = new PortfolioHolding(portfolio, symbol, quantity, averagePrice, LocalDateTime.now());
            
            // Try to get current price
            Optional<StockData> currentData = stockDataService.getLatestStockData(symbol);
            if (currentData.isPresent()) {
                newHolding.setCurrentPrice(currentData.get().getCurrentPrice());
            }
            
            holdingRepository.save(newHolding);
            portfolio.getHoldings().add(newHolding);
            logger.info("Added new holding {} to portfolio {}", symbol, portfolio.getName());
        }
        
        updatePortfolioValues(portfolio);
        return portfolioRepository.save(portfolio);
    }
    
    public Portfolio removeHolding(Long portfolioId, String symbol) {
        Portfolio portfolio = portfolioRepository.findById(portfolioId)
                .orElseThrow(() -> new IllegalArgumentException("Portfolio not found"));
        
        PortfolioHolding holding = holdingRepository.findByPortfolioIdAndSymbol(portfolioId, symbol)
                .orElseThrow(() -> new IllegalArgumentException("Holding not found"));
        
        holdingRepository.delete(holding);
        portfolio.getHoldings().removeIf(h -> h.getSymbol().equals(symbol));
        
        updatePortfolioValues(portfolio);
        logger.info("Removed holding {} from portfolio {}", symbol, portfolio.getName());
        return portfolioRepository.save(portfolio);
    }
    
    public void updateAllPortfolioValues() {
        List<Portfolio> portfolios = portfolioRepository.findAll();
        for (Portfolio portfolio : portfolios) {
            updatePortfolioValues(portfolio);
            portfolioRepository.save(portfolio);
        }
        logger.info("Updated values for {} portfolios", portfolios.size());
    }
    
    private void updatePortfolioValues(Portfolio portfolio) {
        List<PortfolioHolding> holdings = holdingRepository.findByPortfolioId(portfolio.getId());
        
        double totalValue = 0.0;
        double totalInvestment = 0.0;
        
        for (PortfolioHolding holding : holdings) {
            // Update current price from latest stock data
            Optional<StockData> currentData = stockDataService.getLatestStockData(holding.getSymbol());
            if (currentData.isPresent()) {
                holding.setCurrentPrice(currentData.get().getCurrentPrice());
                holdingRepository.save(holding);
            }
            
            totalValue += holding.getTotalValue();
            totalInvestment += holding.getTotalInvestment();
        }
        
        portfolio.setTotalValue(totalValue);
        portfolio.setTotalInvestment(totalInvestment);
        portfolio.setUpdatedAt(LocalDateTime.now());
    }
    
    public double calculatePortfolioRisk(Long portfolioId) {
        Portfolio portfolio = portfolioRepository.findById(portfolioId)
                .orElseThrow(() -> new IllegalArgumentException("Portfolio not found"));
        
        List<PortfolioHolding> holdings = holdingRepository.findByPortfolioId(portfolioId);
        
        if (holdings.isEmpty()) {
            return 0.0;
        }
        
        // Simple risk calculation based on volatility
        double totalRisk = 0.0;
        double totalWeight = 0.0;
        
        for (PortfolioHolding holding : holdings) {
            double weight = holding.getTotalValue() / portfolio.getTotalValue();
            double volatility = calculateStockVolatility(holding.getSymbol());
            totalRisk += weight * volatility;
            totalWeight += weight;
        }
        
        return totalWeight > 0 ? totalRisk / totalWeight : 0.0;
    }
    
    private double calculateStockVolatility(String symbol) {
        List<StockData> recentData = stockDataService.getRecentData(symbol, 30);
        
        if (recentData.size() < 2) {
            return 0.1; // Default volatility
        }
        
        double[] returns = new double[recentData.size() - 1];
        for (int i = 1; i < recentData.size(); i++) {
            double currentPrice = recentData.get(i).getCurrentPrice();
            double previousPrice = recentData.get(i - 1).getCurrentPrice();
            returns[i - 1] = (currentPrice - previousPrice) / previousPrice;
        }
        
        // Calculate standard deviation
        double mean = 0.0;
        for (double ret : returns) {
            mean += ret;
        }
        mean /= returns.length;
        
        double variance = 0.0;
        for (double ret : returns) {
            variance += Math.pow(ret - mean, 2);
        }
        variance /= returns.length;
        
        return Math.sqrt(variance);
    }
}
