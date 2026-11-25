#!/usr/bin/env bash
# One-time setup for the Claude API gateway (worker/index.js).
#
#   ./setup-ai.sh <anthropic-key>     or just   ./setup-ai.sh   (asks for the key, keeps it out of shell history)
#
# Safe to run again: every step checks what is already done and skips it.
set -euo pipefail
cd "$(dirname "$0")"

DB_NAME="small-shop-web-ai"
TOKEN_FILE="$HOME/.smallshopweb-admin-token"
wr() { npx --yes wrangler@4 "$@"; }

KEY="${1:-}"
if [ -z "$KEY" ]; then
  read -r -s -p "Paste your Anthropic API key: " KEY; echo
fi
case "$KEY" in
  sk-ant-*) ;;
  *) echo "That doesn't look like an Anthropic key (it should start with sk-ant-)." >&2; exit 1 ;;
esac

command -v node >/dev/null || { echo "Node.js is required: https://nodejs.org" >&2; exit 1; }

echo "1/6 Cloudflare login"
if wr whoami 2>&1 | grep -qi "not authenticated"; then
  wr login
else
  echo "    already logged in"
fi

echo "2/6 Usage database"
db_id() { wr d1 list --json 2>/dev/null | node -e '
  let s=""; process.stdin.on("data",d=>s+=d).on("end",()=>{
    const a=JSON.parse(s.slice(s.indexOf("["))); const d=a.find(x=>x.name===process.argv[1]); if(d) console.log(d.uuid);
  })' "$DB_NAME"; }
ID="$(db_id || true)"
if [ -z "$ID" ]; then
  wr d1 create "$DB_NAME" >/dev/null
  ID="$(db_id)"
  echo "    created ($ID)"
else
  echo "    already exists ($ID)"
fi
[ -n "$ID" ] || { echo "Could not find the database ID." >&2; exit 1; }

echo "3/6 wrangler.jsonc"
node - "$ID" "$DB_NAME" <<'EOF'
const fs = require("fs"), [id, name] = process.argv.slice(2);
let t = fs.readFileSync("wrangler.jsonc", "utf8");
const line = `"d1_databases": [{ "binding": "DB", "database_name": "${name}", "database_id": "${id}" }],`;
if (t.includes(`"database_id": "${id}"`)) { console.log("    already set"); process.exit(0); }
const re = /^(\s*)\/\/\s*"d1_databases":.*$/m;
if (!re.test(t)) { console.error("    wrangler.jsonc has a different d1_databases entry; fix it by hand:\n    " + line); process.exit(1); }
fs.writeFileSync("wrangler.jsonc", t.replace(re, (_, sp) => sp + line));
console.log("    database added");
EOF

echo "4/6 Tables"
wr d1 execute "$DB_NAME" --remote --yes --file worker/schema.sql >/dev/null
echo "    ready"

echo "5/6 Secrets"
printf %s "$KEY" | wr secret put ANTHROPIC_API_KEY >/dev/null
echo "    ANTHROPIC_API_KEY saved"
if wr secret list 2>/dev/null | grep -q '"ADMIN_TOKEN"'; then
  echo "    ADMIN_TOKEN already set (kept)"
else
  ADMIN_TOKEN="$(node -e 'console.log(require("crypto").randomBytes(32).toString("base64url"))')"
  printf %s "$ADMIN_TOKEN" | wr secret put ADMIN_TOKEN >/dev/null
  (umask 077; printf '%s\n' "$ADMIN_TOKEN" > "$TOKEN_FILE")
  echo "    ADMIN_TOKEN created and saved to $TOKEN_FILE"
fi

echo "6/6 Deploy"
wr deploy

if git rev-parse --git-dir >/dev/null 2>&1 && ! git diff --quiet -- wrangler.jsonc; then
  if git commit -q -m "Turn on the AI gateway database" -- wrangler.jsonc 2>/dev/null; then
    echo "Committed the wrangler.jsonc change. Push it so later deploys keep the database: git push"
  else
    echo "wrangler.jsonc changed but wasn't committed. Commit and push it so later deploys keep the database."
  fi
fi

echo
echo "Done. Create a key for a client with:"
echo "  curl -X POST https://smallshopweb.com/api/admin/keys -H \"authorization: Bearer \$(cat $TOKEN_FILE)\" -d '{\"name\":\"Client name\",\"monthly_cap_usd\":20}'"
