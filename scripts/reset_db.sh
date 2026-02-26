#!/usr/bin/env sh

# ============================================
# 🏠 HOMESERVICE - DB Reset Script (Local)
# Action: DROP (cleanup) puis option ré-init
# ============================================

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1) Chargement des variables
# ----------------------------------------
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)

  # Utilisateur psql (par défaut postgres)
  DB_USER=${DB_USER:-${DB_SUPERUSER:-postgres}}

  # Nom DB (par défaut service_db_dev)
  DB_NAME=${DB_NAME:-service_db_dev}
else
  echo -e "${RED}❌ Error: .env file not found!${NC}"
  exit 1
fi

echo -e "${RED}⚠️  DANGER ZONE: Database Reset${NC}\n"

# 2) Vérifier si la base existe
# ----------------------------------------
DB_EXISTS=$(psql -lqt -U "$DB_USER" | cut -d \| -f 1 | grep -qw "$DB_NAME" && echo "yes" || echo "no")

if [ "$DB_EXISTS" = "no" ]; then
  echo -e "${YELLOW}🤔 Database '$DB_NAME' does not exist.${NC}"
  echo -e "Cannot reset a missing database, but we can initialize it."

  printf "${GREEN}Would you like to run the initialization now? (y/N): ${NC}"
  read -r INSTALL_REPLY

  if echo "$INSTALL_REPLY" | grep -Eq '^(y|Y|o|O)$'; then
    echo -e "\n${GREEN}🚀 Starting init script...${NC}"
    if [ -f "./scripts/init-db.sh" ]; then
      sh ./scripts/init-db.sh
    elif [ -f "./scripts/init_db.sh" ]; then
      sh ./scripts/init_db.sh
    else
      echo -e "${RED}❌ init script not found! Expected ./scripts/init-db.sh (or init_db.sh)${NC}"
    fi
    exit 0
  else
    echo "Operation cancelled."
    exit 0
  fi
fi

# 3) Confirmation
# ----------------------------------------
echo -e "${YELLOW}This will DROP all tables and data from: ${RED}$DB_NAME${NC}"
printf "Are you sure? (type 'RESET' to confirm): "
read -r REPLY

if [ "$REPLY" != "RESET" ]; then
  echo -e "${GREEN}✓ Reset cancelled.${NC}"
  exit 0
fi

# 4) Helpers
# ----------------------------------------
execute_sql() {
  file=$1
  description=$2

  if [ -f "$file" ]; then
    echo -e "${RED}➜${NC} Executing $description"
    # On ignore les erreurs si les objets sont déjà supprimés
    psql -U "$DB_USER" -d "$DB_NAME" -f "$file" -q \
      || echo -e "${BLUE}⚠️  Notice: Some items could not be dropped (already gone?)${NC}"
  else
    echo -e "${YELLOW}⚠️  File not found: $file (Skipping)${NC}"
  fi
}

execute_directory() {
  dir=$1

  if [ -d "$dir" ]; then
    echo -e "${GREEN}📂 Folder: $dir${NC}"
    for file in $(find "$dir" -maxdepth 1 -name "*.sql" | sort); do
      filename=$(basename "$file")
      execute_sql "$file" "$filename"
    done
  else
    echo -e "${RED}❌ Directory $dir not found!${NC}"
  fi
}

# 5) Phase drop
# ----------------------------------------
echo -e "${RED}🗑️  Phase 1: Cleanup${NC}"

# Dossier drop (selon ton arborescence HomeService)
execute_directory "database/migrations/drop"

echo -e "${GREEN}✓ Database cleaned successfully.${NC}\n"

# 6) Ré-init optionnelle
# ----------------------------------------
printf "${YELLOW}Would you like to re-initialize the database now? (y/N): ${NC}"
read -r REINIT

if echo "$REINIT" | grep -Eq '^(y|Y|o|O)$'; then
  echo -e "\n${GREEN}🚀 Re-initializing...${NC}"
  if [ -f "./scripts/init-db.sh" ]; then
    sh ./scripts/init-db.sh
  elif [ -f "./scripts/init_db.sh" ]; then
    sh ./scripts/init_db.sh
  else
    echo -e "${RED}❌ init script not found! Expected ./scripts/init-db.sh (or init_db.sh)${NC}"
  fi
else
  echo -e "${GREEN}Done. The database is now empty.${NC}"
fi