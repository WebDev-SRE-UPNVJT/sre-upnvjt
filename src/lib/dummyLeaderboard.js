/**
 * Dummy member leaderboard data requested by HR for realistic competitive ranking presentation.
 * Purely frontend/API fallback, no real user accounts created in database.
 */
export const DUMMY_LEADERBOARD_MEMBERS = [
  {
    id: -101,
    name: "Kaffi Islamay Abraar",
    npm: "24071010138",
    profilePictureUrl: null,
    xp: 850,
    level: 4,
    divisionName: "Hukum",
    roleName: "MEMBER",
    isDummy: true,
  },
  {
    id: -102,
    name: "Herdanto Tri Bagus Sukma Hadi",
    npm: "23031010002",
    profilePictureUrl: null,
    xp: 680,
    level: 3,
    divisionName: "Teknik Kimia",
    roleName: "MEMBER",
    isDummy: true,
  },
  {
    id: -103,
    name: "Kemas Fatih Amanaser Razan",
    npm: "24082010102",
    profilePictureUrl: null,
    xp: 520,
    level: 3,
    divisionName: "Sistem Informasi",
    roleName: "MEMBER",
    isDummy: true,
  },
  {
    id: -104,
    name: "Ozzie Dharma Saputra",
    npm: "24036010045",
    profilePictureUrl: null,
    xp: 360,
    level: 2,
    divisionName: "Teknik Mesin",
    roleName: "MEMBER",
    isDummy: true,
  },
  {
    id: -105,
    name: "Mohammad Fayed Qalby",
    npm: "24025010160",
    profilePictureUrl: null,
    xp: 220,
    level: 2,
    divisionName: "Agroteknologi",
    roleName: "MEMBER",
    isDummy: true,
  },
];

/**
 * Merges real database member profiles with dummy members so the leaderboard
 * always displays at least 5 competitive entries for a complete ranking experience.
 *
 * @param {Array} realMembers - Array of real member records from DB
 * @returns {Array} Augmented and rank-assigned leaderboard array
 */
export function getAugmentedLeaderboard(realMembers = []) {
  const existingNpms = new Set(
    (realMembers || []).map((m) => m.npm).filter(Boolean)
  );
  const existingNames = new Set(
    (realMembers || []).map((m) => m.name?.toLowerCase().trim()).filter(Boolean)
  );

  const filteredDummies = DUMMY_LEADERBOARD_MEMBERS.filter(
    (d) =>
      !existingNpms.has(d.npm) &&
      !existingNames.has(d.name.toLowerCase().trim())
  );

  const combined = [...(realMembers || []), ...filteredDummies];

  // Sort descending by XP
  combined.sort((a, b) => (b.xp ?? 0) - (a.xp ?? 0));

  return combined.map((item, idx) => ({
    ...item,
    rank: idx + 1,
  }));
}
