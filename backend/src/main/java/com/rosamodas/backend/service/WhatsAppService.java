package com.rosamodas.backend.service;

public interface WhatsAppService {
    void sendMessage(String to, String message);
    boolean isConfigured();
}