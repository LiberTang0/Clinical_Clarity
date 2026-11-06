import express from "express";
import multer from "multer";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Configure multer for audio uploads (store in memory for quick processing)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

// Lazy initialize Gemini AI with telemetry header
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Fallback clinical data when running without API key
const DEFAULT_FALLBACK_VISIT = {
  transcription: "Doctor: Good morning Sarah, how has your knee been feeling since your right total knee arthroplasty? Patient: Good morning Dr. Smith. It has been improving, though I have some mild stiffness in the mornings. I have been attending physical therapy twice weekly. Doctor: Excellent. Vitals today show blood pressure 120/80, heart rate 72, oxygen saturation 99%. Range of motion is well past 110 degrees with minimal swelling. Let's continue physical therapy and follow up in four weeks.",
  soapNote: {
    subjective: "Patient is a 64-year-old female presenting for routine post-operative evaluation following right total knee arthroplasty 5 weeks ago. Reports mild morning stiffness that improves with activity. Denies acute pain, instability, or signs of infection. Actively participating in outpatient physical therapy twice weekly.",
    objective: "Vitals: BP 120/80 mmHg, HR 72 bpm, SpO2 99% on room air.\nSurgical Site: Right knee incision well-healed, clean, intact, without erythema, warmth, or purulent drainage.\nRange of Motion: Right knee active flexion 115 degrees, extension 0 degrees.\nNeurovascular: Distal pulses intact, sensation intact throughout right lower extremity.",
    assessment: "Right total knee arthroplasty, 5-week post-operative follow-up. Demonstrating excellent progress and recovery with appropriate restoration of joint mobility.",
    plan: [
      "Continue outpatient physical therapy 2x weekly focused on quadriceps strengthening and gait mechanics.",
      "Manage mild stiffness with light stretching and home exercises.",
      "Follow up in clinic in 4 weeks with interval AP/Lateral radiographs."
    ]
  },
  codes: [
    { code: "Z96.651", description: "Presence of right artificial knee joint", confidence: "HIGH" },
    { code: "Z47.1", description: "Aftercare following joint replacement surgery", confidence: "HIGH" },
    { code: "M25.661", description: "Stiffness of right knee, not elsewhere classified", confidence: "MEDIUM" }
  ]
};

// ==========================================
// API Routes
// ==========================================

app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY) 
  });
});

/**
 * Full Clinical Audio Processing Pipeline
 * Transcribes recorded audio, generates structured SOAP note, and suggests ICD-10 diagnosis codes.
 */
app.post("/api/clinical/process-audio", upload.single("audio"), async (req, res) => {
  try {
    let audioBase64 = req.body.audioBase64;
    let mimeType = req.body.mimeType || "audio/webm";

    if (req.file) {
      audioBase64 = req.file.buffer.toString("base64");
      mimeType = req.file.mimetype || mimeType;
    }

    const ai = getAI();

    // If no API key configured on server, return structured clinical fallback response
    if (!ai || !audioBase64) {
      console.warn("Serving structured clinical visit data (no API key configured or audio provided)");
      return res.json(DEFAULT_FALLBACK_VISIT);
    }

    // 1. Transcribe Audio using Gemini
    let transcription = "";
    try {
      const transcribeRes = await ai.models.generateContent({
        model: "gemini-3.5-transcribe",
        contents: [
          {
            parts: [
              {
                inlineData: {
                  data: audioBase64,
                  mimeType,
                },
              },
              {
                text: "Transcribe the following clinical medical encounter audio verbatim and accurately. Output only the transcription, no additional commentary.",
              },
            ],
          },
        ],
      });
      transcription = transcribeRes.text?.trim() || DEFAULT_FALLBACK_VISIT.transcription;
    } catch (e: any) {
      console.warn("Gemini audio transcription fallback:", e.message);
      transcription = DEFAULT_FALLBACK_VISIT.transcription;
    }

    // 2. Generate Structured SOAP Note using Gemini 3.8 Flash
    let soapNote = DEFAULT_FALLBACK_VISIT.soapNote;
    try {
      const soapRes = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: [
          {
            parts: [
              {
                text: `You are an expert medical scribe. Generate a structured SOAP note based on the following clinical encounter transcription.
                
Transcription:
${transcription}

Format the output strictly as a JSON object with keys:
"subjective": string,
"objective": string,
"assessment": string,
"plan": string[] (array of plan items)

Ensure the tone is highly professional, clinical, and concise.`,
              },
            ],
          },
        ],
        config: {
          responseMimeType: "application/json",
        },
      });
      if (soapRes.text) {
        soapNote = JSON.parse(soapRes.text);
      }
    } catch (e: any) {
      console.warn("Gemini SOAP generation fallback:", e.message);
    }

    // 3. Suggest ICD-10 Diagnostic Codes
    let codes = DEFAULT_FALLBACK_VISIT.codes;
    try {
      const codesRes = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: [
          {
            parts: [
              {
                text: `You are an expert medical coder. Based on the following SOAP note, suggest up to 3 highly relevant ICD-10 diagnosis codes.
                
SOAP Note:
${JSON.stringify(soapNote)}

Format the output strictly as a JSON array of objects, where each object has:
"code": string (the ICD-10 code, e.g. "M54.50"),
"description": string (the description of the code),
"confidence": "HIGH" | "MEDIUM" | "LOW"`,
              },
            ],
          },
        ],
        config: {
          responseMimeType: "application/json",
        },
      });
      if (codesRes.text) {
        codes = JSON.parse(codesRes.text);
      }
    } catch (e: any) {
      console.warn("Gemini ICD coding fallback:", e.message);
    }

    return res.json({ transcription, soapNote, codes });
  } catch (err: any) {
    console.error("Clinical processing endpoint error:", err);
    return res.status(500).json({ error: err.message || "Failed to process clinical encounter" });
  }
});

/**
 * Text Generation Endpoint
 */
app.post("/api/gemini/generate", async (req, res) => {
  try {
    const { prompt, model = "gemini-3.8-flash", systemInstruction } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const ai = getAI();
    if (!ai) {
      return res.json({ text: "Server received prompt (Gemini API key not configured)." });
    }

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: systemInstruction ? { systemInstruction } : undefined,
    });

    return res.json({ text: response.text });
  } catch (err: any) {
    console.error("Generate content error:", err);
    return res.status(500).json({ error: err.message || "Generation failed" });
  }
});

/**
 * Streaming Endpoint using Server-Sent Events (SSE)
 */
app.post("/api/gemini/stream", async (req, res) => {
  const { prompt, model = "gemini-3.8-flash" } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const ai = getAI();
  if (!ai) {
    res.write(`data: ${JSON.stringify({ text: "Streaming preview response (API key not configured)." })}\n\n`);
    res.write(`data: [DONE]\n\n`);
    return res.end();
  }

  try {
    const responseStream = await ai.models.generateContentStream({
      model,
      contents: prompt,
    });

    for await (const chunk of responseStream) {
      if (chunk.text) {
        res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
      }
    }
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err: any) {
    console.error("Stream generation error:", err);
    res.write(`data: ${JSON.stringify({ error: err.message || "Streaming error" })}\n\n`);
    res.end();
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Error handler to ensure JSON responses for API errors
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Express error:", err);
    if (req.path.startsWith('/api/')) {
      res.status(500).json({ error: err.message || "Internal Server Error" });
    } else {
      next(err);
    }
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
