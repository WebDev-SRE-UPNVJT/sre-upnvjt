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

  // Sort descending by XP
  list.sort((a, b) => (b.xp ?? 0) - (a.xp ?? 0));

  return list.map((item, idx) => ({
    ...item,
    rank: idx + 1,
  }));
}
