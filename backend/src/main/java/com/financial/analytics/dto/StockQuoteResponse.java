package com.financial.analytics.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class StockQuoteResponse {
    @JsonProperty("c")
    private Double currentPrice;
    
    @JsonProperty("h")
    private Double highPrice;
    
    @JsonProperty("l")
    private Double lowPrice;
    
    @JsonProperty("o")
    private Double openPrice;
    
    @JsonProperty("pc")
    private Double previousClose;
    
    @JsonProperty("t")
    private Long timestamp;
    
    // Constructors
    public StockQuoteResponse() {}
    
    // Getters and Setters
    public Double getCurrentPrice() { return currentPrice; }
    public void setCurrentPrice(Double currentPrice) { this.currentPrice = currentPrice; }
    
    public Double getHighPrice() { return highPrice; }
    public void setHighPrice(Double highPrice) { this.highPrice = highPrice; }
    
    public Double getLowPrice() { return lowPrice; }
    public void setLowPrice(Double lowPrice) { this.lowPrice = lowPrice; }
    
    public Double getOpenPrice() { return openPrice; }
    public void setOpenPrice(Double openPrice) { this.openPrice = openPrice; }
    
    public Double getPreviousClose() { return previousClose; }
    public void setPreviousClose(Double previousClose) { this.previousClose = previousClose; }
    
    public Long getTimestamp() { return timestamp; }
    public void setTimestamp(Long timestamp) { this.timestamp = timestamp; }
}
