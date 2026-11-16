/**
 * AI Question Generator for Edusphere
 * Supports multi-format documents (.pdf, .docx, .doc, .txt, .md),
 * Google Gemini API integration, and advanced content-aware semantic extraction.
 */

import axios from "axios";
import { API_BASE_URL } from "./api";

// Helper: Extract text from document files (.pdf, .docx, .doc, .txt, .md)
export async function extractDocumentText(file) {
  if (!file) throw new Error("No file provided.");

  const ext = "." + file.name.split(".").pop().toLowerCase();

  // If plain text or markdown, read directly in browser
  if (ext === ".txt" || ext === ".md" || ext === ".text") {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result || "";
        const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
        resolve({
          text,
          fileName: file.name,
          pages: 1,
          wordCount
        });
      };
      reader.onerror = () => reject(new Error("Failed to read text file."));
      reader.readAsText(file);
    });
  }

  // If PDF or Word doc, send base64 to backend for python fitz / docx extraction
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const base64Data = e.target?.result;
        const res = await axios.post(`${API_BASE_URL}/tests/extract-document`, {
          fileData: base64Data,
          fileName: file.name
        }, { timeout: 30000 });

        if (res.data?.success && res.data.text) {
          resolve({
            text: res.data.text,
            fileName: file.name,
            pages: res.data.pages || 1,
            wordCount: res.data.wordCount || 0
          });
        } else {
          reject(new Error(res.data?.error || "Failed to extract text from document."));
        }
      } catch (err) {
        reject(new Error(err.response?.data?.error || err.message));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read document file."));
    reader.readAsDataURL(file);
  });
}

// Client-side Google Gemini API Question Generator
export async function generateViaGeminiClient(notesText, apiKey, options = {}) {
  const { topic = "Course Material", difficulty = "Intermediate", count = 5 } = options;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const prompt = `You are a university professor and professional assessment designer.
Generate exactly ${count} high-quality, rigorous multiple choice questions (MCQs) of ${difficulty} difficulty based STRICTLY on the educational content of the following text.
DO NOT include author names, affiliations, email addresses, volume numbers, citations, or paper metadata. Focus purely on technical definitions, mechanisms, concepts, findings, and methodologies.

Text Material:
"""
${notesText.slice(0, 15000)}
"""

Format your response as a valid JSON array of objects with the exact schema:
[
  {
    "question": "A specific, clearly worded question directly testing the subject matter",
    "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
    "correct_option": 0,
    "explanation": "Clear explanation citing the concept from the text"
  }
]
Return ONLY the raw JSON array without markdown formatting.`;

  const res = await axios.post(url, {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json"
    }
  }, { timeout: 25000 });

  const rawJson = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawJson) throw new Error("No response received from Gemini.");

  const parsed = JSON.parse(rawJson);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("Invalid question structure returned by Gemini.");
  }

  return parsed;
}

