export interface Game {
  id: number;
  story_type: string;
  writing_style: string | null;
  author: string | null;
  title: string | null;
  story_map: string | null;
  story_history: string | null;
  current_scene_json: string | null;
  current_node_id: string;
  created_at: string;
  updated_at: string;
}

export async function createGame(db: D1Database, storyType: string): Promise<number> {
  const result = await db
    .prepare("INSERT INTO games (story_type) VALUES (?)")
    .bind(storyType)
    .run();
  return result.meta.last_row_id;
}

export async function getGame(db: D1Database, id: number): Promise<Game | null> {
  return await db.prepare("SELECT * FROM games WHERE id = ?").bind(id).first<Game>();
}

export async function updateGame(
  db: D1Database,
  id: number,
  data: Partial<Omit<Game, "id" | "created_at" | "updated_at">>
): Promise<void> {
  const keys = Object.keys(data);
  if (keys.length === 0) return;

  const setClause = keys.map((key) => `${key} = ?`).join(", ");
  const values = Object.values(data);

  await db
    .prepare(`UPDATE games SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
    .bind(...values, id)
    .run();
}
