DROP TABLE IF EXISTS games;

CREATE TABLE games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    story_type TEXT NOT NULL,
    writing_style TEXT,
    author TEXT,
    title TEXT,
    story_map TEXT,          -- JSON string
    story_history TEXT DEFAULT '[]', -- JSON string
    current_scene_json TEXT,  -- JSON string
    current_node_id TEXT DEFAULT 'start',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
