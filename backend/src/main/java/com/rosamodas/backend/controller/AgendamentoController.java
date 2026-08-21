package com.rosamodas.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import com.rosamodas.backend.model.Agendamento;
import com.rosamodas.backend.model.ConfigAgenda;
import com.rosamodas.backend.repository.AgendamentoRepository;
import com.rosamodas.backend.repository.ConfigAgendaRepository;
import com.rosamodas.backend.service.WhatsAppService;
import java.util.List;

@RestController
@RequestMapping("/api/agendamentos")
@CrossOrigin(origins = "*")
public class AgendamentoController {

    @Autowired
    private AgendamentoRepository repository;

    @Autowired
    private ConfigAgendaRepository configAgendaRepository;

    @Autowired
    private WhatsAppService whatsAppService;

    @GetMapping
    public List<Agendamento> getAll() {
        return repository.findAll();
    }

    @PostMapping
    public Agendamento create(@RequestBody Agendamento agendamento) {
        if (agendamento.getStatus() == null) {
            agendamento.setStatus("pendente");
        }
        if (agendamento.getCriadoEm() == null) {
            agendamento.setCriadoEm(new java.util.Date().toString());
        }
        Agendamento saved = repository.save(agendamento);
        
        // Enviar notificação WhatsApp para administradores
        sendNotificationToAdmins(saved);
        
        return saved;
    }

    @PutMapping("/{id}")
    public Agendamento update(@PathVariable Long id, @RequestBody Agendamento updated) {
        return repository.findById(id).map(a -> {
            a.setStatus(updated.getStatus());
            return repository.save(a);
        }).orElseGet(() -> {
            updated.setId(id);
            return repository.save(updated);
        });
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        repository.deleteById(id);
    }

    private void sendNotificationToAdmins(Agendamento agendamento) {
        if (!whatsAppService.isConfigured()) {
            System.out.println("WhatsApp não configurado. Pulando notificação de novo agendamento.");
            return;
        }

        ConfigAgenda config = configAgendaRepository.findById("settings").orElse(null);
        if (config == null || config.getNumerosAdmin() == null || config.getNumerosAdmin().trim().isEmpty()) {
            System.out.println("Nenhum número de administrador configurado para notificação.");
            return;
        }

        String[] numeros = config.getNumerosAdmin().split(",");
        String dataFormatada = formatarDataHora(agendamento.getDataHora());

        String mensagem = "📅 *Novo pedido de agendamento*\n\n" +
                "Uma nova solicitação de agendamento foi realizada pelo site.\n\n" +
                "👤 *Cliente:* " + agendamento.getNomeCliente() + "\n" +
                "✂️ *Serviço:* " + agendamento.getServico() + "\n" +
                "📅 *Data:* " + dataFormatada + "\n" +
                "🏷️ *Modalidade:* " + (agendamento.getModalidade() != null ? agendamento.getModalidade().substring(0, 1).toUpperCase() + agendamento.getModalidade().substring(1).toLowerCase() : "—") + "\n" +
                "📞 *Telefone:* " + agendamento.getTelefone();

        for (String numero : numeros) {
            String numeroLimpo = numero.trim().replaceAll("\\D", "");
            if (numeroLimpo.length() >= 10) {
                whatsAppService.sendMessage(numeroLimpo, mensagem);
            }
        }
    }

    private String formatarDataHora(String dataHora) {
        try {
            java.text.SimpleDateFormat inputFormat = new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm");
            java.util.Date date = inputFormat.parse(dataHora);
            java.text.SimpleDateFormat outputFormat = new java.text.SimpleDateFormat("dd/MM/yyyy 'às' HH:mm");
            return outputFormat.format(date);
        } catch (Exception e) {
            return dataHora;
        }
    }
}
