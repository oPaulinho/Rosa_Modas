package com.rosamodas.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                // Endpoints públicos da API (site público)
                .requestMatchers("/api/servicos/**").permitAll()
                .requestMatchers("/api/produtos/**").permitAll()
                .requestMatchers("/api/promocoes/**").permitAll()
                .requestMatchers("/api/procedimentos/**").permitAll()
                .requestMatchers("/api/agendamentos").permitAll()  // POST para criar agendamento
                .requestMatchers("/api/agendamentos/**").permitAll()  // GET individual se necessário
                .requestMatchers("/api/config-agenda/**").permitAll()
                .requestMatchers("/api/conteudo/**").permitAll()
                .requestMatchers("/api/site-config/**").permitAll()
                // Auth admin
                .requestMatchers("/api/admin/login").permitAll()
                .requestMatchers("/api/admin/reset").permitAll()
                // Demais endpoints admin precisam de auth
                .requestMatchers("/api/admin/**").authenticated()
                // Demais endpoints públicos
                .anyRequest().permitAll()
            )
            .csrf(csrf -> csrf.disable())
            .httpBasic(httpBasic -> httpBasic.disable())
            .formLogin(form -> form.disable());
        return http.build();
    }
}