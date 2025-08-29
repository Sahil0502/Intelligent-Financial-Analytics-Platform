package com.financial.analytics.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class PredictionRequest {
    @NotBlank(message = "Symbol is required")
    private String symbol;
    
    @NotNull(message = "Days ahead is required")
    @Positive(message = "Days ahead must be positive")
    private Integer daysAhead;
    
    // Constructors
    public PredictionRequest() {}
    
    public PredictionRequest(String symbol, Integer daysAhead) {
        this.symbol = symbol;
        this.daysAhead = daysAhead;
    }
    
    // Getters and Setters
    public String getSymbol() { return symbol; }
    public void setSymbol(String symbol) { this.symbol = symbol; }
    
    public Integer getDaysAhead() { return daysAhead; }
    public void setDaysAhead(Integer daysAhead) { this.daysAhead = daysAhead; }
}
