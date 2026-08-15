package com.rosamodas.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.rosamodas.backend.model.Admin;
import com.rosamodas.backend.repository.AdminRepository;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    @Autowired
    private AdminRepository repository;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String email = credentials.get("email");
        String senha = credentials.get("senha");

        // Seed padrão de admin se a tabela estiver vazia
        if (repository.count() == 0) {
            repository.save(new Admin("admin@admin.com", "admin"));
        }

        return repository.findByEmail(email)
                .filter(admin -> admin.getSenha().equals(senha))
                .map(admin -> ResponseEntity.ok().body((Object) Map.of("email", admin.getEmail(), "status", "success")))
                .orElse(ResponseEntity.status(401).body(Map.of("message", "E-mail ou senha incorretos.")));
    }
}