// Advanced Semantic Heuristic Engine (Purges author names, affiliations, and metadata)
export function generateLocalMCQs(rawNotes, options = {}) {
  const { topic = "", difficulty = "Intermediate", count = 5 } = options;

  if (!rawNotes || typeof rawNotes !== "string" || rawNotes.trim().length < 20) {
    return [];
  }

  const cleaned = rawNotes.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = cleaned.split("\n").map(l => l.trim()).filter(Boolean);

  // Filter out academic metadata: authors, affiliations, footnotes, emails, publication stats
  const isMetadataLine = (line) => {
    const lower = line.toLowerCase();
    return (
      lower.includes("@") ||
      lower.includes("http") ||
      lower.includes("doi.org") ||
      lower.includes("arxiv:") ||
      lower.includes("university") ||
      lower.includes("institute") ||
      lower.includes("laboratory") ||
      lower.includes("department") ||
      lower.includes("zurich") ||
      lower.includes("ibm research") ||
      lower.includes("all rights reserved") ||
      lower.includes("received:") ||
      lower.includes("accepted:") ||
      lower.includes("published:") ||
      lower.includes("keywords:") ||
      lower.includes("et al.") ||
      /^[0-9*,\s]+$/.test(line) ||
      (/([A-Z][a-z]+ [A-Z][a-z]+\s*[0-9*,\s]+)/.test(line) && line.length < 90) ||
      (/^(and|or|for|with|of|in|to)\b/i.test(line) && line.split(/\s+/).length < 5)
    );
  };

  const bodyLines = lines.filter(l => !isMetadataLine(l));
  const bodyText = bodyLines.join(" ");

  // Auto-detect subject if generic
  let detectedTopic = topic;
  if (!detectedTopic || detectedTopic.toLowerCase() === "web3" || detectedTopic.toLowerCase() === "general") {
    const titleCandidate = bodyLines.slice(0, 3).find(l => l.length >= 15 && l.length <= 120 && !l.endsWith("."));
    detectedTopic = titleCandidate || "Core Subject Assessment";
  }

  // Extract grammatical sentences with substance
  const sentences = bodyText
    .split(/(?<=[.?!])\s+(?=[A-Z0-9])/)
    .map(s => s.trim().replace(/^[\*\-\d\.\s]+/, ""))
    .filter(s => {
      const words = s.split(/\s+/);
      if (words.length < 8 || words.length > 50) return false;
      if (/1,2\*|[0-9]\*|ibm|zurich|switzerland|university|department/i.test(s)) return false;
      const lower = s.toLowerCase();
      return (
        lower.includes(" is ") ||
        lower.includes(" are ") ||
        lower.includes(" means ") ||
        lower.includes(" allows ") ||
        lower.includes(" enables ") ||
        lower.includes(" uses ") ||
        lower.includes(" consists of ") ||
        lower.includes(" demonstrates ") ||
        lower.includes(" provides ") ||
        lower.includes(" shows ") ||
        lower.includes(" represents ")
      );
    });

  const targetCount = Math.min(Math.max(Number(count) || 5, 1), 15);
  const selected = sentences.slice(0, targetCount);

  if (selected.length === 0) return [];

  // Extract technical domain terms to construct context-aware distractors
  const conceptTerms = [];
  bodyLines.forEach(l => {
    const matches = l.match(/\b([A-Z][a-z]+ [A-Z][a-z]+|[a-z]+ [a-z]+ distribution|[a-z]+ circuit|[a-z]+ algorithm|[a-z]+ generator|[a-z]+ network)\b/g);
    if (matches) {
      matches.forEach(m => {
        if (m.length > 8 && !conceptTerms.includes(m) && !isMetadataLine(m)) {
          conceptTerms.push(m);
        }
      });
    }
  });

  const generatedQuestions = selected.map((stmt, idx) => {
    let qText = "";
    let correctAns = "";
    let explanation = `Source material demonstrates: "${stmt}".`;

    const match = stmt.match(/^(.*?)\s+(is defined as|is used for|is used to|refers to|allows|enables|uses|consists of|demonstrates|provides|is|are)\s+(.*)$/i);
    if (match && match[1].length >= 4 && match[3].length >= 10) {
      const subject = match[1].trim();
      const verb = match[2].trim().toLowerCase();
      const predicate = match[3].trim().replace(/\.$/, "");

      qText = `According to the reference text, what is the core role or characteristic of "${subject}"?`;
      correctAns = (verb.startsWith("is") ? "" : verb.charAt(0).toUpperCase() + verb.slice(1) + " ") + predicate;
      explanation = `As stated in the reference notes: "${subject}" ${verb} ${predicate}.`;
    } else {
      qText = `Which of the following statements regarding "${detectedTopic}" is factually accurate based on the material?`;
      correctAns = stmt;
    }

    const distractors = [];
    const termA = conceptTerms[idx % conceptTerms.length] || "secondary feature mapping";
    const termB = conceptTerms[(idx + 1) % conceptTerms.length] || "parameterized optimization";
    const termC = conceptTerms[(idx + 2) % conceptTerms.length] || "classical state evaluation";

    distractors.push(`It relies exclusively on ${termA} to bypass convergence latency.`);
    distractors.push(`It replaces iterative training with fixed ${termB} transformations.`);
    distractors.push(`It requires manual intervention to adjust ${termC} parameters.`);

    const correctIdx = (idx * 2 + 1) % 4;
    const options = [];
    let dCount = 0;
    for (let i = 0; i < 4; i++) {
      if (i === correctIdx) {
        options.push(correctAns);
      } else {
        options.push(distractors[dCount++] || `Alternative mechanism ${i + 1}`);
      }
    }

    return {
      question: qText,
      question_image: "",
      options: options,
      option_images: ["", "", "", ""],
      correct_option: correctIdx,
      explanation: explanation
    };
  });

  return generatedQuestions;
}

// Master Generator: tries Gemini API (if key present), backend endpoint, then local semantic analyzer
export async function generateQuestionsFromNotes(notesText, options = {}) {
  const { topic = "", difficulty = "Intermediate", count = 5, apiKey = "" } = options;

  if (!notesText || notesText.trim().length < 20) {
    throw new Error("Please provide at least a couple of sentences of notes or document text.");
  }

  const effectiveKey = apiKey || localStorage.getItem("edusphere_gemini_key") || "";

  // 1. Try Gemini API directly from browser if API key is configured
  if (effectiveKey) {
    try {
      const geminiQuestions = await generateViaGeminiClient(notesText, effectiveKey, {
        topic,
        difficulty,
        count
      });
      if (geminiQuestions && geminiQuestions.length > 0) {
        return geminiQuestions;
      }
    } catch (geminiErr) {
      console.warn("Direct Gemini generation error, falling back to backend:", geminiErr.message);
    }
  }

  // 2. Try Backend AI Endpoint
  try {
    const res = await axios.post(
      `${API_BASE_URL}/tests/generate-from-notes`,
      {
        notes: notesText,
        topic: topic,
        difficulty: difficulty,
        count: count,
        apiKey: effectiveKey
      },
      { timeout: 25000 }
    );

    if (res.data?.success && Array.isArray(res.data.questions) && res.data.questions.length > 0) {
      return res.data.questions;
    }
  } catch (err) {
    console.info("Backend AI question generation endpoint unavailable or timed out, running semantic engine:", err.message);
  }

  // 3. Fallback: Intelligent Local Semantic Engine
  const localQuestions = generateLocalMCQs(notesText, { topic, difficulty, count });
  if (localQuestions.length > 0) {
    return localQuestions;
  }

  throw new Error("Could not extract enough distinct concepts to generate questions. Please ensure the document has clear paragraphs.");
}
