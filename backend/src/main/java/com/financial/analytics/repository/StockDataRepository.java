package com.financial.analytics.repository;

import com.financial.analytics.model.StockData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface StockDataRepository extends JpaRepository<StockData, Long> {
    
    Optional<StockData> findTopBySymbolOrderByTimestampDesc(String symbol);
    
    List<StockData> findBySymbolAndTimestampBetweenOrderByTimestampAsc(
        String symbol, LocalDateTime startDate, LocalDateTime endDate);
    
    List<StockData> findBySymbolOrderByTimestampDesc(String symbol);
    
    @Query("SELECT DISTINCT s.symbol FROM StockData s")
    List<String> findDistinctSymbols();
    
    @Query("SELECT s FROM StockData s WHERE s.symbol = :symbol ORDER BY s.timestamp DESC LIMIT :limit")
    List<StockData> findLatestBySymbol(@Param("symbol") String symbol, @Param("limit") int limit);
    
    @Query("SELECT s FROM StockData s WHERE s.timestamp >= :since ORDER BY s.timestamp DESC")
    List<StockData> findRecentData(@Param("since") LocalDateTime since);
}
