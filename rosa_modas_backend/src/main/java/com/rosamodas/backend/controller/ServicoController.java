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
    public List<Servico> getAll() {
        return repository.findAll();
    }

    @PostMapping
    public Servico create(@RequestBody Servico servico) {
        return repository.save(servico);
    }

    @PutMapping("/{id}")
    public Servico update(@PathVariable Long id, @RequestBody Servico updated) {
        return repository.findById(id).map(s -> {
            s.setNome(updated.getNome());
            s.setDescricao(updated.getDescricao());
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
