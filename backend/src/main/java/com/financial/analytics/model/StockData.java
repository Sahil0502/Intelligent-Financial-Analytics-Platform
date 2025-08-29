package com.financial.analytics.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "stock_data")
public class StockData {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String symbol;
    
    @Column(nullable = false)
    private Double currentPrice;
    
    @Column(nullable = false)
    private Double openPrice;
    
    @Column(nullable = false)
    private Double highPrice;
    
    @Column(nullable = false)
    private Double lowPrice;
    
    @Column(nullable = false)
    private Double previousClose;
    
    @Column(nullable = false)
    private Long volume;
    
    @Column(nullable = false)
    private LocalDateTime timestamp;
    
    @Column
    private Double changePercent;
    
    @Column
    private Double change;
    
    // Constructors
    public StockData() {}
    
    public StockData(String symbol, Double currentPrice, Double openPrice, 
                    Double highPrice, Double lowPrice, Double previousClose, 
                    Long volume, LocalDateTime timestamp) {
        this.symbol = symbol;
        this.currentPrice = currentPrice;
        this.openPrice = openPrice;
        this.highPrice = highPrice;
        this.lowPrice = lowPrice;
        this.previousClose = previousClose;
        this.volume = volume;
        this.timestamp = timestamp;
        this.change = currentPrice - previousClose;
        this.changePercent = ((currentPrice - previousClose) / previousClose) * 100;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getSymbol() { return symbol; }
    public void setSymbol(String symbol) { this.symbol = symbol; }
    
    public Double getCurrentPrice() { return currentPrice; }
    public void setCurrentPrice(Double currentPrice) { 
        this.currentPrice = currentPrice;
        if (previousClose != null) {
            this.change = currentPrice - previousClose;
            this.changePercent = ((currentPrice - previousClose) / previousClose) * 100;
        }
    }
    
    public Double getOpenPrice() { return openPrice; }
    public void setOpenPrice(Double openPrice) { this.openPrice = openPrice; }
    
    public Double getHighPrice() { return highPrice; }
    public void setHighPrice(Double highPrice) { this.highPrice = highPrice; }
    
    public Double getLowPrice() { return lowPrice; }
    public void setLowPrice(Double lowPrice) { this.lowPrice = lowPrice; }
    
    public Double getPreviousClose() { return previousClose; }
    public void setPreviousClose(Double previousClose) { 
        this.previousClose = previousClose;
        if (currentPrice != null) {
            this.change = currentPrice - previousClose;
            this.changePercent = ((currentPrice - previousClose) / previousClose) * 100;
        }
    }
    
    public Long getVolume() { return volume; }
    public void setVolume(Long volume) { this.volume = volume; }
    
    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
    
    public Double getChangePercent() { return changePercent; }
    public void setChangePercent(Double changePercent) { this.changePercent = changePercent; }
    
    public Double getChange() { return change; }
    public void setChange(Double change) { this.change = change; }
}
