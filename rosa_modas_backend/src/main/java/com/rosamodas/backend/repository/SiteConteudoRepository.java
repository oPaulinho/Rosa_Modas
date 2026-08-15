package com.rosamodas.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.rosamodas.backend.model.SiteConteudo;

@Repository
public interface SiteConteudoRepository extends JpaRepository<SiteConteudo, String> {
}
