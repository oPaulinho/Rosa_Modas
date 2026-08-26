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
    public List<Promocao> getAll(@RequestParam(required = false) String site) {
        if (site != null && !site.isBlank()) {
            return repository.findAll().stream()
                    .filter(p -> site.equals(p.getSite() == null ? "ROSA_MODAS" : p.getSite()))
                    .collect(java.util.stream.Collectors.toList());
        }
        return repository.findAll();
    }

    @PostMapping
    public Promocao create(@RequestBody Promocao promocao) {
        if (promocao.getSite() == null || promocao.getSite().isBlank()) {
            promocao.setSite("ROSA_MODAS");
        }
        return repository.save(promocao);
    }

    @PutMapping("/{id}")
    public Promocao update(@PathVariable Long id, @RequestBody Promocao dados) {
        return repository.findById(id).map(p -> {
            if (dados.getStatus() != null) p.setStatus(dados.getStatus());
            if (dados.getSite() != null && !dados.getSite().isBlank()) p.setSite(dados.getSite());
            if (dados.getTitulo() != null) p.setTitulo(dados.getTitulo());
            if (dados.getDescricao() != null) p.setDescricao(dados.getDescricao());
            if (dados.getDataInicio() != null) p.setDataInicio(dados.getDataInicio());
            if (dados.getDataFim() != null) p.setDataFim(dados.getDataFim());
            return repository.save(p);
        }).orElseThrow(() -> new RuntimeException("Promoção não encontrada: " + id));
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        repository.deleteById(id);
    }
}
