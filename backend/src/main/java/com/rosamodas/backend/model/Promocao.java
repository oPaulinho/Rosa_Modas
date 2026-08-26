package com.rosamodas.backend.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class Promocao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String titulo;
    private String descricao;
    private String status; // ativa, inativa
    private String dataInicio; // YYYY-MM-DD
    private String dataFim; // YYYY-MM-DD
    private String site = "ROSA_MODAS"; // ROSA_MODAS | UNIVERSO_ROSA

    public Promocao() {
    }

    public Promocao(String titulo, String descricao, String status, String dataInicio, String dataFim) {
        this.titulo = titulo;
        this.descricao = descricao;
        this.status = status;
        this.dataInicio = dataInicio;
        this.dataFim = dataFim;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitulo() {
        return titulo;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getDataInicio() {
        return dataInicio;
    }

    public void setDataInicio(String dataInicio) {
        this.dataInicio = dataInicio;
    }

    public String getDataFim() {
        return dataFim;
    }

    public void setDataFim(String dataFim) {
        this.dataFim = dataFim;
    }

    public String getSite() {
        return site;
    }

    public void setSite(String site) {
        this.site = site;
    }
}
