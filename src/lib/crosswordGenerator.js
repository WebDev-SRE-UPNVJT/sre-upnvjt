/**
 * Robust Crossword / Teka-Teki Silang (TTS) Layout Generator
 * 
 * Features:
 * - Sanitizes Indonesian/English text answers (removes spaces, symbols, uppercase conversion)
 * - Multi-pass stochastic backtracking to find optimal interlocking layouts
 * - Enforces crossword rules (no adjacent parallel touches, empty ends, correct crossings)
 * - Standard crossword numbering (top-to-bottom, left-to-right)
 * - Generates clean 2D grid matrix and categorized clues (Mendatar / Menurun)
 */

export function sanitizeAnswer(text) {
  if (!text) return "";
  return String(text)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

// Deterministic Seeded PRNG (Mulberry32)
function createSeededRandom(seed = 42) {
  let s = (typeof seed === "number" ? seed : 42) >>> 0;
  if (s === 0) s = 42;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generate a Crossword Layout from a list of items
 * @param {Array<{id: string|number, clue: string, answer: string}>} items 
 * @param {Object} options
 * @returns {Object} Generated Crossword Data
 */
export function generateCrosswordLayout(items = [], options = {}) {
  const maxIterations = options.maxIterations || 60;
  const rng = createSeededRandom(options.seed || 42);
  
  // Filter valid items
  const validItems = items
    .map((item, index) => {
      const sanitized = sanitizeAnswer(item.answer);
      return {
        id: item.id || `item_${index + 1}`,
        rawId: index + 1,
        clue: item.clue || `Pertanyaan #${index + 1}`,
        answer: sanitized,
        originalAnswer: item.answer || "",
        points: parseInt(item.points) || 10,
        length: sanitized.length,
      };
    })
    .filter(item => item.answer.length >= 2);

  if (validItems.length === 0) {
    return {
      grid: [],
      rows: 0,
      cols: 0,
      placedWords: [],
      unplacedWords: [],
      clues: { across: [], down: [] },
      stats: { totalWords: 0, placedCount: 0, unplacedCount: 0, totalIntersections: 0, density: 0 }
    };
  }

  let bestResult = null;
  let bestScore = -Infinity;

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    // Sort items: longest words first, with deterministic seeded perturbation for different iterations
    const wordsToPlace = [...validItems].sort((a, b) => {
      if (iteration === 0) return b.length - a.length;
      return (b.length + (rng() * 2 - 1)) - (a.length + (rng() * 2 - 1));
    });

    const gridMap = new Map(); // key: `${r},${c}` => { char, acrossWordId, downWordId }
    const placed = [];
    const unplaced = [];

    // Place the first (seed) word at origin (0, 0)
    const seed = wordsToPlace[0];
    const seedDirection = (iteration % 2 === 0) ? "ACROSS" : "DOWN";
    placeWordOnMap(gridMap, seed, 0, 0, seedDirection);
    placed.push({
      ...seed,
      row: 0,
      col: 0,
      direction: seedDirection,
    });

    // Place subsequent words
    for (let i = 1; i < wordsToPlace.length; i++) {
      const word = wordsToPlace[i];
      const validPlacements = findPossiblePlacements(gridMap, word, placed);

      if (validPlacements.length > 0) {
        // Pick best placement based on proximity to center and intersections
        validPlacements.sort((a, b) => b.score - a.score);
        const bestPlacement = validPlacements[0];

        placeWordOnMap(gridMap, word, bestPlacement.row, bestPlacement.col, bestPlacement.direction);
        placed.push({
          ...word,
          row: bestPlacement.row,
          col: bestPlacement.col,
          direction: bestPlacement.direction,
          intersections: bestPlacement.intersections,
        });
      } else {
        unplaced.push(word);
      }
    }

    // Evaluate iteration score
    const bounds = calculateBounds(gridMap);
    const width = bounds ? bounds.maxX - bounds.minX + 1 : 0;
    const height = bounds ? bounds.maxY - bounds.minY + 1 : 0;
    const area = width * height;
    const totalIntersections = countTotalIntersections(placed, gridMap);

    // Score formula: high reward for more placed words, more intersections, lower area, aspect ratio close to 1:1
    const aspectRatioPenalty = Math.abs(width - height) * 4;
    const score = (placed.length * 1000) + (totalIntersections * 150) - (area * 3) - aspectRatioPenalty;

    if (score > bestScore || !bestResult) {
      bestScore = score;
      bestResult = {
        gridMap,
        placed,
        unplaced,
        bounds,
      };

      // If all words are placed with good intersections, we can break early
      if (placed.length === validItems.length && iteration > 20) {
        break;
      }
    }
  }

  // Format and build final grid matrix with standard crossword numbering
  return formatFinalResult(bestResult, validItems);
}

function placeWordOnMap(gridMap, word, startRow, startCol, direction) {
  const isAcross = direction === "ACROSS";
  for (let idx = 0; idx < word.answer.length; idx++) {
    const r = isAcross ? startRow : startRow + idx;
    const c = isAcross ? startCol + idx : startCol;
    const key = `${r},${c}`;
    const existing = gridMap.get(key) || {};

    gridMap.set(key, {
      char: word.answer[idx],
      acrossWordId: isAcross ? word.id : existing.acrossWordId,
      downWordId: !isAcross ? word.id : existing.downWordId,
    });
  }
}

function findPossiblePlacements(gridMap, word, placedWords) {
  const placements = [];

  for (let letterIdx = 0; letterIdx < word.answer.length; letterIdx++) {
    const char = word.answer[letterIdx];

    // Find all matching cells in gridMap
    for (const [key, cell] of gridMap.entries()) {
      if (cell.char === char) {
        const [cellRow, cellCol] = key.split(",").map(Number);

        // If the matching cell is used in an ACROSS word, try placing this word DOWN
        if (cell.acrossWordId && !cell.downWordId) {
          const startRow = cellRow - letterIdx;
          const startCol = cellCol;
          if (canPlaceWord(gridMap, word.answer, startRow, startCol, "DOWN", word.id)) {
            const score = evaluatePlacementScore(gridMap, word.answer, startRow, startCol, "DOWN");
            placements.push({ row: startRow, col: startCol, direction: "DOWN", score, intersections: 1 });
          }
        }

        // If the matching cell is used in a DOWN word, try placing this word ACROSS
        if (cell.downWordId && !cell.acrossWordId) {
          const startRow = cellRow;
          const startCol = cellCol - letterIdx;
          if (canPlaceWord(gridMap, word.answer, startRow, startCol, "ACROSS", word.id)) {
            const score = evaluatePlacementScore(gridMap, word.answer, startRow, startCol, "ACROSS");
            placements.push({ row: startRow, col: startCol, direction: "ACROSS", score, intersections: 1 });
          }
        }
      }
    }
  }

  return placements;
}

function canPlaceWord(gridMap, answer, startRow, startCol, direction, currentWordId) {
  const isAcross = direction === "ACROSS";
  const len = answer.length;

  // 1. Check cell immediately before word start
  const beforeKey = isAcross ? `${startRow},${startCol - 1}` : `${startRow - 1},${startCol}`;
  if (gridMap.has(beforeKey)) return false;

  // 2. Check cell immediately after word end
  const afterKey = isAcross ? `${startRow},${startCol + len}` : `${startRow + len},${startCol}`;
  if (gridMap.has(afterKey)) return false;

  let hasIntersection = false;

  for (let i = 0; i < len; i++) {
    const r = isAcross ? startRow : startRow + i;
    const c = isAcross ? startCol + i : startCol;
    const key = `${r},${c}`;
    const cell = gridMap.get(key);

    if (cell) {
      // Must match letter
      if (cell.char !== answer[i]) return false;
      // Cannot cross a word in the same direction
      if (isAcross && cell.acrossWordId) return false;
      if (!isAcross && cell.downWordId) return false;
      hasIntersection = true;
    } else {
      // Empty cell: check orthogonal neighbors to prevent invalid touching
      if (isAcross) {
        // Checking top and bottom neighbors
        const topKey = `${r - 1},${c}`;
        const bottomKey = `${r + 1},${c}`;
        if (gridMap.has(topKey) || gridMap.has(bottomKey)) {
          return false;
        }
      } else {
        // Checking left and right neighbors
        const leftKey = `${r},${c - 1}`;
        const rightKey = `${r},${c + 1}`;
        if (gridMap.has(leftKey) || gridMap.has(rightKey)) {
          return false;
        }
      }
    }
  }

  return hasIntersection;
}

function evaluatePlacementScore(gridMap, answer, startRow, startCol, direction) {
  const isAcross = direction === "ACROSS";
  let intersections = 0;

  for (let i = 0; i < answer.length; i++) {
    const r = isAcross ? startRow : startRow + i;
    const c = isAcross ? startCol + i : startCol;
    const key = `${r},${c}`;
    if (gridMap.has(key)) {
      intersections++;
    }
  }

  // Closeness to origin
  const distFromOrigin = Math.abs(startRow) + Math.abs(startCol);
  return (intersections * 25) - distFromOrigin;
}

function calculateBounds(gridMap) {
  if (gridMap.size === 0) return null;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

  for (const key of gridMap.keys()) {
    const [r, c] = key.split(",").map(Number);
    if (r < minY) minY = r;
    if (r > maxY) maxY = r;
    if (c < minX) minX = c;
    if (c > maxX) maxX = c;
  }

  return { minX, maxX, minY, maxY };
}

function countTotalIntersections(placedWords, gridMap) {
  let count = 0;
  for (const cell of gridMap.values()) {
    if (cell.acrossWordId && cell.downWordId) {
      count++;
    }
  }
  return count;
}

function formatFinalResult(bestResult, allValidItems) {
  if (!bestResult || !bestResult.bounds) {
    return {
      grid: [],
      rows: 0,
      cols: 0,
      placedWords: [],
      unplacedWords: allValidItems,
      clues: { across: [], down: [] },
      stats: { totalWords: allValidItems.length, placedCount: 0, unplacedCount: allValidItems.length, totalIntersections: 0, density: 0 }
    };
  }

  const { gridMap, placed, unplaced, bounds } = bestResult;
  const rowOffset = bounds.minY;
  const colOffset = bounds.minX;
  const rows = bounds.maxY - bounds.minY + 1;
  const cols = bounds.maxX - bounds.minX + 1;

  // Normalized placed words coordinates
  const normalizedPlaced = placed.map(word => ({
    ...word,
    row: word.row - rowOffset,
    col: word.col - colOffset,
  }));

  // Create empty 2D grid matrix
  const grid = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => ({
      row: r,
      col: c,
      char: null,
      number: null,
      acrossWordId: null,
      downWordId: null,
      isStartAcross: false,
      isStartDown: false,
    }))
  );

  // Fill in characters and word references
  for (const word of normalizedPlaced) {
    const isAcross = word.direction === "ACROSS";
    for (let i = 0; i < word.length; i++) {
      const r = isAcross ? word.row : word.row + i;
      const c = isAcross ? word.col + i : word.col;
      const cell = grid[r][c];

      cell.char = word.answer[i];
      if (isAcross) cell.acrossWordId = word.id;
      else cell.downWordId = word.id;

      if (i === 0) {
        if (isAcross) cell.isStartAcross = true;
        else cell.isStartDown = true;
      }
    }
  }

  // Standard Crossword Numbering: Top-to-bottom, Left-to-right
  let clueNumber = 1;
  const acrossClues = [];
  const downClues = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = grid[r][c];
      if (!cell.char) continue;

      let isNumbered = false;

      // Check if this cell is start of an across word
      if (cell.isStartAcross) {
        const word = normalizedPlaced.find(w => w.id === cell.acrossWordId && w.direction === "ACROSS");
        if (word) {
          word.number = clueNumber;
          cell.number = clueNumber;
          isNumbered = true;
          acrossClues.push({
            id: word.id,
            number: clueNumber,
            clue: word.clue,
            answer: word.answer,
            originalAnswer: word.originalAnswer || word.answer,
            points: word.points || 10,
            length: word.length,
            direction: "ACROSS",
            row: word.row,
            col: word.col,
          });
        }
      }

      // Check if this cell is start of a down word
      if (cell.isStartDown) {
        const word = normalizedPlaced.find(w => w.id === cell.downWordId && w.direction === "DOWN");
        if (word) {
          word.number = clueNumber;
          cell.number = clueNumber;
          isNumbered = true;
          downClues.push({
            id: word.id,
            number: clueNumber,
            clue: word.clue,
            answer: word.answer,
            originalAnswer: word.originalAnswer || word.answer,
            points: word.points || 10,
            length: word.length,
            direction: "DOWN",
            row: word.row,
            col: word.col,
          });
        }
      }

      if (isNumbered) {
        clueNumber++;
      }
    }
  }

  // Sort clues by number
  acrossClues.sort((a, b) => a.number - b.number);
  downClues.sort((a, b) => a.number - b.number);

  let filledCellsCount = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c].char) filledCellsCount++;
    }
  }

  const density = rows * cols > 0 ? Math.round((filledCellsCount / (rows * cols)) * 100) : 0;
  const totalIntersections = countTotalIntersections(normalizedPlaced, bestResult.gridMap);

  return {
    grid,
    rows,
    cols,
    placedWords: normalizedPlaced,
    unplacedWords: unplaced,
    clues: {
      across: acrossClues,
      down: downClues,
    },
    stats: {
      totalWords: allValidItems.length,
      placedCount: normalizedPlaced.length,
      unplacedCount: unplaced.length,
      totalIntersections,
      density,
    },
  };
}

