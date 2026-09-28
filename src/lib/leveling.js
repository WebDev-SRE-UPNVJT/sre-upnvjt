export const LEVEL_TIERS = [
  { level: 5, name: "RE-Power", minXp: 3500, color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  { level: 4, name: "RE-Gen", minXp: 2500, color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  { level: 3, name: "RE-Charge", minXp: 1500, color: "bg-green-500/10 text-green-400 border-green-500/20" },
  { level: 2, name: "RE-Act", minXp: 500, color: "bg-teal-500/10 text-teal-400 border-teal-500/20" },
  { level: 1, name: "RE-Source", minXp: 0, color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
];

/**
 * Menghitung level numerik (1 - 5) berdasarkan total XP
 * @param {number} totalXp
 * @returns {number}
 */
export function calculateLevel(totalXp) {
  const xp = Number(totalXp) || 0;
  const currentTier = LEVEL_TIERS.find(tier => xp >= tier.minXp) || LEVEL_TIERS[LEVEL_TIERS.length - 1];
  return currentTier.level;
}

/**
 * Mendapatkan data level lengkap (nama, warna, progress bar) berdasarkan total XP
 * 
 * @param {number} totalXp - Total XP / Points yang dimiliki user
 * @returns {Object} Data level lengkap (currentLevel, levelName, color, nextLevelXp, progressPercentage)
 */
export function getUserLevelData(totalXp) {
  // Pastikan totalXp tidak undefined/NaN
  const xp = Number(totalXp) || 0;

  // Cari level saat ini (karena array diurutkan dari terbesar, find() akan menemukan level tertinggi yang bisa dicapai)
  const currentTier = LEVEL_TIERS.find(tier => xp >= tier.minXp) || LEVEL_TIERS[LEVEL_TIERS.length - 1];
  
  // Cari target level berikutnya (jika level 5, nextTier = undefined)
  const nextTier = LEVEL_TIERS.find(tier => tier.level === currentTier.level + 1);
  
  let progress = 100; // Jika max level, progress selalu 100%
  
  if (nextTier) {
    // Range XP yang dibutuhkan khusus di level ini (contoh: dari 300 ke 500 butuh 200 XP)
    const xpNeededForNext = nextTier.minXp - currentTier.minXp;
    
    // XP yang sudah dikumpulkan sejak naik ke level ini (contoh: punya 400 XP, berarti 400 - 300 = 100 XP)
    const currentXpProgress = xp - currentTier.minXp;
    
    progress = (currentXpProgress / xpNeededForNext) * 100;
  }

  return {
    currentLevel: currentTier.level,
    levelName: currentTier.name,
    color: currentTier.color,
    totalXp: xp,
    nextLevelXp: nextTier ? nextTier.minXp : null,
    xpToNextLevel: nextTier ? Math.max(0, nextTier.minXp - xp) : 0,
    currentTier,
    nextTier: nextTier || null,
    progressPercentage: Math.min(Math.max(progress, 0), 100) // Memastikan nilai tidak bocor di bawah 0 atau di atas 100
  };
}
