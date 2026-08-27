package com.rosamodas.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.rosamodas.backend.model.Agendamento;
import com.rosamodas.backend.repository.AgendamentoRepository;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/agendamentos")
@CrossOrigin(origins = "*")
public class AgendamentoController {

    @Autowired
    private AgendamentoRepository repository;

    private static final Set<String> STATUS_VALIDOS = Set.of("pendente", "confirmado", "cancelado");

    @GetMapping
    public List<Agendamento> getAll() {
        return repository.findAll();
    }

    @PostMapping
    public Agendamento create(@RequestBody Agendamento agendamento) {
        if (agendamento.getStatus() == null) {
            agendamento.setStatus("pendente");
        }
        if (!STATUS_VALIDOS.contains(agendamento.getStatus().toLowerCase())) {
            throw new IllegalArgumentException("Status inválido: " + agendamento.getStatus());
        }
        if (agendamento.getCriadoEm() == null) {
            agendamento.setCriadoEm(new java.util.Date().toString());
        }
        return repository.save(agendamento);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Agendamento updated) {
        String novoStatus = updated.getStatus();
        if (novoStatus == null || !STATUS_VALIDOS.contains(novoStatus.toLowerCase())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Status inválido. Valores permitidos: pendente, confirmado, cancelado"));
        }
        return repository.findById(id).map(a -> {
            a.setStatus(novoStatus.toLowerCase());
            return ResponseEntity.ok(repository.save(a));
        }).orElseGet(() -> {
            updated.setId(id);
            return ResponseEntity.ok(repository.save(updated));
        });
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        repository.deleteById(id);
    }
}
