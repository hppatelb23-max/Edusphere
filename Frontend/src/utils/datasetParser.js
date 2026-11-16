/**
 * Dataset Parser for Edusphere Test Creation
 * Supports CSV, TSV (tab-separated / Excel copy-paste), and JSON formats.
 */

// Robust CSV/TSV parser supporting quotes and varied delimiters
export function parseCSVText(text) {
  if (!text || typeof text !== "string") return [];
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim().split("\n");
  if (lines.length === 0) return [];

  // Detect delimiter from first row (comma, tab, semicolon, pipe)
  const firstLine = lines[0];
  let delimiter = ",";
  const commaCount = (firstLine.match(/,/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;
  const pipeCount = (firstLine.match(/\|/g) || []).length;

  if (tabCount > commaCount && tabCount >= semiCount) delimiter = "\t";
  else if (semiCount > commaCount && semiCount > tabCount) delimiter = ";";
  else if (pipeCount > commaCount && pipeCount > semiCount) delimiter = "|";

  // Parse rows with quote handling
  const rows = [];
  let currentRow = [];
  let currentCell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"' || char === "'") {
      if (inQuotes && nextChar === char) {
        currentCell += char;
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = "";
    } else if ((char === "\n" || (char === "\r" && nextChar === "\n")) && !inQuotes) {
      if (char === "\r") i++;
      currentRow.push(currentCell.trim());
      if (currentRow.some((c) => c !== "")) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = "";
    } else {
      currentCell += char;
    }
  }
  if (currentCell.trim() !== "" || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((c) => c !== "")) {
      rows.push(currentRow);
    }
  }

  return rows;
}

// Convert parsed CSV rows into standardized Question objects
export function convertRowsToQuestions(rows) {
  if (!rows || rows.length < 2) return [];

  // Normalize header names
  const rawHeaders = rows[0].map((h) => (h || "").toLowerCase().trim().replace(/[\s_-]+/g, ""));
  
  const getColIndex = (aliases) => {
    return rawHeaders.findIndex((h) => aliases.some((alias) => h === alias || h.includes(alias)));
  };

  const qIdx = getColIndex(["question", "questiontext", "prompt", "problem", "title", "q"]);
  const optAIdx = getColIndex(["optiona", "option1", "opta", "opt1", "choicea", "choice1", "a"]);
  const optBIdx = getColIndex(["optionb", "option2", "optb", "opt2", "choiceb", "choice2", "b"]);
  const optCIdx = getColIndex(["optionc", "option3", "optc", "opt3", "choicec", "choice3", "c"]);
  const optDIdx = getColIndex(["optiond", "option4", "optd", "opt4", "choiced", "choice4", "d"]);
  const ansIdx = getColIndex(["correct", "correctoption", "correctanswer", "answer", "ans", "key", "solutionindex"]);
  const expIdx = getColIndex(["explanation", "solution", "rationale", "reason", "notes", "explanationtext"]);

  // Fallback positional if headers weren't named standardly
  const safeQ = qIdx !== -1 ? qIdx : 0;
  const safeA = optAIdx !== -1 ? optAIdx : 1;
  const safeB = optBIdx !== -1 ? optBIdx : 2;
  const safeC = optCIdx !== -1 ? optCIdx : 3;
  const safeD = optDIdx !== -1 ? optDIdx : 4;
  const safeAns = ansIdx !== -1 ? ansIdx : 5;
  const safeExp = expIdx !== -1 ? expIdx : 6;

  const questions = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    const questionText = (row[safeQ] || "").trim();
    if (!questionText) continue;

    const optA = (row[safeA] || "").trim();
    const optB = (row[safeB] || "").trim();
    const optC = (row[safeC] || "").trim();
    const optD = (row[safeD] || "").trim();

    const options = [optA, optB, optC, optD].filter(Boolean);
    // Pad to 4 options if at least 2 were supplied
    while (options.length < 4) {
      options.push(`Option ${options.length + 1}`);
    }

    // Determine correct option (0-indexed)
    let correctOption = 0;
    const rawAns = (row[safeAns] || "").trim().toLowerCase();

    if (rawAns === "0" || rawAns === "a" || rawAns === "1" || rawAns === "option a" || rawAns === "first") {
      correctOption = 0;
    } else if (rawAns === "b" || rawAns === "2" || rawAns === "option b" || rawAns === "second") {
      correctOption = 1;
    } else if (rawAns === "c" || rawAns === "3" || rawAns === "option c" || rawAns === "third") {
      correctOption = 2;
    } else if (rawAns === "d" || rawAns === "4" || rawAns === "option d" || rawAns === "fourth") {
      correctOption = 3;
    } else {
      // Check if raw answer matches the text of any option
      const matchingIdx = options.findIndex((opt) => opt.toLowerCase() === rawAns);
      if (matchingIdx !== -1) {
        correctOption = matchingIdx;
      } else {
        const parsedInt = parseInt(rawAns, 10);
        if (!isNaN(parsedInt)) {
          // If 1-4, map to 0-3; if 0-3, keep
          if (parsedInt >= 1 && parsedInt <= 4) correctOption = parsedInt - 1;
          else if (parsedInt >= 0 && parsedInt <= 3) correctOption = parsedInt;
        }
      }
    }

    const explanation = (row[safeExp] || "").trim() || `The correct answer is Option ${String.fromCharCode(65 + correctOption)}.`;

    questions.push({
      question: questionText,
      question_image: "",
      options: options.slice(0, 4),
      option_images: ["", "", "", ""],
      correct_option: correctOption,
      explanation: explanation
    });
  }

  return questions;
}

