const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require('@google/genai');

// Check if API key is configured
const hasGeminiKey = !!process.env.GEMINI_API_KEY;

// Initialize the SDK if the key is available
const ai = hasGeminiKey ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

// Mock response function for Gemma 4 if key is missing or testing
const mockGemmaResponse = (prompt) => {
    return {
        text: `[Gemma 4 Mock] Análisis completado para: "${prompt}". No se encontró GEMINI_API_KEY en .env.`,
        score: Math.random() > 0.5 ? 'LOW_RISK' : 'MEDIUM_RISK',
        confidence: 0.85
    };
};

/**
 * Endpoint for Loan Risk Analysis using Gemma 4 / Gemini
 * POST /api/ai/risk-analysis
 */
router.post('/risk-analysis', async (req, res) => {
    try {
        const { clientData, loanAmount, duration } = req.body;

        if (!clientData || !loanAmount) {
            return res.status(400).json({ error: 'Faltan datos del cliente o monto del préstamo' });
        }

        const prompt = `Analiza el riesgo crediticio para el cliente ${clientData.name}. Monto solicitado: $${loanAmount} a ${duration} meses.`;

        // If no API key is configured, return the mock response (useful for desktop/offline without key)
        if (!ai) {
            return res.json(mockGemmaResponse(prompt));
        }

        // Production GenAI Call (Using gemini-2.5-flash as the fast reasoning model, or Gemma if deployed on endpoint)
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        res.json({
            text: response.text,
            score: 'EVALUATED',
            provider: 'google/genai'
        });

    } catch (error) {
        console.error('AI Error:', error);
        res.status(500).json({ error: 'Error procesando la solicitud con Gemma 4 / GenAI' });
    }
});

module.exports = router;
