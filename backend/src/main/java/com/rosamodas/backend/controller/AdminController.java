package com.rosamodas.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
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

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String email = credentials.get("email");
        String senha = credentials.get("senha");

        // Seed padrão de admin se a tabela estiver vazia.
        // Em produção as credenciais vêm de variáveis de ambiente (ADMIN_EMAIL / ADMIN_PASSWORD).
        if (repository.count() == 0) {
            String adminEmail = System.getenv().getOrDefault("ADMIN_EMAIL", "admin@admin.com");
            String adminSenha = System.getenv().getOrDefault("ADMIN_PASSWORD", "admin");
            // Criptografa a senha inicial com BCrypt
            repository.save(new Admin(adminEmail, encoder.encode(adminSenha)));
        } else {
            // Se já existe admin, garante que TODOS tenham senha hasheada com BCrypt.
            // Senhas em texto puro não começam com $2a$, $2b$ ou $2y$.
            repository.findAll().forEach(admin -> {
                String senhaAtual = admin.getSenha();
                if (senhaAtual != null && !senhaAtual.startsWith("$2a$") && !senhaAtual.startsWith("$2b$") && !senhaAtual.startsWith("$2y$")) {
                    admin.setSenha(encoder.encode(senhaAtual));
                    repository.save(admin);
                }
            });
        }

        return repository.findByEmail(email)
                .filter(admin -> encoder.matches(senha, admin.getSenha()))
                .map(admin -> ResponseEntity.ok().body((Object) Map.of("email", admin.getEmail(), "status", "success")))
                .orElse(ResponseEntity.status(401).body(Map.of("message", "E-mail ou senha incorretos.")));
    }
}