// Parse JSON text into standardized Question objects
export function parseJSONText(text) {
  if (!text || typeof text !== "string") return [];
  try {
    let parsed = JSON.parse(text);
    if (!Array.isArray(parsed) && parsed.questions && Array.isArray(parsed.questions)) {
      parsed = parsed.questions;
    }
    if (!Array.isArray(parsed)) return [];

    return parsed.map((item, idx) => {
      const qText = item.question || item.prompt || item.title || `Question ${idx + 1}`;
      let opts = [];
      if (Array.isArray(item.options)) {
        opts = item.options.map((o) => String(o || "").trim());
      } else {
        const a = item.optionA || item.option1 || item.a || "";
        const b = item.optionB || item.option2 || item.b || "";
        const c = item.optionC || item.option3 || item.c || "";
        const d = item.optionD || item.option4 || item.d || "";
        opts = [a, b, c, d];
      }
      while (opts.length < 4) {
        opts.push(`Option ${opts.length + 1}`);
      }

      let correct = 0;
      if (typeof item.correct_option === "number" && item.correct_option >= 0 && item.correct_option <= 3) {
        correct = item.correct_option;
      } else {
        const rawAns = String(item.answer || item.correct || item.correct_option || "").trim().toLowerCase();
        if (rawAns === "a" || rawAns === "1" || rawAns === "0") correct = 0;
        else if (rawAns === "b" || rawAns === "2") correct = 1;
        else if (rawAns === "c" || rawAns === "3") correct = 2;
        else if (rawAns === "d" || rawAns === "4") correct = 3;
        else {
          const match = opts.findIndex((o) => o.toLowerCase() === rawAns);
          if (match !== -1) correct = match;
        }
      }

      return {
        question: qText,
        question_image: item.question_image || "",
        options: opts.slice(0, 4),
        option_images: item.option_images || ["", "", "", ""],
        correct_option: correct,
        explanation: item.explanation || item.solution || `Correct choice is Option ${String.fromCharCode(65 + correct)}.`
      };
    });
  } catch (err) {
    console.error("Failed to parse JSON dataset:", err);
    return [];
  }
}

// Master parser detecting format automatically
export function parseDatasetFileOrText(content) {
  const trimmed = (content || "").trim();
  if (!trimmed) return [];

  if (trimmed.startsWith("[") || (trimmed.startsWith("{") && trimmed.includes('"questions"'))) {
    const jsonResult = parseJSONText(trimmed);
    if (jsonResult.length > 0) return jsonResult;
  }

  const rows = parseCSVText(trimmed);
  return convertRowsToQuestions(rows);
}

// Sample CSV file generator & downloader
export function downloadSampleCSV() {
  const csvContent = `question,optionA,optionB,optionC,optionD,correct_option,explanation
"What does EVM stand for in Ethereum blockchain?","Ethereum Virtual Machine","Ether Verification Model","External Validated Mechanism","Encoded Vector Matrix","A","EVM stands for Ethereum Virtual Machine, the runtime environment for smart contracts."
"Which Solidity visibility specifier makes a function callable only from outside the contract?","public","private","external","internal","C","The external keyword denotes functions that can be called from other contracts and via transactions, but cannot be called internally without this."
"What is the main benefit of Merkle Trees in blockchain architecture?","Zero gas cost deployments","Efficient and secure verification of large data sets","Automated liquidity rebalancing","Instant wallet private key recovery","B","Merkle trees allow cryptographic proof that a transaction is present in a block with logarithmic verification complexity."
"Which HTTP status code signifies a successful REST API request?","200 OK","404 Not Found","500 Internal Error","301 Moved Permanently","A","HTTP 200 OK indicates that the request has succeeded."`;

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "edusphere_test_dataset_template.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Sample JSON file generator & downloader
export function downloadSampleJSON() {
  const sampleData = [
    {
      question: "What does EVM stand for in Ethereum blockchain?",
      options: [
        "Ethereum Virtual Machine",
        "Ether Verification Model",
        "External Validated Mechanism",
        "Encoded Vector Matrix"
      ],
      correct_option: 0,
      explanation: "EVM stands for Ethereum Virtual Machine, the runtime environment for smart contracts."
    },
    {
      question: "Which Solidity visibility specifier makes a function callable only from outside the contract?",
      options: ["public", "private", "external", "internal"],
      correct_option: 2,
      explanation: "The external keyword denotes functions that can be called from other contracts, but not internally without this."
    },
    {
      question: "What is the main benefit of Merkle Trees in blockchain architecture?",
      options: [
        "Zero gas cost deployments",
        "Efficient and secure verification of large data sets",
        "Automated liquidity rebalancing",
        "Instant wallet private key recovery"
      ],
      correct_option: 1,
      explanation: "Merkle trees allow cryptographic proof that a transaction is present in a block with logarithmic complexity."
    }
  ];

  const blob = new Blob([JSON.stringify(sampleData, null, 2)], { type: "application/json;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "edusphere_test_dataset_template.json");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
