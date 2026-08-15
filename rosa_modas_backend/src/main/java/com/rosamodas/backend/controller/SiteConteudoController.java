package com.rosamodas.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import com.rosamodas.backend.model.SiteConteudo;
import com.rosamodas.backend.repository.SiteConteudoRepository;

@RestController
@RequestMapping("/api/conteudo")
@CrossOrigin(origins = "*")
public class SiteConteudoController {

    @Autowired
    private SiteConteudoRepository repository;

    @GetMapping
    public SiteConteudo get() {
        return repository.findById("main").orElseGet(() -> {
            SiteConteudo defaultContent = new SiteConteudo();
            defaultContent.setHeroTitulo("Beleza, Confiança e Autoestima");
            defaultContent.setHeroDescricao("Transforme seu visual com procedimentos capilares modernos, atendimento acolhedor e resultados que realçam sua autoestima.");
            defaultContent.setVantagensTitulo("Vantagens para Corpo e Mente");
            defaultContent.setVantagensDescricao("Além dos resultados visíveis no cabelo, nossos serviços também trazem bem-estar, autoconfiança e tranquilidade para o seu dia a dia.");
            defaultContent.setV1Titulo("Bem-estar emocional");
            defaultContent.setV1Desc("Mais que beleza, oferecemos um momento dedicado a você, para renovar sua energia e autoestima.");
            defaultContent.setV2Titulo("Confiança renovada");
            defaultContent.setV2Desc("Transformações que impactam sua imagem e ajudam você a se sentir mais segura e radiante.");
            defaultContent.setV3Titulo("Equilíbrio e suporte");
            defaultContent.setV3Desc("Cuidamos dos detalhes do seu visual, para que você possa também encontrar mais equilíbrio no seu dia.");
            defaultContent.setFooterSlogan("Da comunidade para o mundo, com força, beleza e espiritualidade.");
            return repository.save(defaultContent);
        });
    }

    @PostMapping
    public SiteConteudo save(@RequestBody SiteConteudo content) {
        content.setId("main");
        return repository.save(content);
    }
}
