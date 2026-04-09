#!/usr/bin/env sh

# ============================================
# 🏠 HOMESERVICE - DB Initialization Script
# ============================================

set -e

# --------------------------------------------
# Colors
# --------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}🏠 HomeService - Database Initialization${NC}\n"

# --------------------------------------------
# Load environment variables
# --------------------------------------------
if [ ! -f .env ]; then
  echo -e "${RED}❌ Error: .env file not found!${NC}"
  exit 1
fi

# charge les variables de .env (ignore les commentaires)
export $(grep -v '^#' .env | xargs)

# --------------------------------------------
# Defaults (override via .env)
# --------------------------------------------
DB_SUPERUSER=${DB_SUPERUSER:-postgres}
DB_APP_USER=${DB_APP_USER:-app_service}
DB_NAME=${DB_NAME:-service_db_dev}

# --------------------------------------------
# Helpers
# --------------------------------------------
execute_sql() {
  file=$1
  description=$2
  db=$3
  user=$4

  echo -e "${YELLOW}➜${NC} $description"
  psql -v ON_ERROR_STOP=1 -U "$user" -d "$db" -f "$file"
}

execute_directory() {
  dir=$1
  db=$2
  user=$3

  [ ! -d "$dir" ] && return

  echo -e "${GREEN}📂 Folder: $dir${NC}"
  for file in $(find "$dir" -maxdepth 1 -name "*.sql" | sort); do
    # Les helpers/extensions/types sont deja executes dans les phases precedentes.
    # Les migrations 09/10 sont conservees pour les mises a jour incrementales
    # d'anciennes bases, mais ne doivent pas etre rejouees sur une base neuve
    # car 04_add_bookings_table.sql et 05_add_payments_table.sql incluent deja
    # ces colonnes.
    if [ "$dir" = "database/migrations/tables" ]; then
      case "$(basename "$file")" in
        00_add_extensions_and_helpers.sql|09_add_booking_contact_fields.sql|10_add_payment_method.sql)
          continue
          ;;
      esac
    fi
    execute_sql "$file" "Executing $(basename "$file")" "$db" "$user"
  done
}

# ============================================
# Phase 0 — Database creation (SUPERUSER)
# ============================================
echo -e "${GREEN}📦 Phase 0: Database Check${NC}"

psql -U "$DB_SUPERUSER" -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME" || \
createdb -U "$DB_SUPERUSER" "$DB_NAME"

# ============================================
# Phase 1 — Roles & Core config (SUPERUSER)
# ============================================
echo -e "\n${GREEN}⚙️ Phase 1: Core Configuration${NC}"

# 01 - rôle applicatif (optionnel si tu l'utilises)
execute_sql "database/migrations/config/01_add_roles_app.sql" \
            "Creating application role (HomeService)" \
            "postgres" \
            "$DB_SUPERUSER"

# extensions (uuid, pgcrypto, etc.)
execute_sql "database/migrations/config/03_add_extensions.sql" \
            "Installing extensions" \
            "$DB_NAME" \
            "$DB_SUPERUSER"

# types custom (ENUM status booking, role, etc.)
execute_sql "database/migrations/config/04_add_types.sql" \
            "Creating custom types" \
            "$DB_NAME" \
            "$DB_SUPERUSER"

# ============================================
# Phase 2 — Triggers (SUPERUSER)
# ============================================
echo -e "\n${GREEN}🛠️ Phase 2: Triggers${NC}"
execute_directory "database/triggers" "$DB_NAME" "$DB_SUPERUSER"

# ============================================
# Phase 3 — Tables (SUPERUSER)
# ============================================
echo -e "\n${GREEN}🗄️ Phase 3: Tables${NC}"
execute_directory "database/migrations/tables" "$DB_NAME" "$DB_SUPERUSER"

# ============================================
# Phase 4 — Permissions (SUPERUSER)
# ============================================
echo -e "\n${GREEN}🔐 Phase 4: Permissions${NC}"
execute_sql "database/migrations/config/02_add_permissions_roles_app.sql" \
            "Granting permissions (HomeService)" \
            "$DB_NAME" \
            "$DB_SUPERUSER"

# ============================================
# Phase 5 — Seeds
# ============================================
echo -e "\n${GREEN}🌱 Phase 5: Seed Data${NC}"
printf "Insert seed data? (y/N) : "
read -r reply
if echo "$reply" | grep -Eq '^(y|Y|o|O)$'; then
  execute_directory "database/seeders" "$DB_NAME" "$DB_SUPERUSER"
fi

# ============================================
# Phase 6 — Views
# ============================================
echo -e "\n${GREEN}📊 Phase 6: Views${NC}"
execute_directory "database/views" "$DB_NAME" "$DB_SUPERUSER"

echo -e "\n${GREEN}✅ HomeService database is ready!${NC}"
