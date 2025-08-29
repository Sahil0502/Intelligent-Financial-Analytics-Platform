package com.financial.analytics.controller;

import com.financial.analytics.model.Portfolio;
import com.financial.analytics.service.PortfolioService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/portfolios")
@CrossOrigin(origins = "http://localhost:3000")
public class PortfolioController {
    
    private static final Logger logger = LoggerFactory.getLogger(PortfolioController.class);
    
    @Autowired
    private PortfolioService portfolioService;
    
    @PostMapping
    public ResponseEntity<?> createPortfolio(@RequestParam String name) {
        try {
            Portfolio portfolio = portfolioService.createPortfolio(name);
            logger.info("Created portfolio: {}", name);
            return ResponseEntity.ok(portfolio);
        } catch (IllegalArgumentException e) {
            logger.warn("Portfolio creation failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping
    public ResponseEntity<List<Portfolio>> getAllPortfolios() {
        try {
            List<Portfolio> portfolios = portfolioService.getAllPortfolios();
            logger.info("Fetched {} portfolios", portfolios.size());
            return ResponseEntity.ok()
                .header("Content-Type", "application/json")
                .header("Transfer-Encoding", "identity")  // Prevent chunked encoding
                .body(portfolios);
        } catch (Exception e) {
            logger.error("Error fetching portfolios", e);
            return ResponseEntity.internalServerError()
                .header("Content-Type", "application/json")
                .body(List.of());  // Return empty list instead of null
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Portfolio> getPortfolio(@PathVariable Long id) {
        Optional<Portfolio> portfolio = portfolioService.getPortfolioById(id);
        return portfolio.map(ResponseEntity::ok)
                       .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping("/{id}/holdings")
    public ResponseEntity<Portfolio> addHolding(
            @PathVariable Long id,
            @RequestParam String symbol,
            @RequestParam Integer quantity,
            @RequestParam Double averagePrice) {
        
        try {
            Portfolio portfolio = portfolioService.addHolding(id, symbol.toUpperCase(), quantity, averagePrice);
            logger.info("Added holding {} to portfolio {}", symbol, id);
            return ResponseEntity.ok(portfolio);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @DeleteMapping("/{id}/holdings/{symbol}")
    public ResponseEntity<Portfolio> removeHolding(@PathVariable Long id, @PathVariable String symbol) {
        try {
            Portfolio portfolio = portfolioService.removeHolding(id, symbol.toUpperCase());
            logger.info("Removed holding {} from portfolio {}", symbol, id);
            return ResponseEntity.ok(portfolio);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PostMapping("/update-values")
    public ResponseEntity<Void> updateAllPortfolioValues() {
        portfolioService.updateAllPortfolioValues();
        logger.info("Updated all portfolio values");
        return ResponseEntity.ok().build();
    }
    
    @GetMapping("/{id}/risk")
    public ResponseEntity<Double> getPortfolioRisk(@PathVariable Long id) {
        try {
            double risk = portfolioService.calculatePortfolioRisk(id);
            return ResponseEntity.ok(risk);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
