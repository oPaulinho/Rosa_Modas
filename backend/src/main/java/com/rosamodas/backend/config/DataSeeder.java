package com.rosamodas.backend.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import com.rosamodas.backend.model.Produto;
import com.rosamodas.backend.model.Procedimento;
import com.rosamodas.backend.model.Servico;
import com.rosamodas.backend.model.Admin;
import com.rosamodas.backend.model.SiteConfig;
import com.rosamodas.backend.repository.ProdutoRepository;
import com.rosamodas.backend.repository.ProcedimentoRepository;
import com.rosamodas.backend.repository.ServicoRepository;
import com.rosamodas.backend.repository.AdminRepository;
import com.rosamodas.backend.repository.SiteConfigRepository;

@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner initDatabase(
            ProdutoRepository produtoRepository, 
            ProcedimentoRepository procedimentoRepository,
            ServicoRepository servicoRepository,
            AdminRepository adminRepository,
            SiteConfigRepository siteConfigRepository) {
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

            // Seed de Serviços Espirituais (Universo Rosa)
            // O painel administrativo permite editar preço, nome, descrição,
            // modalidades (presencial/online) e adicionar/remover serviços.
            // Parâmetros: Servico(nome, descricao, preco, duracaoMinutos, imagemUrl, status, modalidades, site)
            if (servicoRepository.count() == 0) {
                servicoRepository.save(new Servico("Consulta com entidade", "Atendimento espiritual de orientação e conexão.", 200.00, 60, "img/atendimento_espiritual.png", "Disponível", "PRESENCIAL,ONLINE", "UNIVERSO_ROSA"));
                servicoRepository.save(new Servico("Orientação espiritual", "Orientação e acolhimento para o seu momento.", 100.00, 60, "img/atendimento_espiritual.png", "Disponível", "PRESENCIAL,ONLINE", "UNIVERSO_ROSA"));
                servicoRepository.save(new Servico("Jogo de cartas", "Atendimento de leitura e orientação com cartas.", 200.00, 60, "img/atendimento_espiritual.png", "Disponível", "", "UNIVERSO_ROSA"));
                System.out.println("Seed: Serviços espirituais inseridos!");
            }

            // Seed de Admin
            // As credenciais vêm de variáveis de ambiente (painel do Render/MySQL).
            // Os valores abaixo são APENAS o fallback local de desenvolvimento.
            if (adminRepository.count() == 0) {
                String adminEmail = System.getenv().getOrDefault("ADMIN_EMAIL", "admin@admin.com");
                String adminSenha = System.getenv().getOrDefault("ADMIN_PASSWORD", "admin");
                adminRepository.save(new Admin(adminEmail, adminSenha));
                System.out.println("Seed: Admin inserido (e-mail/senha configurados por variável de ambiente)!");
            }

            // Seed de Configurações Gerais do Site (endereço/contatos)
            if (!siteConfigRepository.existsById("main")) {
                SiteConfig config = new SiteConfig();
                config.setEndereco("Rua Nova Esperança, 402 - Bairro da Inamar - Diadema/SP");
                config.setTelefone("(11) 95872-3409");
                config.setWhatsapp("5511958723409");
                config.setEmail("roseaneamarasilvaa@gmail.com");
                config.setInstagram("bela_rosasalao");
                siteConfigRepository.save(config);
                System.out.println("Seed: SiteConfig inserido!");
            }
        };
    }
}
