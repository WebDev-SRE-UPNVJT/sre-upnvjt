/**
 * Leaderboard ranking utility.
 * Ranks real database members sorted by XP descending.
 */
export const DUMMY_LEADERBOARD_MEMBERS = [];

/**
 * Assigns ranks to real database member profiles based on XP descending.
 *
 * @param {Array} realMembers - Array of real member records from DB
 * @returns {Array} Rank-assigned leaderboard array
 */
export function getAugmentedLeaderboard(realMembers = []) {
  const list = [...(realMembers || [])];

  // Sort descending by XP, with deterministic tie-breaker:
  // 1. XP (descending)
  // 2. User ID / Registration order (ascending - earlier user wins tie)
  // 3. Name (ascending alphabetical)
  list.sort((a, b) => {
    const diffXp = (b.xp ?? 0) - (a.xp ?? 0);
    if (diffXp !== 0) return diffXp;

    const idA = typeof a.id === "number" ? a.id : parseInt(a.id) || 0;
    const idB = typeof b.id === "number" ? b.id : parseInt(b.id) || 0;
    if (idA !== idB && idA > 0 && idB > 0) {
      return idA - idB;
    }

    const nameA = String(a.name || "").trim().toLowerCase();
    const nameB = String(b.name || "").trim().toLowerCase();
    return nameA.localeCompare(nameB);
  });

  return list.map((item, idx) => ({
    ...item,
    rank: idx + 1,
  }));
}
