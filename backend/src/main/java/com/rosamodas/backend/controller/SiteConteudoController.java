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
    public SiteConteudo get(@RequestParam(required = false) String site) {
        String siteKey = (site == null || site.isBlank()) ? "UNIVERSO_ROSA" : site.trim();

        return repository.findById(siteKey).orElseGet(() -> {
            // Migra o registro antigo (id "main") para o site espiritual
            if ("UNIVERSO_ROSA".equals(siteKey) && repository.existsById("main")) {
                SiteConteudo legacy = repository.findById("main").get();
                SiteConteudo novo = new SiteConteudo();
                novo.setId("UNIVERSO_ROSA");
                novo.setSite("UNIVERSO_ROSA");
                novo.setHeroTitulo(legacy.getHeroTitulo());
                novo.setHeroDescricao(legacy.getHeroDescricao());
                novo.setVantagensTitulo(legacy.getVantagensTitulo());
                novo.setVantagensDescricao(legacy.getVantagensDescricao());
                novo.setV1Titulo(legacy.getV1Titulo());
                novo.setV1Desc(legacy.getV1Desc());
                novo.setV2Titulo(legacy.getV2Titulo());
                novo.setV2Desc(legacy.getV2Desc());
                novo.setV3Titulo(legacy.getV3Titulo());
                novo.setV3Desc(legacy.getV3Desc());
                novo.setFooterSlogan(legacy.getFooterSlogan());
                repository.delete(legacy);
                return repository.save(novo);
            }

            SiteConteudo defaultContent = new SiteConteudo();
            defaultContent.setId(siteKey);
            defaultContent.setSite(siteKey);

            if ("ROSA_MODAS".equals(siteKey)) {
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
            } else {
                defaultContent.setHeroTitulo("Reflexão, Equilíbrio e Cuidado Espiritual");
                defaultContent.setHeroDescricao("Um espaço de acolhimento, orientação e conexão, preparado para oferecer momentos de reflexão, equilíbrio e cuidado espiritual.");
                defaultContent.setVantagensTitulo("Vantagens para Corpo e Mente");
                defaultContent.setVantagensDescricao("Cuidados que renovam a energia e trazem equilíbrio para o seu dia a dia.");
                defaultContent.setV1Titulo("Bem-estar emocional");
                defaultContent.setV1Desc("Um momento dedicado a você, para renovar sua energia e encontrar tranquilidade.");
                defaultContent.setV2Titulo("Confiança renovada");
                defaultContent.setV2Desc("Atendimentos acolhedores que ajudam você a se sentir mais segura e em paz.");
                defaultContent.setV3Titulo("Equilíbrio e suporte");
                defaultContent.setV3Desc("Cuidamos de cada detalhe para você encontrar mais equilíbrio e serenidade.");
                defaultContent.setFooterSlogan("Acolhimento, orientação e espiritualidade.");
            }

            return repository.save(defaultContent);
        });
    }

    @PostMapping
    public SiteConteudo save(@RequestBody SiteConteudo content) {
        String siteKey = (content.getSite() == null || content.getSite().isBlank()) ? "UNIVERSO_ROSA" : content.getSite().trim();
        content.setId(siteKey);
        content.setSite(siteKey);
        return repository.save(content);
    }
}