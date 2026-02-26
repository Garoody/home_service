#!/usr/bin/env sh

# ============================================
# 🏠 HOMESERVICE - SQL Runner Utility
# ============================================
# Usage: ./scripts/run-sql.sh <path_to_file> [db_name] [db_user]

#  Le script run sert à exécuter un seul fichier SQL manuellement,
# sans lancer toute l’initialisation de la base.
# ============================================

set -e

# Message colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1) Chargement des variables (.env)
# ---------------------------------------------
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)

  # Valeurs par défaut HomeService
  DEFAULT_DB_USER=${DB_APP_USER:-app_service}
  DEFAULT_DB_NAME=${DB_NAME:-service_db_dev}
else
  echo -e "${RED}❌ Error: .env file not found!${NC}"
  exit 1
fi

# 2) Gestion des arguments dynamiques
# ---------------------------------------------
FILE_PATH=$1
TARGET_DB=${2:-$DEFAULT_DB_NAME}
TARGET_USER=${3:-$DEFAULT_DB_USER}

# 3) Validation
# ---------------------------------------------
if [ -z "$FILE_PATH" ]; then
  echo -e "${YELLOW}Usage:${NC}"
  echo -e " npm run db:run <file.sql> [db_name] [db_user]"
  echo -e "\n${BLUE}Examples:${NC}"
  echo -e " Standard : npm run db:run database/migrations/tables/01_users.sql"
  echo -e " System   : npm run db:run database/migrations/config/01_add_roles_app.sql postgres postgres"
  exit 1
fi

if [ ! -f "$FILE_PATH" ]; then
  echo -e "${RED}❌ File not found: $FILE_PATH${NC}"
  exit 1
fi

# 4) Exécution
# ---------------------------------------------
echo -e "${GREEN}🏠 HOMESERVICE - SQL Runner${NC}"
echo -e "📁 File:   ${YELLOW}$FILE_PATH${NC}"
echo -e "🗄️  Target: ${BLUE}$TARGET_DB${NC} (as $TARGET_USER)"
echo ""

# -v ON_ERROR_STOP=1 : stop immédiatement si erreur SQL
# -q : mode silencieux (affiche surtout erreurs)
psql -v ON_ERROR_STOP=1 -U "$TARGET_USER" -d "$TARGET_DB" -f "$FILE_PATH"

if [ $? -eq 0 ]; then
  echo -e "\n${GREEN}✅ Success! SQL script executed successfully.${NC}"
else
  echo -e "${RED}❌ Error during execution.${NC}"
  exit 1
fi