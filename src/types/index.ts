// ============================================================
// Core entity types used across the application
// ============================================================

// --- Database row types (snake_case, matching Supabase schema) ---

export interface Profile {
  id: string;
  email?: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  age_range: string | null;
  gender: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  commute_radius: number | null;
  interested_in_leagues: boolean;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface Sport {
  id: string;
  name: string;
  icon?: string;
}

export interface PickupSession {
  id: string;
  title: string;
  sport_id: string;
  host_id: string | null;
  location: string;
  latitude: number | null;
  longitude: number | null;
  start_time: string;
  player_limit: number | null;
  fee: number | string;
  level: string | null;
  description: string | null;
  is_recurring: boolean;
  series_id: string | null;
  created_at: string;

  // Joined relations (optional, populated by select queries)
  sport?: Sport;
  host?: Profile;
  players?: { count: number }[];
}

/** Frontend-friendly session format returned from /api/pickup */
export interface FormattedSession extends PickupSession {
  startTime: string;
  playerLimit: number | null;
  recurringDay: string | null;
  _count: {
    players: number;
  };
}

export interface SessionPlayer {
  id: string;
  session_id: string;
  profile_id: string;
  role: PlayerRole;
  joined_at: string;
}

export interface SessionMessage {
  id: string;
  session_id: string;
  series_id: string | null;
  profile_id: string;
  content: string;
  created_at: string;
  profiles: ProfileSummary | null;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  message: string;
  link: string;
  read: boolean;
  created_at: string;
}

export interface PlayerReview {
  id: string;
  session_id: string;
  reviewer_id: string;
  reviewed_id: string;
  rating: number;
  tags: string[];
  created_at: string;
}

export interface League {
  id: string;
  name: string;
  sport: string;
  location: string;
  description: string;
  owner_id: string;
  created_at: string;
}

export interface SportSkill {
  id: string;
  profile_id: string;
  sport_id: string;
  level: SkillLevel;
}

// --- Subset/summary types for nested selects ---

export interface ProfileSummary {
  first_name: string;
  last_name: string;
  avatar_url: string | null;
}

export interface PlayerToReview {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
}

// --- Enum-like types ---

export type NotificationType = "CHAT" | "LOCATION_UPDATE" | "TIME_UPDATE" | "GAME_UPDATE";
export type PlayerRole = "OWNER" | "PARTICIPANT";
export type SkillLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "PRO";

// --- Map / geo types ---

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  zoom: number;
}

// --- Review tag types ---

export interface ReviewTag {
  id: string;
  label: string;
  emoji: string;
}
