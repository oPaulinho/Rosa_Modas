package com.rosamodas.backend.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class Produto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String nome;
    private Double preco;
    private String icone; // emoji/ícone do produto (ex: 👗, 👠, 🌹)
    private String status; // Disponível, Esgotado
    private String criadoEm;
    private String site = "ROSA_MODAS"; // ROSA_MODAS | UNIVERSO_ROSA

    public Produto() {
    }

    public Produto(String nome, Double preco, String icone, String status, String criadoEm) {
        this.nome = nome;
        this.preco = preco;
        this.icone = icone;
        this.status = status;
        this.criadoEm = criadoEm;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public Double getPreco() {
        return preco;
    }

    public void setPreco(Double preco) {
        this.preco = preco;
    }

    public String getIcone() {
        return icone;
    }

    public void setIcone(String icone) {
        this.icone = icone;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getCriadoEm() {
        return criadoEm;
    }

    public void setCriadoEm(String criadoEm) {
        this.criadoEm = criadoEm;
    }

    public String getSite() {
        return site;
    }

    public void setSite(String site) {
        this.site = site;
    }
}
