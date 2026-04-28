import fs from 'fs';
let sql = fs.readFileSync('schema.sql', 'utf8');

// Replace Tables
sql = sql.replace(/CREATE TABLE "/g, 'CREATE TABLE IF NOT EXISTS "');

// Replace Indexes
sql = sql.replace(/CREATE UNIQUE INDEX "/g, 'CREATE UNIQUE INDEX IF NOT EXISTS "');
sql = sql.replace(/CREATE INDEX "/g, 'CREATE INDEX IF NOT EXISTS "');

// Replace Foreign Keys (ALTER TABLE)
// Matches: ALTER TABLE "TableName" ADD CONSTRAINT "ConstraintName" ...;
sql = sql.replace(/ALTER TABLE "(\w+)" ADD CONSTRAINT "(\w+)" ([^;]+);/g, (match, table, constraint, rest) => {
    return `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '${constraint}') THEN
        ALTER TABLE "${table}" ADD CONSTRAINT "${constraint}" ${rest};
    END IF;
END $$;`;
});

fs.writeFileSync('schema.sql', sql);
console.log('SQL updated with IF NOT EXISTS checks for Foreign Keys.');
