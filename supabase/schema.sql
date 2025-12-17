

-- Projects: The container for a video idea
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL, -- Usually derived from the idea or prompt
  theme TEXT,
  style TEXT,
  constraints TEXT,
  scene_count INTEGER DEFAULT 3,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'script', 'image', 'video', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scenes: Individual steps in the video
CREATE TABLE IF NOT EXISTS scenes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  "order" INTEGER NOT NULL,
  script TEXT, -- Generated text
  prompt TEXT, -- Image generation prompt
  image_url TEXT, -- Generated image
  video_url TEXT, -- Generated video segment
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_scenes_project_id ON scenes(project_id);
