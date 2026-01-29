CREATE TYPE "ConversationType" AS ENUM ('direct', 'group', 'broadcast');
CREATE TYPE "ParticipantRole" AS ENUM ('member', 'admin', 'owner');
CREATE TYPE "NotificationPreference" AS ENUM ('all', 'mentions', 'none');

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type "ConversationType" NOT NULL,
  name TEXT,
  description TEXT,
  avatar_url TEXT,
  creator_id UUID NOT NULL,
  admins UUID[] NOT NULL DEFAULT '{}',
  settings JSONB,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role "ParticipantRole" NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  left_at TIMESTAMPTZ,
  last_read_message_id UUID,
  is_muted BOOLEAN NOT NULL DEFAULT FALSE,
  mute_until TIMESTAMPTZ,
  notifications "NotificationPreference" NOT NULL DEFAULT 'all'
);

CREATE INDEX IF NOT EXISTS conversation_participants_conversation_id_idx ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS conversation_participants_user_id_idx ON conversation_participants(user_id);
