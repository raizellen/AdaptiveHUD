// Mission details shown on the HUD (title + objective). Kept free of
// Node-only imports so both the backend and the Expo app can use it.

export interface Mission {
  title: string;
  objective: string;
}

export const DEFAULT_MISSION: Mission = {
  title: "Untitled Mission",
  objective: "No objective set",
};

// Anything longer than this won't fit on the HUD anyway; overlong input
// is cut rather than rejected.
export const MAX_TITLE_LENGTH = 80;
export const MAX_OBJECTIVE_LENGTH = 300;

export type MissionUpdateResult =
  | { ok: true; mission: Mission }
  | { ok: false; error: string };

// Merges a partial update (e.g. the parsed body of POST /mission) onto
// the current mission. Fields that are left out keep their current
// value; fields that are present must be strings. An empty string is
// allowed so a field can be cleared.
export function applyMissionUpdate(
  current: Mission,
  update: unknown
): MissionUpdateResult {
  if (typeof update !== "object" || update === null || Array.isArray(update)) {
    return { ok: false, error: "Mission update must be a JSON object" };
  }

  const { title, objective } = update as Record<string, unknown>;

  if (title !== undefined && typeof title !== "string") {
    return { ok: false, error: "title must be a string" };
  }
  if (objective !== undefined && typeof objective !== "string") {
    return { ok: false, error: "objective must be a string" };
  }

  return {
    ok: true,
    mission: {
      title:
        title === undefined
          ? current.title
          : title.replace(/\s+/g, " ").trim().slice(0, MAX_TITLE_LENGTH),
      objective:
        objective === undefined
          ? current.objective
          : objective.trim().slice(0, MAX_OBJECTIVE_LENGTH),
    },
  };
}