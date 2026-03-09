import type { ReviewTag, SkillLevel } from "@/types";

// ============================================================
// Shared constants used across the application
// ============================================================

// --- Demographics ---

export const AGE_RANGES = ["18-29", "30-39", "40-49", "50-59", "60+"];
export const GENDERS = ["Male", "Female", "Non-binary", "Prefer not to say"];

// --- Sports ---

export const SPORTS = [
  { value: "soccer", label: "Soccer" },
  { value: "basketball", label: "Basketball" },
  { value: "tennis", label: "Tennis" },
  { value: "volleyball", label: "Volleyball" },
  { value: "hockey", label: "Hockey" },
  { value: "lacrosse", label: "Lacrosse" },
  { value: "pickleball", label: "Pickleball" },
  { value: "ultimate frisbee", label: "Ultimate Frisbee" },
  { value: "football", label: "Football" },
  { value: "baseball", label: "Baseball" },
  { value: "softball", label: "Softball" },
  { value: "rugby", label: "Rugby" },
  { value: "badminton", label: "Badminton" },
  { value: "table tennis", label: "Table Tennis" },
] as const;

/** Just the display names, used for filter badges */
export const SPORT_NAMES = SPORTS.map((s) => s.label);

// --- Skill Levels ---

export const SKILL_LEVELS: SkillLevel[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "PRO"];

/** Skill levels for game creation (lowercase values matching DB) */
export const GAME_SKILL_LEVELS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "pro", label: "Pro" },
  { value: "friendly", label: "Friendly / All Levels" },
] as const;

/** Ordinal values for skill comparison in join validation */
export const SKILL_LEVEL_VALUES: Record<string, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
  pro: 4,
};

// --- Player Roles ---

export const PLAYER_ROLES = {
  OWNER: "OWNER",
  PARTICIPANT: "PARTICIPANT",
} as const;

// --- Review Tags ---

export const POSITIVE_REVIEW_TAGS: ReviewTag[] = [
  { id: "good_sport", label: "Good Sport", emoji: "🤝" },
  { id: "skilled", label: "Skilled", emoji: "⭐" },
  { id: "great_communicator", label: "Great Communicator", emoji: "💬" },
  { id: "beginner_friendly", label: "Beginner Friendly", emoji: "🌱" },
  { id: "high_energy", label: "High Energy", emoji: "⚡" },
];

export const NEGATIVE_REVIEW_TAGS: ReviewTag[] = [
  { id: "too_aggressive", label: "Too Aggressive", emoji: "😤" },
  { id: "poor_sportsmanship", label: "Poor Sportsmanship", emoji: "👎" },
  { id: "no_show", label: "No Show", emoji: "👻" },
];

// --- Map Defaults ---

export const DEFAULT_MAP_CENTER = {
  latitude: 34.0522,
  longitude: -118.2437,
} as const;

export const DEFAULT_MAP_ZOOM = 11;

// --- Limits ---

export const NOTIFICATION_FETCH_LIMIT = 20;
export const COMMUTE_RADIUS_MIN = 1;
export const COMMUTE_RADIUS_MAX = 50;
export const COMMUTE_RADIUS_DEFAULT = 10;
export const RECURRING_SESSION_COUNT = 4;

// --- Routes ---

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  ONBOARDING: "/onboarding",
  PICKUP: "/pickup",
  DASHBOARD: "/dashboard",
  ADMIN: "/admin",
  ADMIN_LEAGUES: "/admin/leagues",
} as const;
