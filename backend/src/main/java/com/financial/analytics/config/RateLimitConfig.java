package com.financial.analytics.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

import java.util.concurrent.ConcurrentHashMap;

@Configuration
@EnableScheduling
public class RateLimitConfig {

    private final ConcurrentHashMap<String, Integer> requestCountMap = new ConcurrentHashMap<>();
    
    @Bean
    public ConcurrentHashMap<String, Integer> requestCache() {
        return requestCountMap;
    }
    
    @Bean
    public ConcurrentHashMap<String, Long> rateLimitLastResetMap() {
        return new ConcurrentHashMap<>();
    }
    
    @Bean
    public CacheManager cacheManager() {
        return new ConcurrentMapCacheManager();
    }
    
    @Scheduled(fixedRate = 60000) // Clear counters every minute
    public void resetRequestCounts() {
        requestCountMap.clear();
    }
}
