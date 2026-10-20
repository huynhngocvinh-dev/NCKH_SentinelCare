package com.backend.SentinelCare.repository;

import com.backend.SentinelCare.model.Feature;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FeatureRepository extends JpaRepository<Feature, Integer> {
}