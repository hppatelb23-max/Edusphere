import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiX,
  FiUploadCloud,
  FiFileText,
  FiDownload,
  FiCheckCircle,
  FiAlertCircle,
  FiPlus,
  FiRefreshCw
} from "react-icons/fi";
import { toast } from "react-toastify";
import {
  parseDatasetFileOrText,
  downloadSampleCSV,
  downloadSampleJSON
} from "../../utils/datasetParser";

const ImportDatasetModal = ({ isOpen, onClose, onImportQuestions, isDarkMode }) => {
  const [activeTab, setActiveTab] = useState("upload"); // "upload" | "paste"
  const [pasteContent, setPasteContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [parsedQuestions, setParsedQuestions] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        const questions = parseDatasetFileOrText(text);
        if (!questions || questions.length === 0) {
          toast.error("Could not parse any valid questions. Please ensure standard CSV or JSON format.");
          setParsedQuestions([]);
        } else {
          setParsedQuestions(questions);
          toast.success(`Successfully parsed ${questions.length} questions from ${file.name}!`);
        }
      } catch (err) {
        console.error("Error reading file:", err);
        toast.error("Error reading dataset file: " + err.message);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.onerror = () => {
      toast.error("Failed to read file.");
      setIsProcessing(false);
    };
    reader.readAsText(file);
  };

  const handleParsePastedText = () => {
    if (!pasteContent.trim()) {
      toast.warn("Please paste your CSV, TSV, or JSON data first.");
      return;
    }
    setIsProcessing(true);
    try {
      const questions = parseDatasetFileOrText(pasteContent);
      if (!questions || questions.length === 0) {
        toast.error("Could not parse questions. Please check format or delimiter.");
        setParsedQuestions([]);
      } else {
        setParsedQuestions(questions);
        toast.success(`Parsed ${questions.length} questions successfully!`);
      }
    } catch (err) {
      toast.error("Parsing error: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = (mode) => {
    if (parsedQuestions.length === 0) {
      toast.warn("No questions to import.");
      return;
    }
    onImportQuestions(parsedQuestions, mode);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className={`w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl shadow-2xl border overflow-hidden ${
            isDarkMode ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-amber-200 text-gray-900"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700/50 bg-gradient-to-r from-amber-500/10 to-transparent">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-400 text-black shadow-md shadow-amber-400/20">
                <FiUploadCloud className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black">Import Structured Dataset</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Bulk import questions from CSV, Excel/TSV, or JSON datasets in one click
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
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            {/* Download Sample Templates Banner */}
            <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-xs">
                <FiFileText className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-gray-300">
                  Need the exact schema? Download sample template datasets with questions, options & answers:
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={downloadSampleCSV}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-400 text-black hover:bg-amber-300 flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <FiDownload className="w-3.5 h-3.5" />
                  <span>Download Sample CSV</span>
                </button>
                <button
                  type="button"
                  onClick={downloadSampleJSON}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold border border-amber-400/50 text-amber-400 hover:bg-amber-400/10 flex items-center gap-1.5 transition-all"
                >
                  <FiDownload className="w-3.5 h-3.5" />
                  <span>Download Sample JSON</span>
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 border-b border-gray-700/50 pb-2">
              <button
                type="button"
                onClick={() => setActiveTab("upload")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "upload"
                    ? "bg-amber-400 text-black shadow-md shadow-amber-400/20"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                📁 Upload Dataset File
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("paste")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "paste"
                    ? "bg-amber-400 text-black shadow-md shadow-amber-400/20"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                📋 Paste CSV / JSON Text
              </button>
            </div>

            {/* Tab 1: Upload File */}
            {activeTab === "upload" && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-600 hover:border-amber-400/80 rounded-2xl p-8 text-center cursor-pointer transition-all bg-gray-800/30 hover:bg-amber-400/5 group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".csv,.tsv,.json,.txt"
                  className="hidden"
                />
                <FiUploadCloud className="w-12 h-12 text-gray-400 group-hover:text-amber-400 mx-auto mb-3 transition-colors" />
                <p className="text-sm font-bold text-gray-200">
                  {fileName ? `Selected: ${fileName}` : "Click or drag & drop dataset file here"}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Supported formats: <strong>.CSV</strong>, <strong>.TSV</strong>, <strong>.JSON</strong>
                </p>
              </div>
            )}

            {/* Tab 2: Paste Raw Data */}
            {activeTab === "paste" && (
              <div className="space-y-3">
                <textarea
                  rows="6"
                  placeholder='Paste CSV (e.g. question,optionA,optionB,optionC,optionD,correct_option,explanation) or JSON array here...'
                  value={pasteContent}
                  onChange={(e) => setPasteContent(e.target.value)}
                  className={`w-full p-4 rounded-xl text-xs font-mono border focus:outline-none transition-all ${
                    isDarkMode
                      ? "bg-gray-800/90 border-gray-700 text-gray-200 focus:border-amber-400"
                      : "bg-gray-50 border-gray-300 text-gray-900 focus:border-amber-500"
                  }`}
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleParsePastedText}
                    disabled={isProcessing}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-400 text-black hover:bg-amber-300 transition-all flex items-center gap-1.5"
                  >
                    <FiRefreshCw className={`w-3.5 h-3.5 ${isProcessing ? "animate-spin" : ""}`} />
                    <span>Parse Pasted Dataset</span>
                  </button>
                </div>
              </div>
            )}

            {/* Parsed Results Preview */}
            {parsedQuestions.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                    <FiCheckCircle className="w-4 h-4" />
                    <span>{parsedQuestions.length} Questions Ready for Import</span>
                  </div>
                  <span className="text-[11px] text-gray-400">Review sample below</span>
                </div>

                <div className="max-h-56 overflow-y-auto space-y-2.5 pr-1 border border-gray-700/50 rounded-2xl p-3 bg-gray-800/30">
                  {parsedQuestions.slice(0, 5).map((q, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-gray-800/80 border border-gray-700/60 text-xs space-y-1.5"
                    >
                      <div className="font-bold text-amber-300 flex items-start gap-1.5">
                        <span className="shrink-0">Q{idx + 1}.</span>
                        <span>{q.question}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 pl-4 text-[11px]">
                        {q.options.map((opt, oIdx) => (
                          <div
                            key={oIdx}
                            className={`p-1.5 rounded-lg border ${
                              q.correct_option === oIdx
                                ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-300 font-semibold"
                                : "border-gray-700/40 text-gray-400"
                            }`}
                          >
                            <span className="font-bold mr-1">{String.fromCharCode(65 + oIdx)}.</span>
                            <span>{opt}</span>
                            {q.correct_option === oIdx && <span className="ml-1 text-[10px] text-emerald-400">✓</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {parsedQuestions.length > 5 && (
                    <p className="text-center text-[11px] text-gray-500 pt-1">
                      + {parsedQuestions.length - 5} more questions parsed and ready
                    </p>
                  )}
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
              disabled={parsedQuestions.length === 0}
              onClick={() => handleImport("append")}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                parsedQuestions.length > 0
                  ? "border-amber-400/50 text-amber-400 hover:bg-amber-400/10 active:scale-95"
                  : "border-gray-700 text-gray-600 cursor-not-allowed"
              }`}
            >
              <FiPlus className="w-4 h-4" />
              <span>Append to Bank (+{parsedQuestions.length})</span>
            </button>
            <button
              type="button"
              disabled={parsedQuestions.length === 0}
              onClick={() => handleImport("replace")}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 ${
                parsedQuestions.length > 0
                  ? "bg-amber-400 text-black hover:bg-amber-300 shadow-amber-400/20 active:scale-95"
                  : "bg-gray-700 text-gray-500 cursor-not-allowed"
              }`}
            >
              <FiCheckCircle className="w-4 h-4" />
              <span>Replace All Questions ({parsedQuestions.length})</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ImportDatasetModal;
