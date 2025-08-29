package com.financial.analytics;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class FinancialAnalyticsApplication {
    public static void main(String[] args) {
        SpringApplication.run(FinancialAnalyticsApplication.class, args);
    }
}
