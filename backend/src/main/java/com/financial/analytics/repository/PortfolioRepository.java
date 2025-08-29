package com.financial.analytics.repository;

import com.financial.analytics.model.Portfolio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PortfolioRepository extends JpaRepository<Portfolio, Long> {
    
    List<Portfolio> findAllByOrderByCreatedAtDesc();
    
    Optional<Portfolio> findByName(String name);
    
    boolean existsByName(String name);
}
