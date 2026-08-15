package com.rosamodas.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import com.rosamodas.backend.model.Promocao;
import com.rosamodas.backend.repository.PromocaoRepository;
import java.util.List;

@RestController
@RequestMapping("/api/promocoes")
@CrossOrigin(origins = "*")
public class PromocaoController {

    @Autowired
    private PromocaoRepository repository;

    @GetMapping
    public List<Promocao> getAll() {
        return repository.findAll();
    }

    @PostMapping
    public Promocao create(@RequestBody Promocao promocao) {
        return repository.save(promocao);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        repository.deleteById(id);
    }
}
