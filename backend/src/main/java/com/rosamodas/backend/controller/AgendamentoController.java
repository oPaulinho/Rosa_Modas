package com.rosamodas.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import com.rosamodas.backend.model.Agendamento;
import com.rosamodas.backend.repository.AgendamentoRepository;
import java.util.List;

@RestController
@RequestMapping("/api/agendamentos")
@CrossOrigin(origins = "*")
public class AgendamentoController {

    @Autowired
    private AgendamentoRepository repository;

    @GetMapping
    public List<Agendamento> getAll() {
        return repository.findAll();
    }

    @PostMapping
    public Agendamento create(@RequestBody Agendamento agendamento) {
        if (agendamento.getStatus() == null) {
            agendamento.setStatus("pendente");
        }
        if (agendamento.getCriadoEm() == null) {
            agendamento.setCriadoEm(new java.util.Date().toString());
        }
        return repository.save(agendamento);
    }

    @PutMapping("/{id}")
    public Agendamento update(@PathVariable Long id, @RequestBody Agendamento updated) {
        return repository.findById(id).map(a -> {
            a.setStatus(updated.getStatus());
            return repository.save(a);
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
