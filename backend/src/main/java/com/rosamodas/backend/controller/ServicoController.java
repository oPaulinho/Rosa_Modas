package com.rosamodas.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.rosamodas.backend.model.Servico;
import com.rosamodas.backend.repository.ServicoRepository;
import java.util.List;
import java.util.Map;

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
    public ResponseEntity<?> create(@RequestBody Servico servico) {
        if (servico.getNome() == null || servico.getNome().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Informe o nome do serviço."));
        }
        if (servico.getSite() == null || servico.getSite().isBlank()) {
            servico.setSite("UNIVERSO_ROSA");
        }
        if (servico.getModalidades() == null) {
            servico.setModalidades("");
        }
        if (servico.getStatus() == null || servico.getStatus().isBlank()) {
            servico.setStatus("Disponível");
        }
        if (servico.getIcone() == null || servico.getIcone().isBlank()) {
            servico.setIcone("✦");
        }
        try {
            return ResponseEntity.ok(repository.save(servico));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("message", "Erro ao salvar serviço: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Servico updated) {
        try {
            return repository.findById(id).map(s -> {
                if (updated.getNome() != null) s.setNome(updated.getNome());
                if (updated.getDescricao() != null) s.setDescricao(updated.getDescricao());
                if (updated.getPreco() != null) s.setPreco(updated.getPreco());
                if (updated.getDuracaoMinutos() != null) s.setDuracaoMinutos(updated.getDuracaoMinutos());
                if (updated.getModalidades() != null) s.setModalidades(updated.getModalidades());
                if (updated.getSite() != null && !updated.getSite().isBlank()) s.setSite(updated.getSite());
                if (updated.getStatus() != null) s.setStatus(updated.getStatus());
                if (updated.getIcone() != null) s.setIcone(updated.getIcone());
                return ResponseEntity.ok(repository.save(s));
            }).orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("message", "Erro ao atualizar serviço: " + e.getMessage()));
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
