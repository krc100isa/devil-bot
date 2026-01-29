CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE "DeviceType" AS ENUM ('ios', 'android', 'web', 'desktop');
CREATE TYPE "PrivacyLevel" AS ENUM ('everyone', 'contacts', 'nobody');
CREATE TYPE "ConversationType" AS ENUM ('direct', 'group', 'broadcast');
CREATE TYPE "ParticipantRole" AS ENUM ('member', 'admin', 'owner');
CREATE TYPE "ContactStatus" AS ENUM ('pending', 'accepted', 'blocked');
CREATE TYPE "NotificationPreference" AS ENUM ('all', 'mentions', 'none');

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  display_name TEXT NOT NULL,
  username TEXT UNIQUE,
  bio TEXT,
  avatar_url TEXT,
  public_key TEXT NOT NULL,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  last_seen_at TIMESTAMPTZ,
  privacy "PrivacyLevel" NOT NULL DEFAULT 'everyone',
  read_receipts BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  device_name TEXT NOT NULL,
  device_type "DeviceType" NOT NULL,
  push_token TEXT,
  ip_address TEXT NOT NULL,
  location JSONB,
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS user_sessions_user_id_idx ON user_sessions(user_id);

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
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
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

CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT,
  status "ContactStatus" NOT NULL DEFAULT 'pending',
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS contacts_user_id_idx ON contacts(user_id);
CREATE INDEX IF NOT EXISTS contacts_contact_id_idx ON contacts(contact_id);

CREATE TABLE IF NOT EXISTS prekey_bundles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  identity_key TEXT NOT NULL,
  signed_prekey_id INT NOT NULL,
  signed_prekey TEXT NOT NULL,
  signed_prekey_sig TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS one_time_prekeys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  key_id INT NOT NULL,
  public_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS one_time_prekeys_user_id_idx ON one_time_prekeys(user_id);
