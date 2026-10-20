package com.backend.SentinelCare.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "features")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Feature {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true, length = 50)
    private String code; 

    @Column(nullable = false, length = 100)
    private String name;
}