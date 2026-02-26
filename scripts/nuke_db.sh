#!/usr/bin/env sh

# ============================================
# 🏠 HOMESERVICE - FULL NUKE SCRIPT
# Action: Supprime entièrement la base ET le rôle applicatif
# ============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1) Chargement des variables (.env)
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)

  # Superuser (par défaut postgres)
  DB_SUPERUSER=${DB_SUPERUSER:-postgres}

  # Nom DB (par défaut homeservice_db_dev)
  DB_NAME=${DB_NAME:-service_db_dev}

  # Rôle applicatif (par défaut app_homeservice)
  APP_ROLE=${DB_APP_USER:-app_service}
else
  echo -e "${RED}❌ .env file missing!${NC}"
  exit 1
fi

echo -e "${RED}☢️  NUCLEAR OPTION: FULL SYSTEM WIPE${NC}\n"
echo -e "${YELLOW}This will delete:${NC}"
echo -e "- Database: ${RED}$DB_NAME${NC}"
echo -e "- Role:     ${RED}$APP_ROLE${NC}"
echo -e "\n${RED}EVERYTHING WILL BE LOST!${NC}"
printf "Type 'NUKE' to confirm execution: "
read -r REPLY

if [ "$REPLY" != "NUKE" ]; then
  echo -e "${GREEN}✓ Operation aborted. Safety first!${NC}"
  exit 0
fi

echo -e "\n${RED}🚀 Commencing Countdown...${NC}"

# 2) Suppression de la base de données
# (FORCE) déconnecte les sessions actives (Postgres 13+)
echo -e "${YELLOW}➜ Dropping database $DB_NAME...${NC}"
psql -v ON_ERROR_STOP=1 -U "$DB_SUPERUSER" -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME (FORCE);"

# 3) Nettoyage + suppression du rôle applicatif
echo -e "${YELLOW}➜ Cleaning up dependencies for role $APP_ROLE...${NC}"
psql -v ON_ERROR_STOP=1 -U "$DB_SUPERUSER" -d postgres -c "DROP OWNED BY $APP_ROLE;" \
  || echo -e "${YELLOW}⚠️ Notice: No owned objects found to drop (or role missing).${NC}"

echo -e "${YELLOW}➜ Dropping role $APP_ROLE...${NC}"
psql -v ON_ERROR_STOP=1 -U "$DB_SUPERUSER" -d postgres -c "DROP ROLE IF EXISTS $APP_ROLE;"

echo -e "${GREEN}✨ Total destruction complete. System is clean.${NC}\n"

# 4) Proposition de rebuild
printf "${YELLOW}Would you like to rebuild everything from scratch? (y/N): ${NC}"
read -r REBUILD

# Compatible sh (pas de [[ ]])
if echo "$REBUILD" | grep -Eq '^(y|Y|o|O)$'; then
  if [ -f "./scripts/init-db.sh" ]; then
    sh ./scripts/init-db.sh
  elif [ -f "./scripts/init_db.sh" ]; then
    sh ./scripts/init_db.sh
  else
    echo -e "${RED}❌ init script not found! Expected ./scripts/init-db.sh (or init_db.sh)${NC}"
  fi
else
  echo -e "System left empty."
fi