-- Add the role assignment timestamp to databases created before user_roles included it.
-- Existing rows receive the migration time because their original assignment time is unknown.
ALTER TABLE nexus_user.user_roles
    ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ NOT NULL DEFAULT now();
