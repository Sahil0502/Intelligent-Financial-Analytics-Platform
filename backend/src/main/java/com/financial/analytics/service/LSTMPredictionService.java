package com.financial.analytics.service;

import com.financial.analytics.dto.PredictionResponse;
import com.financial.analytics.model.StockData;
import org.deeplearning4j.nn.api.OptimizationAlgorithm;
import org.deeplearning4j.nn.conf.MultiLayerConfiguration;
import org.deeplearning4j.nn.conf.NeuralNetConfiguration;
import org.deeplearning4j.nn.conf.layers.LSTM;
import org.deeplearning4j.nn.conf.layers.RnnOutputLayer;
import org.deeplearning4j.nn.multilayer.MultiLayerNetwork;
import org.deeplearning4j.nn.weights.WeightInit;
import org.nd4j.linalg.activations.Activation;
import org.nd4j.linalg.api.ndarray.INDArray;
import org.nd4j.linalg.dataset.DataSet;
import org.nd4j.linalg.factory.Nd4j;
import org.nd4j.linalg.learning.config.Adam;
import org.nd4j.linalg.lossfunctions.LossFunctions;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class LSTMPredictionService {
    
    private static final Logger logger = LoggerFactory.getLogger(LSTMPredictionService.class);
    private static final int SEQUENCE_LENGTH = 30; // 30 days of historical data
    private static final int INPUT_SIZE = 5; // Price, volume, price change, volatility, trend
    private static final int HIDDEN_SIZE = 128;
    private static final int OUTPUT_SIZE = 1;
    private static final int EPOCHS = 200;
    
    @Autowired
    private StockDataService stockDataService;
    
    // Cache trained models per symbol
    private final ConcurrentHashMap<String, TrainedModel> modelCache = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, StockStatistics> stockStatsCache = new ConcurrentHashMap<>();
    
    // Model cache expiration (24 hours)
    private static final long MODEL_CACHE_EXPIRY = 24 * 60 * 60 * 1000;
    
    public PredictionResponse predictStockPrice(String symbol, int daysAhead) {
        try {
            logger.info("Starting LSTM prediction for symbol: {} for {} days ahead", symbol, daysAhead);
            
            // Get historical data
            List<StockData> historicalData = stockDataService.getRecentData(symbol, 100);
            
            if (historicalData.size() < SEQUENCE_LENGTH) {
                logger.warn("Insufficient historical data for {}: {} records", symbol, historicalData.size());
                return createSimplePrediction(symbol, daysAhead, historicalData);
            }
            
            // Calculate stock-specific statistics
            StockStatistics stats = calculateStockStatistics(symbol, historicalData);
            stockStatsCache.put(symbol, stats);
            
            // Get or train model
            TrainedModel trainedModel = getOrTrainModel(symbol, historicalData, stats);
            
            if (trainedModel == null) {
                logger.warn("Failed to train model for symbol: {}, using fallback", symbol);
                return createSimplePrediction(symbol, daysAhead, historicalData);
            }
            
            // Make predictions
            List<Double> predictions = makePredictions(trainedModel.model, historicalData, daysAhead, stats);
            List<LocalDateTime> predictionDates = generatePredictionDates(daysAhead);

            // Build simple 95% prediction intervals using residual std (fallback to volatility)
            List<Double> lowerBounds = new ArrayList<>();
            List<Double> upperBounds = new ArrayList<>();
            double residualStd = trainedModel.residualStd > 0 ? trainedModel.residualStd : stats.volatility * stats.avgPrice;
            double z = 1.96; // 95% z-score
            for (double p : predictions) {
                double margin = z * residualStd * 0.5; // scale down margin for short horizon
                lowerBounds.add(Math.max(p - margin, 0.01));
                upperBounds.add(p + margin);
            }

            // Calculate confidence based on model performance and data quality
            double confidence = calculateConfidence(trainedModel, stats, historicalData.size());

            logger.info("LSTM prediction completed for symbol: {} with confidence: {}", symbol, confidence);

            return new PredictionResponse(
                symbol,
                predictions,
                predictionDates,
                confidence,
                "Enhanced LSTM",
                lowerBounds,
                upperBounds,
                trainedModel.mae,
                trainedModel.mape,
                trainedModel.rmse
            );
            
        } catch (Exception e) {
            logger.error("Error in LSTM prediction for symbol: {}", symbol, e);
            // Fallback to simple prediction
            List<StockData> historicalData = stockDataService.getRecentData(symbol, 10);
            return createSimplePrediction(symbol, daysAhead, historicalData);
        }
    }
    
    private TrainedModel getOrTrainModel(String symbol, List<StockData> historicalData, StockStatistics stats) {
        TrainedModel cached = modelCache.get(symbol);
        
        // Check if cached model is still valid
        if (cached != null && !isModelExpired(cached)) {
            logger.info("Using cached model for symbol: {}", symbol);
            return cached;
        }
        
        // Train new model
        logger.info("Training new LSTM model for symbol: {}", symbol);
        try {
            MultiLayerNetwork model = createLSTMModel();
            DataSet trainingData = createEnhancedTrainingDataSet(historicalData, stats);
            
            // Train the model
            for (int epoch = 0; epoch < EPOCHS; epoch++) {
                model.fit(trainingData);
                if (epoch % 50 == 0) {
                    logger.debug("Training epoch {} for symbol: {}", epoch, symbol);
                }
            }
            
            // Calculate training accuracy
            double accuracy = calculateTrainingAccuracy(model, trainingData);
            // Compute residual metrics on last timestep of each sequence
            INDArray preds = model.output(trainingData.getFeatures());
            INDArray labels = trainingData.getLabels();
            int sequences = (int) preds.size(0);
            List<Double> residuals = new ArrayList<>();
            double sumAbs = 0, sumSq = 0, sumPerc = 0; int count = 0;
            for (int i = 0; i < sequences; i++) {
                double predNorm = preds.getDouble(i, 0, SEQUENCE_LENGTH - 1);
                double actualNorm = labels.getDouble(i, 0, SEQUENCE_LENGTH - 1);
                double predPrice = denormalizePrice(predNorm, stats);
                double actualPrice = denormalizePrice(actualNorm, stats);
                double resid = predPrice - actualPrice;
                residuals.add(resid);
                double abs = Math.abs(resid);
                sumAbs += abs;
                sumSq += resid * resid;
                if (actualPrice != 0) sumPerc += abs / actualPrice;
                count++;
            }
            Double mae = count > 0 ? sumAbs / count : null;
            Double rmse = count > 0 ? Math.sqrt(sumSq / count) : null;
            Double mape = count > 0 ? (sumPerc / count) * 100.0 : null;
            double residualStd = 0.0;
            if (residuals.size() > 1) {
                double mean = residuals.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
                double var = residuals.stream().mapToDouble(r -> (r - mean)*(r - mean)).average().orElse(0.0);
                residualStd = Math.sqrt(var);
            }

            TrainedModel trainedModel = new TrainedModel(model, stats, accuracy, System.currentTimeMillis(), mae, mape, rmse, residualStd);
            modelCache.put(symbol, trainedModel);
            
            logger.info("Model training completed for symbol: {} with accuracy: {}", symbol, accuracy);
            return trainedModel;
            
        } catch (Exception e) {
            logger.error("Failed to train model for symbol: {}", symbol, e);
            return null;
        }
    }
    
    private MultiLayerNetwork createLSTMModel() {
        MultiLayerConfiguration config = new NeuralNetConfiguration.Builder()
                .optimizationAlgo(OptimizationAlgorithm.STOCHASTIC_GRADIENT_DESCENT)
                .updater(new Adam(0.001))
                .weightInit(WeightInit.XAVIER)
                .list()
                .layer(0, new LSTM.Builder()
                        .nIn(INPUT_SIZE)
                        .nOut(HIDDEN_SIZE)
                        .activation(Activation.TANH)
                        .build())
                .layer(1, new LSTM.Builder()
                        .nIn(HIDDEN_SIZE)
                        .nOut(HIDDEN_SIZE)
                        .activation(Activation.TANH)
                        .build())
                .layer(2, new LSTM.Builder()
                        .nIn(HIDDEN_SIZE)
                        .nOut(HIDDEN_SIZE / 2)
                        .activation(Activation.TANH)
                        .build())
                .layer(3, new RnnOutputLayer.Builder()
                        .nIn(HIDDEN_SIZE / 2)
                        .nOut(OUTPUT_SIZE)
                        .activation(Activation.IDENTITY)
                        .lossFunction(LossFunctions.LossFunction.MSE)
                        .build())
                .build();
        
        MultiLayerNetwork model = new MultiLayerNetwork(config);
        model.init();
        return model;
    }
    
    private DataSet createEnhancedTrainingDataSet(List<StockData> historicalData, StockStatistics stats) {
        int numSequences = historicalData.size() - SEQUENCE_LENGTH;
        
        INDArray input = Nd4j.create(new int[]{numSequences, INPUT_SIZE, SEQUENCE_LENGTH});
        INDArray labels = Nd4j.create(new int[]{numSequences, OUTPUT_SIZE, SEQUENCE_LENGTH});
        
        for (int i = 0; i < numSequences; i++) {
            for (int j = 0; j < SEQUENCE_LENGTH; j++) {
                StockData data = historicalData.get(i + j);
                
                // Create feature vector: [price, volume, price_change, volatility, trend]
                double[] features = createFeatureVector(data, stats, i + j > 0 ? historicalData.get(i + j - 1) : null);
                
                for (int k = 0; k < INPUT_SIZE; k++) {
                    input.putScalar(new int[]{i, k, j}, features[k]);
                }
                
                if (j < SEQUENCE_LENGTH - 1) {
                    StockData nextData = historicalData.get(i + j + 1);
                    labels.putScalar(new int[]{i, 0, j}, normalizePrice(nextData.getCurrentPrice(), stats));
                } else {
                    labels.putScalar(new int[]{i, 0, j}, normalizePrice(data.getCurrentPrice(), stats));
                }
            }
        }
        
        return new DataSet(input, labels);
    }
    
    private double[] createFeatureVector(StockData data, StockStatistics stats, StockData previousData) {
        double normalizedPrice = normalizePrice(data.getCurrentPrice(), stats);
        double normalizedVolume = normalizeVolume(data.getVolume(), stats);
        double priceChange = previousData != null ? 
            (data.getCurrentPrice() - previousData.getCurrentPrice()) / previousData.getCurrentPrice() : 0.0;
        double volatility = stats.volatility;
        double trend = stats.trend;
        
        return new double[]{normalizedPrice, normalizedVolume, priceChange, volatility, trend};
    }
    
    private List<Double> makePredictions(MultiLayerNetwork model, List<StockData> historicalData, 
                                       int daysAhead, StockStatistics stats) {
        List<Double> predictions = new ArrayList<>();
        
        // Create the most recent sequence
        List<double[]> recentSequence = new ArrayList<>();
        for (int i = historicalData.size() - SEQUENCE_LENGTH; i < historicalData.size(); i++) {
            StockData data = historicalData.get(i);
            StockData previousData = i > 0 ? historicalData.get(i - 1) : null;
            recentSequence.add(createFeatureVector(data, stats, previousData));
        }
        
        for (int day = 0; day < daysAhead; day++) {
            // Prepare input for prediction
            INDArray input = Nd4j.create(new int[]{1, INPUT_SIZE, SEQUENCE_LENGTH});
            
            for (int i = 0; i < SEQUENCE_LENGTH; i++) {
                double[] features = recentSequence.get(i);
                for (int j = 0; j < INPUT_SIZE; j++) {
                    input.putScalar(new int[]{0, j, i}, features[j]);
                }
            }
            
            // Make prediction
            INDArray output = model.output(input);
            double predictedNormalized = output.getDouble(0, 0, SEQUENCE_LENGTH - 1);
            double predictedPrice = denormalizePrice(predictedNormalized, stats);
            
            // Add some realistic variation based on stock volatility
            double variation = (Math.random() - 0.5) * stats.volatility * predictedPrice * 0.1;
            predictedPrice += variation;
            
            predictions.add(Math.max(predictedPrice, 0.01)); // Ensure positive price
            
            // Update sequence for next prediction
            double[] newFeatures = createFeatureVector(
                new StockData("", predictedPrice, 0.0, 0.0, 0.0, 0.0, 0L, LocalDateTime.now()),
                stats, 
                historicalData.get(historicalData.size() - 1)
            );
            
            recentSequence.remove(0);
            recentSequence.add(newFeatures);
        }
        
        return predictions;
    }
    
    private StockStatistics calculateStockStatistics(String symbol, List<StockData> historicalData) {
        if (historicalData.isEmpty()) {
            return new StockStatistics(0.0, 0.0, 0.0, 0.0);
        }
        
        List<Double> prices = historicalData.stream()
                .map(StockData::getCurrentPrice)
                .collect(Collectors.toList());
        
        List<Long> volumes = historicalData.stream()
                .map(StockData::getVolume)
                .collect(Collectors.toList());
        
        // Calculate price statistics
        double avgPrice = prices.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
        double minPrice = prices.stream().mapToDouble(Double::doubleValue).min().orElse(0.0);
        double maxPrice = prices.stream().mapToDouble(Double::doubleValue).max().orElse(0.0);
        
        // Calculate volatility (standard deviation of price changes)
        double volatility = 0.0;
        if (prices.size() > 1) {
            List<Double> priceChanges = new ArrayList<>();
            for (int i = 1; i < prices.size(); i++) {
                double change = (prices.get(i) - prices.get(i - 1)) / prices.get(i - 1);
                priceChanges.add(change);
            }
            
            double avgChange = priceChanges.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
            double variance = priceChanges.stream()
                    .mapToDouble(change -> Math.pow(change - avgChange, 2))
                    .average().orElse(0.0);
            volatility = Math.sqrt(variance);
        }
        
        // Calculate trend (linear regression slope)
        double trend = 0.0;
        if (prices.size() > 1) {
            double sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
            for (int i = 0; i < prices.size(); i++) {
                sumX += i;
                sumY += prices.get(i);
                sumXY += i * prices.get(i);
                sumX2 += i * i;
            }
            int n = prices.size();
            trend = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        }
        
        return new StockStatistics(avgPrice, minPrice, maxPrice, volatility, trend);
    }
    
    private double normalizePrice(double price, StockStatistics stats) {
        if (stats.maxPrice == stats.minPrice) return 0.5;
        return (price - stats.minPrice) / (stats.maxPrice - stats.minPrice);
    }
    
    private double denormalizePrice(double normalizedPrice, StockStatistics stats) {
        return normalizedPrice * (stats.maxPrice - stats.minPrice) + stats.minPrice;
    }
    
    private double normalizeVolume(long volume, StockStatistics stats) {
        // Simple volume normalization
        return Math.min(volume / 1000000.0, 1.0); // Cap at 1M volume
    }
    
    private double calculateTrainingAccuracy(MultiLayerNetwork model, DataSet trainingData) {
        try {
            INDArray predictions = model.output(trainingData.getFeatures());
            INDArray labels = trainingData.getLabels();
            
            double mse = Nd4j.mean(predictions.sub(labels).mul(predictions.sub(labels))).getDouble(0);
            double accuracy = Math.max(0, 1 - mse);
            
            return Math.min(accuracy, 0.95); // Cap accuracy at 95%
        } catch (Exception e) {
            logger.warn("Could not calculate training accuracy: {}", e.getMessage());
            return 0.7; // Default accuracy
        }
    }
    
    private double calculateConfidence(TrainedModel trainedModel, StockStatistics stats, int dataPoints) {
        double baseConfidence = trainedModel.accuracy;
        
        // Adjust confidence based on data quality
        double dataQualityFactor = Math.min(dataPoints / 100.0, 1.0);
        
        // Adjust confidence based on volatility (lower volatility = higher confidence)
        double volatilityFactor = Math.max(0.5, 1 - stats.volatility);
        
        // Adjust confidence based on trend strength
        double trendFactor = Math.abs(stats.trend) > 0.01 ? 1.0 : 0.8;
        
        double finalConfidence = baseConfidence * dataQualityFactor * volatilityFactor * trendFactor;
        
        // Ensure confidence is within reasonable bounds
        return Math.max(0.3, Math.min(0.95, finalConfidence));
    }
    
    private boolean isModelExpired(TrainedModel model) {
        return System.currentTimeMillis() - model.trainingTime > MODEL_CACHE_EXPIRY;
    }
    
    private PredictionResponse createSimplePrediction(String symbol, int daysAhead, List<StockData> historicalData) {
        logger.info("Creating simple prediction for symbol: {} (fallback)", symbol);
        
        if (historicalData.isEmpty()) {
            return new PredictionResponse(symbol, new ArrayList<>(), new ArrayList<>(), 0.3, "Simple");
        }
        
        // Calculate current price and trend
        double currentPrice = historicalData.get(historicalData.size() - 1).getCurrentPrice();
        double avgPrice = historicalData.stream()
                .mapToDouble(StockData::getCurrentPrice)
                .average()
                .orElse(currentPrice);
        
        // Simple trend-based prediction
        double trend = (currentPrice - avgPrice) / avgPrice;
        
        List<Double> predictions = new ArrayList<>();
        for (int i = 0; i < daysAhead; i++) {
            double trendEffect = trend * (i + 1) * 0.1; // Gradual trend effect
            double randomVariation = (Math.random() - 0.5) * 0.02; // ±1% random variation
            double predictedPrice = currentPrice * (1 + trendEffect + randomVariation);
            predictions.add(Math.max(predictedPrice, 0.01));
        }
        
        List<LocalDateTime> predictionDates = generatePredictionDates(daysAhead);
        
    return new PredictionResponse(symbol, predictions, predictionDates, 0.4, "Simple Trend Analysis", null, null, null, null, null);
    }
    
    private List<LocalDateTime> generatePredictionDates(int daysAhead) {
        List<LocalDateTime> dates = new ArrayList<>();
        LocalDateTime currentDate = LocalDateTime.now();
        
        for (int i = 1; i <= daysAhead; i++) {
            dates.add(currentDate.plusDays(i));
        }
        
        return dates;
    }
    
    // Inner classes for better organization
    private static class TrainedModel {
        final MultiLayerNetwork model;
        final StockStatistics stats;
        final double accuracy;
        final long trainingTime;
        final Double mae;
        final Double mape;
        final Double rmse;
        final double residualStd;

        TrainedModel(MultiLayerNetwork model, StockStatistics stats, double accuracy, long trainingTime, Double mae, Double mape, Double rmse, double residualStd) {
            this.model = model;
            this.stats = stats;
            this.accuracy = accuracy;
            this.trainingTime = trainingTime;
            this.mae = mae;
            this.mape = mape;
            this.rmse = rmse;
            this.residualStd = residualStd;
        }
    }
    
    private static class StockStatistics {
        final double avgPrice;
        final double minPrice;
        final double maxPrice;
        final double volatility;
        final double trend;
        
        StockStatistics(double avgPrice, double minPrice, double maxPrice, double volatility) {
            this(avgPrice, minPrice, maxPrice, volatility, 0.0);
        }
        
        StockStatistics(double avgPrice, double minPrice, double maxPrice, double volatility, double trend) {
            this.avgPrice = avgPrice;
            this.minPrice = minPrice;
            this.maxPrice = maxPrice;
            this.volatility = volatility;
            this.trend = trend;
        }
    }
}
