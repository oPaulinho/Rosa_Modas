package com.rosamodas.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.rosamodas.backend.model.Procedimento;
import com.rosamodas.backend.repository.ProcedimentoRepository;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/procedimentos")
@CrossOrigin(origins = "*")
public class ProcedimentoController {

    @Autowired
    private ProcedimentoRepository repository;

    @GetMapping
    public List<Procedimento> getAll(@RequestParam(required = false) String site) {
        if (site != null && !site.isBlank()) {
            return repository.findAll().stream()
                    .filter(p -> site.equals(p.getSite() == null ? "ROSA_MODAS" : p.getSite()))
                    .collect(java.util.stream.Collectors.toList());
        }
        return repository.findAll();
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Procedimento procedimento) {
        if (procedimento.getNome() == null || procedimento.getNome().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Informe o nome do procedimento."));
        }
        if (procedimento.getSite() == null || procedimento.getSite().isBlank()) {
            procedimento.setSite("ROSA_MODAS");
        }
        if (procedimento.getStatus() == null || procedimento.getStatus().isBlank()) {
            procedimento.setStatus("Disponível");
        }
        if (procedimento.getIcone() == null || procedimento.getIcone().isBlank()) {
            procedimento.setIcone("✦");
        }
        try {
            return ResponseEntity.ok(repository.save(procedimento));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("message", "Erro ao salvar procedimento: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Procedimento updated) {
        try {
            return repository.findById(id).map(p -> {
                if (updated.getNome() != null) p.setNome(updated.getNome());
                if (updated.getDescricao() != null) p.setDescricao(updated.getDescricao());
                if (updated.getStatus() != null) p.setStatus(updated.getStatus());
                if (updated.getSite() != null && !updated.getSite().isBlank()) p.setSite(updated.getSite());
                if (updated.getIcone() != null) p.setIcone(updated.getIcone());
                return ResponseEntity.ok(repository.save(p));
            }).orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("message", "Erro ao atualizar procedimento: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        repository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
