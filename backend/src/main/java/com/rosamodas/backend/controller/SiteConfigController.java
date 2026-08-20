package com.rosamodas.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import com.rosamodas.backend.model.SiteConfig;
import com.rosamodas.backend.repository.SiteConfigRepository;

@RestController
@RequestMapping("/api/site-config")
@CrossOrigin(origins = "*")
public class SiteConfigController {

    @Autowired
    private SiteConfigRepository repository;

    @GetMapping
    public SiteConfig get() {
        return repository.findById("main").orElseGet(() -> {
            SiteConfig defaultConfig = new SiteConfig();
            defaultConfig.setEndereco("Rua Nova Esperança, 402 - Bairro da Inamar - Diadema/SP");
            defaultConfig.setTelefone("(11) 95872-3409");
            defaultConfig.setWhatsapp("5511958723409");
            defaultConfig.setEmail("roseaneamarasilvaa@gmail.com");
            defaultConfig.setInstagram("bela_rosasalao");
            return repository.save(defaultConfig);
        });
    }

    @PostMapping
    public SiteConfig save(@RequestBody SiteConfig config) {
        config.setId("main");
        return repository.save(config);
    }
}
