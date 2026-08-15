package com.rosamodas.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import com.rosamodas.backend.model.Procedimento;
import com.rosamodas.backend.repository.ProcedimentoRepository;
import java.util.List;

@RestController
@RequestMapping("/api/procedimentos")
@CrossOrigin(origins = "*")
public class ProcedimentoController {

    @Autowired
    private ProcedimentoRepository repository;

    @GetMapping
    public List<Procedimento> getAll() {
        return repository.findAll();
    }

    @PostMapping
    public Procedimento create(@RequestBody Procedimento procedimento) {
        return repository.save(procedimento);
    }

    @PutMapping("/{id}")
    public Procedimento update(@PathVariable Long id, @RequestBody Procedimento updated) {
        return repository.findById(id).map(p -> {
            p.setNome(updated.getNome());
            p.setDescricao(updated.getDescricao());
            if (updated.getImagemUrl() != null) p.setImagemUrl(updated.getImagemUrl());
            p.setStatus(updated.getStatus());
            return repository.save(p);
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
