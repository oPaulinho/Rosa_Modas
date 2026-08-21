package com.rosamodas.backend.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class Servico {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String nome;
    private String descricao;
    private Double preco;
    private Integer duracaoMinutos;
    private String imagemUrl;
    private String status; // Disponível, Indisponível
    private String modalidades; // "PRESENCIAL,ONLINE" (vazio = configurável pelo administrador)
    private String site = "UNIVERSO_ROSA"; // ROSA_MODAS | UNIVERSO_ROSA
    private String icone; // emoji/ícone escolhido pelo admin (ex: 🔮, 🃏, ✦)

    public Servico() {
    }

    public Servico(String nome, String descricao, Double preco, Integer duracaoMinutos, String imagemUrl, String status) {
        this.nome = nome;
        this.descricao = descricao;
        this.preco = preco;
        this.duracaoMinutos = duracaoMinutos;
        this.imagemUrl = imagemUrl;
        this.status = status;
    }

    public Servico(String nome, String descricao, Double preco, Integer duracaoMinutos, String imagemUrl, String status, String modalidades, String site) {
        this(nome, descricao, preco, duracaoMinutos, imagemUrl, status);
        this.modalidades = modalidades;
        this.site = site;
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

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public Double getPreco() {
        return preco;
    }

    public void setPreco(Double preco) {
        this.preco = preco;
    }

    public Integer getDuracaoMinutos() {
        return duracaoMinutos;
    }

    public void setDuracaoMinutos(Integer duracaoMinutos) {
        this.duracaoMinutos = duracaoMinutos;
    }

    public String getImagemUrl() {
        return imagemUrl;
    }

    public void setImagemUrl(String imagemUrl) {
        this.imagemUrl = imagemUrl;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getModalidades() {
        return modalidades;
    }

    public void setModalidades(String modalidades) {
        this.modalidades = modalidades;
    }

    public String getSite() {
        return site;
    }

    public void setSite(String site) {
        this.site = site;
    }

    public String getIcone() {
        return icone;
    }

    public void setIcone(String icone) {
        this.icone = icone;
    }
}
