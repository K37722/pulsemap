# Quick Fix: Merge Divergent Branches

You made local changes (adding --turbopack flags) before pulling the latest updates. Here's how to merge:

## Option 1: Merge (Recommended - Keeps Your Changes)

```bash
# Configure git to merge
git config pull.rebase false

# Pull and merge
git pull origin claude/oslo-incident-map-011CUfMy7JkSagM7m7EQYeb8

# If there are conflicts, git will tell you which files
# The conflicts will likely be in:
# - package.json (scripts section)
# - postcss.config.js

# To see conflicts:
git status
```

## Option 2: Just Use the Remote Version (Easiest)

If you want to discard your local changes and use the remote version:

```bash
# Reset to remote version
git fetch origin
git reset --hard origin/claude/oslo-incident-map-011CUfMy7JkSagM7m7EQYeb8

# Then reinstall dependencies
npm install
```

## Option 3: Rebase (Advanced)

```bash
git config pull.rebase true
git pull origin claude/oslo-incident-map-011CUfMy7JkSagM7m7EQYeb8
```

---

## Recommended: Option 2 (Reset to Remote)

Since the remote already has all your changes (I included the --turbopack flags), the easiest is:

```bash
git reset --hard origin/claude/oslo-incident-map-011CUfMy7JkSagM7m7EQYeb8
npm install
```

This will give you the latest code with all fixes applied.

---

## After Merging/Resetting

1. **Reinstall dependencies:**
   ```bash
   npm install
   ```

2. **Fix PostGIS (if needed):**
   ```bash
   brew install postgis
   psql pulsemap -c "CREATE EXTENSION postgis;"
   ```

3. **Start the app:**
   ```bash
   npm run dev
   ```

---

## What's in the Remote (Already Includes Your Changes!)

The remote branch already has:
- ✅ `@tailwindcss/postcss` package
- ✅ `--turbopack` flags in scripts
- ✅ Updated `postcss.config.js`
- ✅ PostgreSQL 14/15 compatibility
- ✅ Comprehensive troubleshooting guide

So you can safely reset to the remote version!
