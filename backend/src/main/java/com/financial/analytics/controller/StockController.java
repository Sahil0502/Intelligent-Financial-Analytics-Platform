package com.financial.analytics.controller;

import com.financial.analytics.dto.PredictionRequest;
import com.financial.analytics.dto.PredictionResponse;
import com.financial.analytics.model.StockData;
import com.financial.analytics.service.LSTMPredictionService;
import com.financial.analytics.service.StockDataService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/stocks")
@CrossOrigin(origins = "http://localhost:3000")
public class StockController {
    
    private static final Logger logger = LoggerFactory.getLogger(StockController.class);
    
    @Autowired
    private StockDataService stockDataService;
    
    @Autowired
    private LSTMPredictionService predictionService;
    
    @GetMapping("/{symbol}/quote")
    public Mono<ResponseEntity<StockData>> getStockQuote(@PathVariable String symbol) {
        logger.info("Fetching quote for symbol: {}", symbol);
        
        return stockDataService.fetchAndSaveStockData(symbol.toUpperCase())
                .map(stockData -> ResponseEntity.ok(stockData))
                .onErrorReturn(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/{symbol}/latest")
    public ResponseEntity<StockData> getLatestStockData(@PathVariable String symbol) {
        Optional<StockData> stockData = stockDataService.getLatestStockData(symbol.toUpperCase());
        
        if (stockData.isPresent()) {
            return ResponseEntity.ok(stockData.get());
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    @GetMapping("/{symbol}/history")
    public ResponseEntity<List<StockData>> getHistoricalData(
            @PathVariable String symbol,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        
        LocalDateTime start = startDate != null ? LocalDateTime.parse(startDate) : LocalDateTime.now().minusDays(30);
        LocalDateTime end = endDate != null ? LocalDateTime.parse(endDate) : LocalDateTime.now();
        
        List<StockData> historicalData = stockDataService.getHistoricalData(symbol.toUpperCase(), start, end);
        return ResponseEntity.ok(historicalData);
    }
    
    @GetMapping("/{symbol}/recent")
    public ResponseEntity<List<StockData>> getRecentData(
            @PathVariable String symbol,
            @RequestParam(defaultValue = "30") int limit) {
        
        List<StockData> recentData = stockDataService.getRecentData(symbol.toUpperCase(), limit);
        return ResponseEntity.ok(recentData);
    }
    
    @PostMapping("/predict")
    public ResponseEntity<PredictionResponse> predictStockPrice(@Valid @RequestBody PredictionRequest request) {
        logger.info("Prediction request for symbol: {} for {} days", request.getSymbol(), request.getDaysAhead());
        
        try {
            PredictionResponse prediction = predictionService.predictStockPrice(
                request.getSymbol().toUpperCase(), 
                request.getDaysAhead()
            );
            return ResponseEntity.ok(prediction);
        } catch (Exception e) {
            logger.error("Error in prediction for symbol: {}", request.getSymbol(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/symbols")
    public ResponseEntity<List<String>> getAllTrackedSymbols() {
        List<String> symbols = stockDataService.getAllTrackedSymbols();
        return ResponseEntity.ok(symbols);
    }
    
    @GetMapping("/recent-updates")
    public ResponseEntity<List<StockData>> getRecentUpdates(
            @RequestParam(defaultValue = "1") int hours) {
        
        LocalDateTime since = LocalDateTime.now().minusHours(hours);
        List<StockData> recentUpdates = stockDataService.getRecentDataSince(since);
        return ResponseEntity.ok(recentUpdates);
    }
}
