package com.rosamodas.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.rosamodas.backend.model.ConfigAgenda;

@Repository
public interface ConfigAgendaRepository extends JpaRepository<ConfigAgenda, String> {
}