/**
 * Sample Preset Datasets
 */
export const SAMPLE_TTS_PRESETS = [
  {
    id: "sre_energy",
    title: "Energi Bersih & Terbarukan (SRE UPNVJT)",
    description: "Teka-teki silang seputar transisi energi, panel surya, biomassa, dan komitmen energi hijau.",
    items: [
      { clue: "Sumber energi bersih yang berasal dari pancaran sinar dan panas matahari", answer: "SURYA" },
      { clue: "Pembangkit listrik tenaga air memanfaatkan energi gerak aliran...", answer: "AIR" },
      { clue: "Bahan bakar nabati yang dibuat dari minyak tumbuhan atau lemak hewani", answer: "BIODIESEL" },
      { clue: "Organisasi kepemudaan penggerak energi terbarukan di kampus kita", answer: "SRE" },
      { clue: "Sumber energi panas bumi yang melimpah di wilayah ring of fire Indonesia", answer: "GEOTHERMAL" },
      { clue: "Kincir raksasa pengubah energi angin menjadi listrik disebut turbin...", answer: "ANGIN" },
      { clue: "Bahan organik dari tumbuhan dan hewan untuk energi pembangkit", answer: "BIOMASSA" },
      { clue: "Target global mencapai emisi nol bersih dikenal dengan istilah Net Zero...", answer: "EMISSION" },
      { clue: "Satuan daya listrik yang umum digunakan untuk kapasitas panel surya", answer: "WATT" },
      { clue: "Perangkat penyimpan energi listrik untuk mendukung PLTS saat malam", answer: "BATERAI" },
    ]
  },
  {
    id: "tech_ai",
    title: "Teknologi & Artificial Intelligence",
    description: "Kosa kata fundamental dunia pemrograman, data, dan kecerdasan buatan.",
    items: [
      { clue: "Model bahasa besar AI seperti Gemini dan ChatGPT", answer: "LLM" },
      { clue: "Bahasa pemrograman populer yang identik dengan logo ular", answer: "PYTHON" },
      { clue: "Struktur data berupa jaringan simpul saling terhubung", answer: "GRAPH" },
      { clue: "Sistem pengontrol versi kode paling populer di dunia", answer: "GIT" },
      { clue: "Otak utama dari sebuah komputer untuk memproses instruksi", answer: "CPU" },
      { clue: "Jaringan saraf tiruan dalam deep learning", answer: "NEURAL" },
      { clue: "Satuan terkecil informasi dalam komputasi digital (0 atau 1)", answer: "BIT" },
      { clue: "Basis data relasional berbasis baris dan kolom", answer: "SQL" },
    ]
  },
  {
    id: "nusantara",
    title: "Geografi & Wawasan Nusantara",
    description: "Kuis santai seputar kepulauan, ibu kota, dan budaya Indonesia.",
    items: [
      { clue: "Ibu Kota Nusantara yang berlokasi di Kalimantan Timur", answer: "IKN" },
      { clue: "Pulau dewata yang terkenal dengan pariwisata internasional", answer: "BALI" },
      { clue: "Danau vulkanik terbesar di Asia Tenggara yang berada di Sumatra", answer: "TOBA" },
      { clue: "Kain tradisional Indonesia yang diakui UNESCO sebagai warisan dunia", answer: "BATIK" },
      { clue: "Gunung tertinggi di pulau Jawa", answer: "SEMERU" },
      { clue: "Mata uang resmi Republik Indonesia", answer: "RUPIAH" },
      { clue: "Lagu kebangsaan negara Indonesia", answer: "RAYA" },
    ]
  }
];
