package com.financial.analytics.dto;

import java.time.LocalDateTime;
import java.util.List;

public class PredictionResponse {
    private String symbol;
    private List<Double> predictedPrices;
    private List<LocalDateTime> predictionDates;
    private Double confidence;
    private String modelUsed;
    private LocalDateTime generatedAt;
    // Optional: 95% prediction interval bounds (parallel to predictedPrices)
    private List<Double> lowerBounds;
    private List<Double> upperBounds;
    // Basic model performance metrics (computed on validation or training set)
    private Double mae;  // Mean Absolute Error
    private Double mape; // Mean Absolute Percentage Error
    private Double rmse; // Root Mean Squared Error
    
    // Constructors
    public PredictionResponse() {
        this.generatedAt = LocalDateTime.now();
    }
    
    public PredictionResponse(String symbol, List<Double> predictedPrices, 
                            List<LocalDateTime> predictionDates, Double confidence, String modelUsed) {
        this();
        this.symbol = symbol;
        this.predictedPrices = predictedPrices;
        this.predictionDates = predictionDates;
        this.confidence = confidence;
        this.modelUsed = modelUsed;
    }
    
    // Extended constructor including intervals and metrics
    public PredictionResponse(String symbol,
                              List<Double> predictedPrices,
                              List<LocalDateTime> predictionDates,
                              Double confidence,
                              String modelUsed,
                              List<Double> lowerBounds,
                              List<Double> upperBounds,
                              Double mae,
                              Double mape,
                              Double rmse) {
        this(symbol, predictedPrices, predictionDates, confidence, modelUsed);
        this.lowerBounds = lowerBounds;
        this.upperBounds = upperBounds;
        this.mae = mae;
        this.mape = mape;
        this.rmse = rmse;
    }
    
    // Getters and Setters
    public String getSymbol() { return symbol; }
    public void setSymbol(String symbol) { this.symbol = symbol; }
    
    public List<Double> getPredictedPrices() { return predictedPrices; }
    public void setPredictedPrices(List<Double> predictedPrices) { this.predictedPrices = predictedPrices; }
    
    public List<LocalDateTime> getPredictionDates() { return predictionDates; }
    public void setPredictionDates(List<LocalDateTime> predictionDates) { this.predictionDates = predictionDates; }
    
    public Double getConfidence() { return confidence; }
    public void setConfidence(Double confidence) { this.confidence = confidence; }
    
    public String getModelUsed() { return modelUsed; }
    public void setModelUsed(String modelUsed) { this.modelUsed = modelUsed; }
    
    public LocalDateTime getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(LocalDateTime generatedAt) { this.generatedAt = generatedAt; }
    
    public List<Double> getLowerBounds() { return lowerBounds; }
    public void setLowerBounds(List<Double> lowerBounds) { this.lowerBounds = lowerBounds; }
    
    public List<Double> getUpperBounds() { return upperBounds; }
    public void setUpperBounds(List<Double> upperBounds) { this.upperBounds = upperBounds; }
    
    public Double getMae() { return mae; }
    public void setMae(Double mae) { this.mae = mae; }
    
    public Double getMape() { return mape; }
    public void setMape(Double mape) { this.mape = mape; }
    
    public Double getRmse() { return rmse; }
    public void setRmse(Double rmse) { this.rmse = rmse; }
}
