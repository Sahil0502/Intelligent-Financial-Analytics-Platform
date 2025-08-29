package com.financial.analytics.service;

import com.financial.analytics.dto.StockQuoteResponse;
import com.financial.analytics.model.StockData;
import com.financial.analytics.repository.StockDataRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@Transactional
public class StockDataService {
    
    private static final Logger logger = LoggerFactory.getLogger(StockDataService.class);
    
    @Autowired
    private StockDataRepository stockDataRepository;
    
    @Autowired
    private FinnhubService finnhubService;
    
    private final ConcurrentHashMap<String, AtomicInteger> requestCache = new ConcurrentHashMap<>();
    
    private static final int MAX_REQUESTS_PER_MINUTE = 30;
    
    public Mono<StockData> fetchAndSaveStockData(String symbol) {
        try {
            // Check rate limit
            AtomicInteger requests = requestCache.computeIfAbsent(symbol, k -> new AtomicInteger(0));
            if (requests.get() >= MAX_REQUESTS_PER_MINUTE) {
                return Mono.error(new RuntimeException("Rate limit exceeded for symbol: " + symbol));
            }
            requests.incrementAndGet();
            
            return finnhubService.getStockQuote(symbol)
                    .map(quote -> convertToStockData(symbol, quote))
                    .map(stockData -> {
                        try {
                            StockData saved = stockDataRepository.save(stockData);
                            logger.info("Saved stock data for symbol: {} at price: {}", symbol, saved.getCurrentPrice());
                            return saved;
                        } catch (Exception e) {
                            logger.error("Database error while saving stock data for {}: {}", symbol, e.getMessage());
                            throw new RuntimeException("Failed to save stock data", e);
                        }
                    })
                    .doOnError(error -> {
                        logger.error("Failed to fetch and save stock data for {}: {}", symbol, error.getMessage());
                        if (error instanceof Exception) {
                            logger.debug("Detailed error: ", error);
                        }
                    })
                    .onErrorResume(error -> {
                        Optional<StockData> cached = getLatestStockData(symbol);
                        if (cached.isPresent()) {
                            logger.info("Returning cached data for {} due to error", symbol);
                            return Mono.just(cached.get());
                        }
                        return Mono.error(error);
                    });
        } catch (Exception e) {
            logger.error("Error in fetchAndSaveStockData: {}", e.getMessage());
            return Mono.error(e);
        }
    }
    
    public Optional<StockData> getLatestStockData(String symbol) {
        return stockDataRepository.findTopBySymbolOrderByTimestampDesc(symbol);
    }
    
    public List<StockData> getHistoricalData(String symbol, LocalDateTime startDate, LocalDateTime endDate) {
        return stockDataRepository.findBySymbolAndTimestampBetweenOrderByTimestampAsc(symbol, startDate, endDate);
    }
    
    public List<StockData> getRecentData(String symbol, int limit) {
        return stockDataRepository.findLatestBySymbol(symbol, limit);
    }
    
    public List<String> getAllTrackedSymbols() {
        return stockDataRepository.findDistinctSymbols();
    }
    
    public List<StockData> getRecentDataSince(LocalDateTime since) {
        return stockDataRepository.findRecentData(since);
    }
    
    private StockData convertToStockData(String symbol, StockQuoteResponse quote) {
        LocalDateTime timestamp = LocalDateTime.ofInstant(
            Instant.ofEpochSecond(quote.getTimestamp()), 
            ZoneId.systemDefault()
        );
        
        return new StockData(
            symbol,
            quote.getCurrentPrice(),
            quote.getOpenPrice(),
            quote.getHighPrice(),
            quote.getLowPrice(),
            quote.getPreviousClose(),
            0L, // Volume not provided in quote endpoint
            timestamp
        );
    }
}
