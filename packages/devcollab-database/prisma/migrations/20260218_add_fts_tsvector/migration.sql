-- Add bare tsvector column to Post (no DEFAULT, no GENERATED)
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "searchVector" tsvector;

-- Add bare tsvector column to Snippet
ALTER TABLE "Snippet" ADD COLUMN IF NOT EXISTS "searchVector" tsvector;

-- Trigger function for Post: title (weight A) + content (weight B)
CREATE OR REPLACE FUNCTION post_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW."searchVector" :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.content, '')), 'B');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Trigger for Post
DROP TRIGGER IF EXISTS post_search_vector_trigger ON "Post";
CREATE TRIGGER post_search_vector_trigger
  BEFORE INSERT OR UPDATE ON "Post"
  FOR EACH ROW EXECUTE FUNCTION post_search_vector_update();

-- Trigger function for Snippet: title (weight A) + code (weight B)
CREATE OR REPLACE FUNCTION snippet_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW."searchVector" :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.code, '')), 'B');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Trigger for Snippet
DROP TRIGGER IF EXISTS snippet_search_vector_trigger ON "Snippet";
CREATE TRIGGER snippet_search_vector_trigger
  BEFORE INSERT OR UPDATE ON "Snippet"
  FOR EACH ROW EXECUTE FUNCTION snippet_search_vector_update();

-- Backfill existing rows (triggers only fire on INSERT/UPDATE, not on historical rows)
UPDATE "Post" SET "searchVector" =
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(content, '')), 'B');

UPDATE "Snippet" SET "searchVector" =
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(code, '')), 'B');

-- GIN indexes (NOT in Prisma schema -- only here in manual migration SQL)
CREATE INDEX IF NOT EXISTS "Post_searchVector_idx" ON "Post" USING GIN ("searchVector");
CREATE INDEX IF NOT EXISTS "Snippet_searchVector_idx" ON "Snippet" USING GIN ("searchVector");
