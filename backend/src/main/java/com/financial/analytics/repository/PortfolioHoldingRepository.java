package com.financial.analytics.repository;

import com.financial.analytics.model.PortfolioHolding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PortfolioHoldingRepository extends JpaRepository<PortfolioHolding, Long> {
    
    List<PortfolioHolding> findByPortfolioId(Long portfolioId);
    
    Optional<PortfolioHolding> findByPortfolioIdAndSymbol(Long portfolioId, String symbol);
    
    @Query("SELECT DISTINCT h.symbol FROM PortfolioHolding h")
    List<String> findDistinctSymbols();
    
    @Query("SELECT h FROM PortfolioHolding h WHERE h.symbol = :symbol")
    List<PortfolioHolding> findBySymbol(@Param("symbol") String symbol);
}
