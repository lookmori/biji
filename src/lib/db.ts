import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL!);

/** 初始化数据库表（幂等） */
export async function initDB() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(100) DEFAULT '',
      avatar_url TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS folders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL DEFAULT '新建文件夹',
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS notes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
      title VARCHAR(500) NOT NULL DEFAULT '未命名笔记',
      content TEXT DEFAULT '',
      is_favorite BOOLEAN DEFAULT false,
      is_deleted BOOLEAN DEFAULT false,
      deleted_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS canvas_records (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
      canvas_type VARCHAR(20) NOT NULL CHECK (canvas_type IN ('draw', 'mindMap', 'flowChart')),
      canvas_data JSONB DEFAULT '{}',
      preview_image_url TEXT DEFAULT '',
      panel_status VARCHAR(10) DEFAULT 'min' CHECK (panel_status IN ('min', 'half', 'full')),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(note_id, canvas_type)
    );
  `;

  // 分享 token
  await sql`ALTER TABLE notes ADD COLUMN IF NOT EXISTS share_token VARCHAR(32) UNIQUE`;
  await sql`CREATE INDEX IF NOT EXISTS idx_notes_share_token ON notes(share_token)`;

  await sql`
    CREATE TABLE IF NOT EXISTS note_uploads (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  console.log("[db] tables ready");
}

export { sql };
