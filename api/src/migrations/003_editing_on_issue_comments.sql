ALTER TABLE issue_comments
ADD COLUMN IF NOT EXISTS edited BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE issue_comments
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE TRIGGER update_issue_comments_updated_at
BEFORE UPDATE ON issue_comments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();