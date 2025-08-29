package com.financial.analytics.service;

import edu.stanford.nlp.ling.CoreAnnotations;
import edu.stanford.nlp.neural.rnn.RNNCoreAnnotations;
import edu.stanford.nlp.pipeline.Annotation;
import edu.stanford.nlp.pipeline.StanfordCoreNLP;
import edu.stanford.nlp.sentiment.SentimentCoreAnnotations;
import edu.stanford.nlp.trees.Tree;
import edu.stanford.nlp.util.CoreMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.util.List;
import java.util.Properties;

@Service
public class SentimentAnalysisService {
    
    private static final Logger logger = LoggerFactory.getLogger(SentimentAnalysisService.class);
    
    private StanfordCoreNLP pipeline;
    
    @PostConstruct
    public void init() {
        try {
            // Try with minimal configuration first
            Properties props = new Properties();
            props.setProperty("annotators", "tokenize,ssplit,pos,lemma");
            
            this.pipeline = new StanfordCoreNLP(props);
            logger.info("Stanford CoreNLP pipeline initialized with basic configuration");
        } catch (Exception e) {
            logger.error("Failed to initialize Stanford CoreNLP pipeline", e);
            // Use a fallback implementation
            this.pipeline = null;
            logger.warn("Sentiment analysis will use fallback implementation");
        }
    }
    
    public SentimentResult analyzeSentiment(String text) {
        if (text == null || text.trim().isEmpty()) {
            return new SentimentResult(0.0, "NEUTRAL", "Empty text");
        }
        
        if (pipeline == null) {
            // Use simple keyword-based sentiment analysis as fallback
            return analyzeWithKeywords(text);
        }
        
        try {
            Annotation document = new Annotation(text);
            pipeline.annotate(document);
            
            List<CoreMap> sentences = document.get(CoreAnnotations.SentencesAnnotation.class);
            
            if (sentences == null || sentences.isEmpty()) {
                return new SentimentResult(0.0, "NEUTRAL", "No sentences found");
            }
            
            double totalSentiment = 0.0;
            int sentenceCount = 0;
            
            for (CoreMap sentence : sentences) {
                Tree sentimentTree = sentence.get(SentimentCoreAnnotations.SentimentAnnotatedTree.class);
                if (sentimentTree != null) {
                    int sentimentScore = RNNCoreAnnotations.getPredictedClass(sentimentTree);
                    totalSentiment += sentimentScore;
                    sentenceCount++;
                }
            }
            
            if (sentenceCount == 0) {
                return new SentimentResult(0.0, "NEUTRAL", "No sentiment data");
            }
            
            double averageSentiment = totalSentiment / sentenceCount;
            String sentimentLabel = getSentimentLabel(averageSentiment);
            double normalizedScore = normalizeScore(averageSentiment);
            
            logger.debug("Analyzed sentiment for text: {} - Score: {}, Label: {}", 
                        text.substring(0, Math.min(50, text.length())), normalizedScore, sentimentLabel);
            
            return new SentimentResult(normalizedScore, sentimentLabel, "Analysis completed");
            
        } catch (Exception e) {
            logger.error("Error analyzing sentiment for text: {}", text.substring(0, Math.min(50, text.length())), e);
            return new SentimentResult(0.0, "NEUTRAL", "Analysis failed: " + e.getMessage());
        }
    }
    
    public double analyzeMarketSentiment(List<String> newsHeadlines) {
        if (newsHeadlines == null || newsHeadlines.isEmpty()) {
            return 0.0;
        }
        
        double totalSentiment = 0.0;
        int validAnalyses = 0;
        
        for (String headline : newsHeadlines) {
            SentimentResult result = analyzeSentiment(headline);
            if (!"Analysis failed".equals(result.getMessage().substring(0, Math.min(15, result.getMessage().length())))) {
                totalSentiment += result.getScore();
                validAnalyses++;
            }
        }
        
        if (validAnalyses == 0) {
            return 0.0;
        }
        
        double averageSentiment = totalSentiment / validAnalyses;
        logger.info("Market sentiment analysis completed. Average sentiment: {} from {} headlines", 
                   averageSentiment, validAnalyses);
        
        return averageSentiment;
    }
    
    private SentimentResult analyzeWithKeywords(String text) {
        String lowerText = text.toLowerCase();
        
        // Simple keyword-based sentiment analysis
        String[] positiveWords = {"good", "great", "excellent", "positive", "up", "rise", "gain", "profit", "buy", "bullish", "strong"};
        String[] negativeWords = {"bad", "terrible", "negative", "down", "fall", "loss", "sell", "bearish", "weak", "crash", "decline"};
        
        int positiveCount = 0;
        int negativeCount = 0;
        
        for (String word : positiveWords) {
            if (lowerText.contains(word)) positiveCount++;
        }
        
        for (String word : negativeWords) {
            if (lowerText.contains(word)) negativeCount++;
        }
        
        double score;
        String label;
        
        if (positiveCount > negativeCount) {
            score = 0.6; // Positive
            label = "POSITIVE";
        } else if (negativeCount > positiveCount) {
            score = -0.6; // Negative
            label = "NEGATIVE";
        } else {
            score = 0.0; // Neutral
            label = "NEUTRAL";
        }
        
        return new SentimentResult(score, label, "Keyword-based analysis");
    }
    
    private String getSentimentLabel(double score) {
        if (score < 1.5) return "VERY_NEGATIVE";
        if (score < 2.5) return "NEGATIVE";
        if (score < 3.5) return "NEUTRAL";
        if (score < 4.5) return "POSITIVE";
        return "VERY_POSITIVE";
    }
    
    private double normalizeScore(double score) {
        // Convert 0-4 scale to -1 to +1 scale
        return (score - 2.0) / 2.0;
    }
    
    public static class SentimentResult {
        private final double score;
        private final String label;
        private final String message;
        
        public SentimentResult(double score, String label, String message) {
            this.score = score;
            this.label = label;
            this.message = message;
        }
        
        public double getScore() { return score; }
        public String getLabel() { return label; }
        public String getMessage() { return message; }
    }
}
