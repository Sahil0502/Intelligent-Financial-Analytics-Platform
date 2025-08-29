package com.financial.analytics.service;

import com.financial.analytics.model.StockData;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

@Service
public class RealTimeDataService {
    
    private static final Logger logger = LoggerFactory.getLogger(RealTimeDataService.class);
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    @Autowired
    private StockDataService stockDataService;
    
    @Autowired
    private PortfolioService portfolioService;
    
    // Popular stocks to track
    private final List<String> TRACKED_SYMBOLS = Arrays.asList(
        "AAPL", "GOOGL", "MSFT", "AMZN", "TSLA", "NVDA", "META", "NFLX", "AMD", "INTC"
    );
    
    @Scheduled(fixedRate = 30000) // Every 30 seconds
    public void fetchAndBroadcastStockUpdates() {
        logger.debug("Fetching real-time stock updates");
        
        for (String symbol : TRACKED_SYMBOLS) {
            stockDataService.fetchAndSaveStockData(symbol)
                .subscribe(
                    stockData -> {
                        // Broadcast to WebSocket subscribers
                        messagingTemplate.convertAndSend("/topic/stock-updates", stockData);
                        logger.debug("Broadcasted update for {}: ${}", symbol, stockData.getCurrentPrice());
                    },
                    error -> logger.warn("Failed to fetch data for {}: {}", symbol, error.getMessage())
                );
        }
    }
    
    @Scheduled(fixedRate = 60000) // Every minute
    public void updatePortfolioValues() {
        try {
            portfolioService.updateAllPortfolioValues();
            messagingTemplate.convertAndSend("/topic/portfolio-updates", "Portfolio values updated");
            logger.debug("Updated and broadcasted portfolio values");
        } catch (Exception e) {
            logger.error("Error updating portfolio values", e);
        }
    }
    
    public void broadcastStockUpdate(StockData stockData) {
        messagingTemplate.convertAndSend("/topic/stock-updates", stockData);
    }
    
    public void broadcastMarketAlert(String message) {
        messagingTemplate.convertAndSend("/topic/market-alerts", message);
    }
}
