package com.financial.analytics.service;

import com.financial.analytics.dto.StockQuoteResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Service
public class FinnhubService {
    
    private static final Logger logger = LoggerFactory.getLogger(FinnhubService.class);
    
    private final WebClient webClient;
    
    @Value("${finnhub.api.key}")
    private String apiKey;
    
    @Value("${finnhub.api.base-url}")
    private String baseUrl;
    
    public FinnhubService() {
        this.webClient = WebClient.builder().build();
    }
    
    public Mono<StockQuoteResponse> getStockQuote(String symbol) {
        String url = String.format("%s/quote?symbol=%s&token=%s", baseUrl, symbol, apiKey);
        
        logger.debug("Fetching stock quote for symbol: {} from URL: {}", symbol, url);
        
        return webClient.get()
                .uri(url)
                .retrieve()
                .bodyToMono(StockQuoteResponse.class)
                .doOnSuccess(response -> logger.debug("Successfully fetched quote for {}: {}", symbol, response.getCurrentPrice()))
                .doOnError(error -> logger.error("Error fetching quote for {}: {}", symbol, error.getMessage()));
    }
    
    public Mono<String> getCompanyProfile(String symbol) {
        String url = String.format("%s/stock/profile2?symbol=%s&token=%s", baseUrl, symbol, apiKey);
        
        return webClient.get()
                .uri(url)
                .retrieve()
                .bodyToMono(String.class)
                .doOnError(error -> logger.error("Error fetching company profile for {}: {}", symbol, error.getMessage()));
    }
    
    public Mono<String> getMarketNews() {
        String url = String.format("%s/news?category=general&token=%s", baseUrl, apiKey);
        
        return webClient.get()
                .uri(url)
                .retrieve()
                .bodyToMono(String.class)
                .doOnError(error -> logger.error("Error fetching market news: {}", error.getMessage()));
    }
}
