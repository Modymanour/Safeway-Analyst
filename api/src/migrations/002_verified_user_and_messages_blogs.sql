ALTER TABLE users
ADD COLUMN verified BOOLEAN NOT NULL DEFAULT false;


CREATE TABLE IF NOT EXISTS verification_tokens(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verification_tokens_user_token
    ON verification_tokens (user_id, token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_token
    ON password_reset_tokens (user_id, token);

CREATE TABLE IF NOT EXISTS categories(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    color VARCHAR(7) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO categories (slug, name, color, description)
VALUES
    ('enhancement', 'Enhancement', '#2563EB', 'A proposal for a new feature or improvement.'),
    ('error', 'Error', '#DC2626', 'A bug report or something that is not working as expected.'),
    ('future_work', 'Future work', '#7C3AED', 'An idea or task to consider for future development.')
ON CONFLICT (slug) DO NOTHING;

CREATE TABLE IF NOT EXISTS issues(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL CHECK (length(btrim(title)) > 0),
    description TEXT NOT NULL CHECK (length(btrim(description)) > 0),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'planned', 'in_progress', 'completed', 'closed')),
    priority SMALLINT NOT NULL DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS issue_comments(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    body TEXT NOT NULL CHECK (length(btrim(body)) > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_issues_status_created_at
    ON issues (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_issues_category_id
    ON issues (category_id);
CREATE INDEX IF NOT EXISTS idx_issues_created_by
    ON issues (created_by);
CREATE INDEX IF NOT EXISTS idx_issue_comments_issue_created_at
    ON issue_comments (issue_id, created_at);

CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_verification_updated_at
BEFORE UPDATE ON verification_tokens
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_issues_updated_at
BEFORE UPDATE ON issues
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();