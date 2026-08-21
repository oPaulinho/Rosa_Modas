package com.rosamodas.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
public class WhatsAppServiceImpl implements WhatsAppService {

    @Value("${whatsapp.provider:}")
    private String provider;

    @Value("${whatsapp.api-url:}")
    private String apiUrl;

    @Value("${whatsapp.api-key:}")
    private String apiKey;

    @Value("${whatsapp.instance-id:}")
    private String instanceId;

    @Value("${whatsapp.instance-token:}")
    private String instanceToken;

    @Value("${whatsapp.from-number:}")
    private String fromNumber;

    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public boolean isConfigured() {
        return provider != null && !provider.trim().isEmpty()
                && apiUrl != null && !apiUrl.trim().isEmpty()
                && apiKey != null && !apiKey.trim().isEmpty();
    }

    @Override
    public void sendMessage(String to, String message) {
        if (!isConfigured()) {
            System.out.println("WhatsApp not configured. Skipping notification to: " + to);
            return;
        }

        String cleanTo = to.replaceAll("\\D", "");
        if (cleanTo.length() < 10) {
            System.out.println("Invalid phone number: " + to);
            return;
        }

        try {
            switch (provider.toLowerCase()) {
                case "evolution" -> sendViaEvolutionApi(cleanTo, message);
                case "twilio" -> sendViaTwilio(cleanTo, message);
                case "zapi" -> sendViaZApi(cleanTo, message);
                case "wppconnect" -> sendViaWppConnect(cleanTo, message);
                default -> {
                    System.out.println("Unknown WhatsApp provider: " + provider);
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to send WhatsApp message to " + to + ": " + e.getMessage());
            e.printStackTrace();
        }
    }

    private void sendViaEvolutionApi(String to, String message) {
        String url = apiUrl + "/message/sendText/" + instanceId;
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("apikey", apiKey);

        Map<String, Object> body = new HashMap<>();
        body.put("number", to);
        body.put("text", message);
        body.put("options", Map.of(
                "delay", 1200,
                "presence", "composing"
        ));

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
        restTemplate.postForEntity(url, request, String.class);
        System.out.println("WhatsApp sent via Evolution API to: " + to);
    }

    private void sendViaTwilio(String to, String message) {
        String url = apiUrl + "/2010-04-01/Accounts/" + instanceId + "/Messages.json";
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        headers.setBasicAuth(instanceId, apiKey);

        Map<String, String> body = new HashMap<>();
        body.put("From", "whatsapp:" + fromNumber);
        body.put("To", "whatsapp:" + to);
        body.put("Body", message);

        HttpEntity<Map<String, String>> request = new HttpEntity<>(body, headers);
        restTemplate.postForEntity(url, request, String.class);
        System.out.println("WhatsApp sent via Twilio to: " + to);
    }

    private void sendViaZApi(String to, String message) {
        String url = apiUrl + "/instances/" + instanceId + "/token/" + instanceToken + "/send-text";
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Client-Token", apiKey);

        Map<String, Object> body = new HashMap<>();
        body.put("phone", to);
        body.put("message", message);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
        restTemplate.postForEntity(url, request, String.class);
        System.out.println("WhatsApp sent via Z-API to: " + to);
    }

    private void sendViaWppConnect(String to, String message) {
        String url = apiUrl + "/send-message";
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + apiKey);

        Map<String, Object> body = new HashMap<>();
        body.put("number", to + "@c.us");
        body.put("message", message);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
        restTemplate.postForEntity(url, request, String.class);
        System.out.println("WhatsApp sent via WppConnect to: " + to);
    }
}