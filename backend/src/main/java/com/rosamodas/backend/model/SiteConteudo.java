package com.rosamodas.backend.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;

@Entity
public class SiteConteudo {

    @Id
    private String id = "main"; // ID = site (ROSA_MODAS ou UNIVERSO_ROSA)
    
    private String site = "UNIVERSO_ROSA";
    
    private String heroTitulo;
    private String heroDescricao;
    private String vantagensTitulo;
    private String vantagensDescricao;
    
    private String v1Titulo;
    private String v1Desc;
    private String v2Titulo;
    private String v2Desc;
    private String v3Titulo;
    private String v3Desc;
    
    private String footerSlogan;

    public SiteConteudo() {
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getSite() {
        return site;
    }

    public void setSite(String site) {
        this.site = site;
    }

    public String getHeroTitulo() {
        return heroTitulo;
    }

    public void setHeroTitulo(String heroTitulo) {
        this.heroTitulo = heroTitulo;
    }

    public String getHeroDescricao() {
        return heroDescricao;
    }

    public void setHeroDescricao(String heroDescricao) {
        this.heroDescricao = heroDescricao;
    }

    public String getVantagensTitulo() {
        return vantagensTitulo;
    }

    public void setVantagensTitulo(String vantagensTitulo) {
        this.vantagensTitulo = vantagensTitulo;
    }

    public String getVantagensDescricao() {
        return vantagensDescricao;
    }

    public void setVantagensDescricao(String vantagensDescricao) {
        this.vantagensDescricao = vantagensDescricao;
    }

    public String getV1Titulo() {
        return v1Titulo;
    }

    public void setV1Titulo(String v1Titulo) {
        this.v1Titulo = v1Titulo;
    }

    public String getV1Desc() {
        return v1Desc;
    }

    public void setV1Desc(String v1Desc) {
        this.v1Desc = v1Desc;
    }

    public String getV2Titulo() {
        return v2Titulo;
    }

    public void setV2Titulo(String v2Titulo) {
        this.v2Titulo = v2Titulo;
    }

    public String getV2Desc() {
        return v2Desc;
    }

    public void setV2Desc(String v2Desc) {
        this.v2Desc = v2Desc;
    }

    public String getV3Titulo() {
        return v3Titulo;
    }

    public void setV3Titulo(String v3Titulo) {
        this.v3Titulo = v3Titulo;
    }

    public String getV3Desc() {
        return v3Desc;
    }

    public void setV3Desc(String v3Desc) {
        this.v3Desc = v3Desc;
    }

    public String getFooterSlogan() {
        return footerSlogan;
    }

    public void setFooterSlogan(String footerSlogan) {
        this.footerSlogan = footerSlogan;
    }
}
