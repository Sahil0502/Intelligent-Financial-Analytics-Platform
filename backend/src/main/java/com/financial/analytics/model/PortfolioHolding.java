package com.financial.analytics.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "portfolio_holding")
public class PortfolioHolding {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "portfolio_id", nullable = false)
    @JsonBackReference
    private Portfolio portfolio;
    
    @Column(nullable = false)
    private String symbol;
    
    @Column(nullable = false)
    private Integer quantity;
    
    @Column(nullable = false)
    private Double averagePrice;
    
    @Column(nullable = false)
    private Double currentPrice;
    
    @Column(nullable = false)
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime purchaseDate;
    
    @Column(nullable = false)
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updatedAt;
    
    // Constructors
    public PortfolioHolding() {
        this.updatedAt = LocalDateTime.now();
    }
    
    public PortfolioHolding(Portfolio portfolio, String symbol, Integer quantity, 
                           Double averagePrice, LocalDateTime purchaseDate) {
        this();
        this.portfolio = portfolio;
        this.symbol = symbol;
        this.quantity = quantity;
        this.averagePrice = averagePrice;
        this.currentPrice = averagePrice;
        this.purchaseDate = purchaseDate;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public Portfolio getPortfolio() { return portfolio; }
    public void setPortfolio(Portfolio portfolio) { this.portfolio = portfolio; }
    
    public String getSymbol() { return symbol; }
    public void setSymbol(String symbol) { this.symbol = symbol; }
    
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    
    public Double getAveragePrice() { return averagePrice; }
    public void setAveragePrice(Double averagePrice) { this.averagePrice = averagePrice; }
    
    public Double getCurrentPrice() { return currentPrice; }
    public void setCurrentPrice(Double currentPrice) { 
        this.currentPrice = currentPrice;
        this.updatedAt = LocalDateTime.now();
    }
    
    public LocalDateTime getPurchaseDate() { return purchaseDate; }
    public void setPurchaseDate(LocalDateTime purchaseDate) { this.purchaseDate = purchaseDate; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    // Helper methods
    public Double getTotalValue() {
        return currentPrice * quantity;
    }
    
    public Double getTotalInvestment() {
        return averagePrice * quantity;
    }
    
    public Double getGainLoss() {
        return getTotalValue() - getTotalInvestment();
    }
    
    public Double getGainLossPercentage() {
        if (getTotalInvestment() == 0) return 0.0;
        return (getGainLoss() / getTotalInvestment()) * 100;
    }
}
