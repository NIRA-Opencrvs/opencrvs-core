-- Up Migration
ALTER TYPE action_type ADD VALUE IF NOT EXISTS 'ESCALATE';
-- Down Migration