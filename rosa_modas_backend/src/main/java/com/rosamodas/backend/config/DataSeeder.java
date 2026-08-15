package com.rosamodas.backend.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import com.rosamodas.backend.model.Produto;
import com.rosamodas.backend.model.Procedimento;
import com.rosamodas.backend.model.Admin;
import com.rosamodas.backend.repository.ProdutoRepository;
import com.rosamodas.backend.repository.ProcedimentoRepository;
import com.rosamodas.backend.repository.AdminRepository;

@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner initDatabase(
            ProdutoRepository produtoRepository, 
            ProcedimentoRepository procedimentoRepository,
            AdminRepository adminRepository) {
        return args -> {
            // Seed de Roupas
            if (produtoRepository.count() == 0) {
                // Parâmetros: Produto(String nome, Double preco, String imagemUrl, String status, String criadoEm)
                produtoRepository.save(new Produto("Body Feminino Moderno", 59.90, "img/roupa.jpg", "Disponível", new java.util.Date().toString()));
                produtoRepository.save(new Produto("Cropped Style", 39.90, "img/roupa2.jpg", "Disponível", new java.util.Date().toString()));
                produtoRepository.save(new Produto("Short Casual Verão", 49.90, "img/roupa3.jpg", "Esgotado", new java.util.Date().toString()));
                System.out.println("Seed: Roupas inseridas!");
            }

            // Seed de Procedimentos
            if (procedimentoRepository.count() == 0) {
                // Parâmetros: Procedimento(String nome, String descricao, String imagemUrl, String status)
                procedimentoRepository.save(new Procedimento("Escova & Finalização", "Modelagem impecável e brilho extraordinário para o dia a dia.", "img/escova_cabelo.png", "Disponível"));
                procedimentoRepository.save(new Procedimento("Botox Capilar", "Redução do frizz e hidratação profunda.", "img/botox_capilar.png", "Disponível"));
                procedimentoRepository.save(new Procedimento("Escova Progressiva", "Alinhamento perfeito e brilho duradouro.", "img/procedimento4.jpg", "Disponível"));
                System.out.println("Seed: Procedimentos inseridos!");
            }

            // Seed de Admin
            if (adminRepository.count() == 0) {
                adminRepository.save(new Admin("admin@admin.com", "admin"));
                System.out.println("Seed: Admin inserido (admin@admin.com / admin)!");
            }
        };
    }
}
