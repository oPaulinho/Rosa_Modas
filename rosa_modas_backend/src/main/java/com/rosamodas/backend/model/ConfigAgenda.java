package com.rosamodas.backend.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;

@Entity
public class ConfigAgenda {

    @Id
    private String id = "settings"; // ID fixo único para as configurações de agenda
    
    private Integer intervalo = 60; // em minutos
    private String horaInicio = "09:00";
    private String horaFim = "18:00";
    private String diasSemana = "1,2,3,4,5,6"; // Segunda a Sábado
    private String datasBloqueadas = ""; // Separadas por vírgula: YYYY-MM-DD
    private String numerosAdmin = ""; // Separados por vírgula

    public ConfigAgenda() {
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Integer getIntervalo() {
        return intervalo;
    }

    public void setIntervalo(Integer intervalo) {
        this.intervalo = intervalo;
    }

    public String getHoraInicio() {
        return horaInicio;
    }

    public void setHoraInicio(String horaInicio) {
        this.horaInicio = horaInicio;
    }

    public String getHoraFim() {
        return horaFim;
    }

    public void setHoraFim(String horaFim) {
        this.horaFim = horaFim;
    }

    public String getDiasSemana() {
        return diasSemana;
    }

    public void setDiasSemana(String diasSemana) {
        this.diasSemana = diasSemana;
    }

    public String getDatasBloqueadas() {
        return datasBloqueadas;
    }

    public void setDatasBloqueadas(String datasBloqueadas) {
        this.datasBloqueadas = datasBloqueadas;
    }

    public String getNumerosAdmin() {
        return numerosAdmin;
    }

    public void setNumerosAdmin(String numerosAdmin) {
        this.numerosAdmin = numerosAdmin;
    }
}
