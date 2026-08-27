package com.rosamodas.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.rosamodas.backend.model.Produto;
import com.rosamodas.backend.repository.ProdutoRepository;
import java.util.List;

@RestController
@RequestMapping("/api/produtos")
@CrossOrigin(origins = "*")
public class ProdutoController {

    @Autowired
    private ProdutoRepository repository;

    @GetMapping
    public List<Produto> getAll(@RequestParam(required = false) String site) {
        if (site != null && !site.isBlank()) {
            return repository.findAll().stream()
                    .filter(p -> site.equals(p.getSite() == null ? "ROSA_MODAS" : p.getSite()))
                    .collect(java.util.stream.Collectors.toList());
        }
        return repository.findAll();
    }

    @PostMapping
    public Produto create(@RequestBody Produto produto) {
        if (produto.getCriadoEm() == null) {
            produto.setCriadoEm(new java.util.Date().toString());
        }
        if (produto.getSite() == null || produto.getSite().isBlank()) {
            produto.setSite("ROSA_MODAS");
        }
        if (produto.getIcone() == null || produto.getIcone().isBlank()) {
            produto.setIcone("🌹"); // Emoji padrão: rosa
        }
        return repository.save(produto);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Produto updated) {
        return repository.findById(id).map(p -> {
            p.setNome(updated.getNome());
            p.setPreco(updated.getPreco());
            if (updated.getIcone() != null) p.setIcone(updated.getIcone());
            p.setStatus(updated.getStatus());
            return ResponseEntity.ok(repository.save(p));
        }).orElse(ResponseEntity.notFound().build());
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
