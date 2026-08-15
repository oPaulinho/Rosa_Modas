package com.rosamodas.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.rosamodas.backend.model.Promocao;

@Repository
public interface PromocaoRepository extends JpaRepository<Promocao, Long> {
}
