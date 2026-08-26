package com.rosamodas.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import com.rosamodas.backend.model.ConfigAgenda;
import com.rosamodas.backend.repository.ConfigAgendaRepository;

@RestController
@RequestMapping("/api/config-agenda")
@CrossOrigin(origins = "*")
public class ConfigAgendaController {

    @Autowired
    private ConfigAgendaRepository repository;

    @GetMapping
    public ConfigAgenda get() {
        return repository.findById("settings").orElseGet(() -> {
            ConfigAgenda defaultConfig = new ConfigAgenda();
            defaultConfig.setIntervalo(60);
            defaultConfig.setHoraInicio("09:00");
            defaultConfig.setHoraFim("18:00");
            defaultConfig.setDiasSemana("1,2,3,4,5,6");
            defaultConfig.setDatasBloqueadas("");
            return repository.save(defaultConfig);
        });
    }

    @PostMapping
    public ConfigAgenda save(@RequestBody ConfigAgenda config) {
        config.setId("settings");
        return repository.save(config);
    }
}
