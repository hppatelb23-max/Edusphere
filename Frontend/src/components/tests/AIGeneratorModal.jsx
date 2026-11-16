import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiX,
  FiZap,
  FiFileText,
  FiCheckCircle,
  FiTrash2,
  FiPlus,
  FiRefreshCw,
  FiUpload,
  FiDownload,
  FiKey,
  FiFile,
  FiCheck
} from "react-icons/fi";
import { toast } from "react-toastify";
import {
  generateQuestionsFromNotes,
  extractDocumentText
} from "../../utils/aiQuestionGenerator";

const AIGeneratorModal = ({ isOpen, onClose, onAddQuestions, isDarkMode, initialTopic = "" }) => {
  const [notesText, setNotesText] = useState("");
  const [topic, setTopic] = useState(initialTopic || "Web3 & Computer Science");
  const [difficulty, setDifficulty] = useState("Intermediate");
  const [count, setCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExtractingDoc, setIsExtractingDoc] = useState(false);
  const [docMeta, setDocMeta] = useState(null);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("edusphere_gemini_key") || "");
  const [showKeyInput, setShowKeyInput] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleSaveApiKey = (key) => {
    setApiKey(key);
    if (key.trim()) {
      localStorage.setItem("edusphere_gemini_key", key.trim());
      toast.success("Gemini API key saved locally in browser!");
    } else {
      localStorage.removeItem("edusphere_gemini_key");
      toast.info("Cleared custom Gemini API key.");
    }
  };

  const handleNotesFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtractingDoc(true);
    try {
      const res = await extractDocumentText(file);
      if (res?.text) {
        setNotesText(res.text);
        setDocMeta({
          fileName: res.fileName,
          pages: res.pages || 1,
          wordCount: res.wordCount || res.text.split(/\s+/).length
        });

        // Auto-detect topic from document title
        const lines = res.text.split("\n").map((l) => l.trim()).filter(Boolean);
        const titleCandidate = lines.find(
          (l) => l.length >= 10 && l.length <= 110 && !l.endsWith(".") && !l.includes("@") && !/^[0-9\s*]+$/.test(l)
        );
        if (titleCandidate) {
          setTopic(titleCandidate);
        }

        toast.success(`Extracted text from ${file.name} (${res.wordCount} words)!`);
      }
    } catch (err) {
      console.error("Document extraction error:", err);
      toast.error("Failed to extract document: " + err.message);
    } finally {
      setIsExtractingDoc(false);
    }
  };

  const handleLoadSampleNotes = () => {
    const sample = `Module 1: Blockchain Fundamentals & Smart Contract Architecture
Blockchain is a decentralized, distributed, and append-only ledger that maintains an immutable record of transactions across a peer-to-peer network.
Decentralized Consensus: Transactions are verified by cryptographic consensus algorithms (e.g. Proof of Stake, Proof of Work) rather than a central clearinghouse.
Merkle Trees: Transactions in a block are organized into Merkle Trees, allowing logarithmic O(log n) cryptographic proof of transaction inclusion.
EVM Storage is persistent on the blockchain and consumes the highest gas (2,100 to 20,000 gas).
EVM Memory is temporary volatile memory that clears between function executions and costs low gas.
EVM Calldata is a read-only immutable byte buffer storing incoming function transaction arguments.
EIP-1559 Transaction Fee: Total Fee equals Gas Units Consumed multiplied by (Base Fee plus Priority Tip).

Module 2: Solidity Security, Access Control & Token Standards
Reentrancy Attacks: Occurs when an external contract call transfers control back to the caller before its internal balance state is updated.
Checks-Effects-Interactions (CEI): Updating state variables before executing external calls protects contracts against reentrancy exploits.
Solidity 0.8+ Checked Arithmetic: All arithmetic operations automatically revert upon overflow or underflow unless explicitly wrapped in an unchecked block.
ERC-20 Token Standard: Fungible tokens with identical unit value that use the allowance mapping to permit third-party spenders to transfer tokens.
ERC-721 Token Standard: Non-fungible tokens representing unique digital assets where each item is identified by a unique tokenId.`;
    setNotesText(sample);
    setTopic("Web3 & Blockchain Architecture");
    setDocMeta({ fileName: "Edusphere_Sample_Test_Notes.pdf", pages: 2, wordCount: 220 });
    toast.success("Loaded 2-page sample test notes into generator!");
  };

  const handleGenerate = async () => {
    if (!notesText || notesText.trim().length < 20) {
      toast.warn("Please paste or upload document notes (at least 20 characters).");
      return;
    }

    setIsGenerating(true);
    try {
      const questions = await generateQuestionsFromNotes(notesText, {
        topic: topic.trim() || "Course Module",
        difficulty: difficulty,
        count: Number(count) || 5,
        apiKey: apiKey.trim()
      });

      if (!questions || questions.length === 0) {
        toast.error("Could not extract questions from the provided text. Try providing more content.");
      } else {
        setGeneratedQuestions(questions);
        toast.success(`Generated ${questions.length} context-accurate questions from your notes!`);
      }
    } catch (err) {
      toast.error("Generation error: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteGeneratedQuestion = (idx) => {
    setGeneratedQuestions((prev) => prev.filter((_, i) => i !== idx));
    toast.info("Question removed from preview.");
  };

  const handleApplyQuestions = (mode) => {
    if (generatedQuestions.length === 0) {
      toast.warn("No questions to apply.");
      return;
    }
    onAddQuestions(generatedQuestions, mode);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className={`w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl shadow-2xl border overflow-hidden ${isDarkMode ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-amber-200 text-gray-900"
            }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700/50 bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-black shadow-lg shadow-amber-400/25">
                <FiZap className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black flex items-center gap-2">
                  <span>AI Question Generator</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    PDF * Word * Notes
                  </span>
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Upload PDF, Word (.docx), or study notes to generate context-accurate 4-option MCQs
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl hover:bg-gray-700/40 text-gray-400 hover:text-white transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-5 overflow-y-auto flex-1">
            {/* AI Engine & Gemini API Key Settings Bar */}
            <div className="p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/5 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${apiKey ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
                <span className="font-semibold text-gray-200">
                  AI Model: {apiKey ? "Google Gemini 1.5 Flash (Direct LLM)" : "Edusphere Semantic Analyzer"}
                </span>
                {apiKey && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                    API Key Active
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowKeyInput(!showKeyInput)}
                  className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                >
                  <FiKey className="w-3.5 h-3.5" />
                  <span>{showKeyInput ? "Hide AI Key" : apiKey ? "Change API Key" : "Add Gemini Key (Recommended)"}</span>
                </button>
              </div>
            </div>

            {/* Collapsible Gemini API Key input */}
            {showKeyInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="p-4 rounded-2xl bg-gray-800/80 border border-gray-700 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <label className="font-bold text-gray-300">Google Gemini API Key (Stored securely in your browser)</label>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-400 hover:underline text-[11px]"
                  >
                    Get Free Gemini Key ↗
                  </a>
                </div>
                <div className="flex gap-2">
                  <input
                    type="password"
                    placeholder="AIzaSy..."
                    value={apiKey}
                    onChange={(e) => handleSaveApiKey(e.target.value)}
                    className="flex-1 p-2.5 rounded-xl bg-gray-900 border border-gray-700 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                  />
                  {apiKey && (
                    <button
                      type="button"
                      onClick={() => handleSaveApiKey("")}
                      className="px-3 py-2 rounded-xl bg-red-500/20 text-red-300 hover:bg-red-500/30 text-xs font-bold"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-gray-400">
                  Using a Gemini key allows the AI to deeply comprehend research papers, formulas, and complex textbooks with zero hallucinations.
                </p>
              </motion.div>
            )}

            {/* Input Controls Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Detected / Set Topic *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Quantum Generative Adversarial Networks"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className={`w-full p-3 rounded-xl text-xs border focus:outline-none transition-all ${isDarkMode
                    ? "bg-gray-800 border-gray-700 text-white focus:border-amber-400"
                    : "bg-gray-50 border-gray-300 text-gray-900 focus:border-amber-500"
                    }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Target Question Count
                </label>
                <select
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className={`w-full p-3 rounded-xl text-xs border focus:outline-none transition-all ${isDarkMode
                    ? "bg-gray-800 border-gray-700 text-white focus:border-amber-400"
                    : "bg-gray-50 border-gray-300 text-gray-900 focus:border-amber-500"
                    }`}
                >
                  <option value={3}>3 Questions</option>
                  <option value={5}>5 Questions (Recommended)</option>
                  <option value={8}>8 Questions</option>
                  <option value={10}>10 Questions</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Difficulty Level
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className={`w-full p-3 rounded-xl text-xs border focus:outline-none transition-all ${isDarkMode
                    ? "bg-gray-800 border-gray-700 text-white focus:border-amber-400"
                    : "bg-gray-50 border-gray-300 text-gray-900 focus:border-amber-500"
                    }`}
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>

            {/* Document / Notes Input Area */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">
                    Document Text or Lecture Notes *
                  </label>
                  {docMeta && (
                    <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <FiCheck className="w-3 h-3" />
                      <span>{docMeta.fileName} ({docMeta.wordCount} words)</span>
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href="/Edusphere_Sample_Test_Notes.pdf"
                    download="Edusphere_Sample_Test_Notes.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold transition-colors"
                  >
                    <FiDownload className="w-3.5 h-3.5" />
                    <span>Sample 2-Page PDF</span>
                  </a>
                  <button
                    type="button"
                    onClick={handleLoadSampleNotes}
                    className="text-xs text-amber-300 hover:text-amber-200 flex items-center gap-1 font-semibold transition-colors"
                  >
                    <FiZap className="w-3.5 h-3.5" />
                    <span>⚡ Load Sample Notes</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isExtractingDoc}
                    className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors px-2.5 py-1 rounded-lg bg-amber-400/15 border border-amber-400/30"
                  >
                    {isExtractingDoc ? (
                      <FiRefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <FiUpload className="w-3.5 h-3.5" />
                    )}
                    <span>{isExtractingDoc ? "Extracting..." : "Upload .PDF / .Word / .TXT"}</span>
                  </button>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleNotesFileUpload}
                  accept=".pdf,.docx,.doc,.txt,.md,.text"
                  className="hidden"
                />
              </div>

              <textarea
                rows="7"
                placeholder="Paste lecture notes, paper abstract, or chapter excerpt here... or click 'Upload .PDF / .Word / .TXT' to import directly from a file."
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                className={`w-full p-4 rounded-xl text-xs leading-relaxed border focus:outline-none transition-all ${isDarkMode
                  ? "bg-gray-800 border-gray-700 text-gray-200 focus:border-amber-400"
                  : "bg-gray-50 border-gray-300 text-gray-900 focus:border-amber-500"
                  }`}
              />
            </div>

            {/* Generate Trigger Button */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || !notesText.trim() || isExtractingDoc}
                className={`px-6 py-3 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all ${!isGenerating && notesText.trim() && !isExtractingDoc
                  ? "bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black shadow-amber-500/20 active:scale-95 cursor-pointer"
                  : "bg-gray-700 text-gray-400 cursor-not-allowed"
                  }`}
              >
                {isGenerating ? (
                  <>
                    <FiRefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing Content & Generating Questions...</span>
                  </>
                ) : (
                  <>
                    <FiZap className="w-4 h-4" />
                    <span>⚡ Generate {count} Questions from Document</span>
                  </>
                )}
              </button>
            </div>

            {/* Generated Questions Review List */}
            {generatedQuestions.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-gray-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                    <FiCheckCircle className="w-4 h-4" />
                    <span>{generatedQuestions.length} Questions Generated Accurately</span>
                  </div>
                  <span className="text-[11px] text-gray-400">Review or delete questions before adding</span>
                </div>

                <div className="max-h-64 overflow-y-auto space-y-3 pr-1">
                  {generatedQuestions.map((q, qIdx) => (
                    <div
                      key={qIdx}
                      className="p-4 rounded-2xl bg-gray-800/80 border border-gray-700/80 text-xs space-y-2 relative group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="font-bold text-amber-300 flex items-start gap-1.5 pr-6">
                          <span className="shrink-0">Q{qIdx + 1}.</span>
                          <span>{q.question}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteGeneratedQuestion(qIdx)}
                          className="text-gray-500 hover:text-red-400 p-1 rounded-lg transition-colors"
                          title="Remove question"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-3 text-[11px]">
                        {q.options.map((opt, oIdx) => (
                          <div
                            key={oIdx}
                            className={`p-2 rounded-lg border ${q.correct_option === oIdx
                              ? "border-emerald-500/70 bg-emerald-500/10 text-emerald-300 font-semibold"
                              : "border-gray-700/50 text-gray-300"
                              }`}
                          >
                            <span className="font-bold mr-1.5">{String.fromCharCode(65 + oIdx)}.</span>
                            <span>{opt}</span>
                            {q.correct_option === oIdx && (
                              <span className="ml-1.5 text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold">
                                Correct
                              </span>
                            )}
                          </div>
                        ))}
                      </div>

                      {q.explanation && (
                        <p className="text-[11px] text-gray-400 pl-3 italic border-l-2 border-amber-400/40">
                          {q.explanation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Action Buttons */}
          <div className="flex flex-wrap items-center justify-end gap-3 p-6 border-t border-gray-700/50 bg-gray-800/20">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={generatedQuestions.length === 0}
              onClick={() => handleApplyQuestions("append")}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${generatedQuestions.length > 0
                ? "border-amber-400/50 text-amber-400 hover:bg-amber-400/10 active:scale-95"
                : "border-gray-700 text-gray-600 cursor-not-allowed"
                }`}
            >
              <FiPlus className="w-4 h-4" />
              <span>Append to Test (+{generatedQuestions.length})</span>
            </button>
            <button
              type="button"
              disabled={generatedQuestions.length === 0}
              onClick={() => handleApplyQuestions("replace")}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 ${generatedQuestions.length > 0
                ? "bg-amber-400 text-black hover:bg-amber-300 shadow-amber-400/20 active:scale-95"
                : "bg-gray-700 text-gray-500 cursor-not-allowed"
                }`}
            >
              <FiCheckCircle className="w-4 h-4" />
              <span>Replace All Questions ({generatedQuestions.length})</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AIGeneratorModal;
