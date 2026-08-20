package com.rosamodas.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import com.rosamodas.backend.model.Servico;
import com.rosamodas.backend.repository.ServicoRepository;
import java.util.List;

@RestController
@RequestMapping("/api/servicos")
@CrossOrigin(origins = "*")
public class ServicoController {

    @Autowired
    private ServicoRepository repository;

    @GetMapping
    public List<Servico> getAll(@RequestParam(required = false) String site) {
        if (site != null && !site.isBlank()) {
            return repository.findAll().stream()
                    .filter(s -> site.equals(s.getSite() == null ? "UNIVERSO_ROSA" : s.getSite()))
                    .collect(java.util.stream.Collectors.toList());
        }
        return repository.findAll();
    }

    @PostMapping
    public Servico create(@RequestBody Servico servico) {
        if (servico.getSite() == null || servico.getSite().isBlank()) {
            servico.setSite("UNIVERSO_ROSA");
        }
        if (servico.getModalidades() == null) {
            servico.setModalidades("");
        }
        return repository.save(servico);
    }

    @PutMapping("/{id}")
    public Servico update(@PathVariable Long id, @RequestBody Servico updated) {
        return repository.findById(id).map(s -> {
            s.setNome(updated.getNome());
            s.setDescricao(updated.getDescricao());
            s.setPreco(updated.getPreco());
            s.setDuracaoMinutos(updated.getDuracaoMinutos());
            s.setModalidades(updated.getModalidades() == null ? "" : updated.getModalidades());
            if (updated.getSite() != null && !updated.getSite().isBlank()) s.setSite(updated.getSite());
            if (updated.getImagemUrl() != null) s.setImagemUrl(updated.getImagemUrl());
            s.setStatus(updated.getStatus());
            return repository.save(s);
        }).orElseGet(() -> {
            updated.setId(id);
            return repository.save(updated);
        });
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        repository.deleteById(id);
    }
}
