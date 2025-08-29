package com.financial.analytics.controller;

import com.financial.analytics.service.SentimentAnalysisService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/sentiment")
@CrossOrigin(origins = "http://localhost:3000")
public class SentimentController {
    
    private static final Logger logger = LoggerFactory.getLogger(SentimentController.class);
    
    @Autowired
    private SentimentAnalysisService sentimentService;
    
    @PostMapping("/analyze")
    public ResponseEntity<SentimentAnalysisService.SentimentResult> analyzeSentiment(@RequestBody Map<String, String> request) {
        String text = request.get("text");
        
        if (text == null || text.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        
        SentimentAnalysisService.SentimentResult result = sentimentService.analyzeSentiment(text);
        return ResponseEntity.ok(result);
    }
    
    @PostMapping("/market")
    public ResponseEntity<Double> analyzeMarketSentiment(@RequestBody Map<String, List<String>> request) {
        List<String> headlines = request.get("headlines");
        
        if (headlines == null || headlines.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        
        double marketSentiment = sentimentService.analyzeMarketSentiment(headlines);
        logger.info("Market sentiment analysis completed: {}", marketSentiment);
        
        return ResponseEntity.ok(marketSentiment);
    }
}
