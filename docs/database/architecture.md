# Architecture

memoria/
│
├── .env # Variables d'environnement (NE PAS VERSIONNER)
├── .env.example # Template des variables
├── .gitignore
├── package.json
├── README.md
│
├── database/ # 🗄️ TOUT LE SQL
│ ├── migrations/ # Scripts de création
│ │ ├── 00*create_database.sql
│ │ ├── 01_create_roles.sql
│ │ ├── 02_enable_extensions.sql
│ │ ├── 03_create_types.sql
│ │ ├── 04_create_users_table.sql
│ │ ├── 05_create_items_table.sql
│ │ ├── 06_create_tags_table.sql
│ │ ├── 07_create_item_tags_pivot.sql
│ │ ├── 08_create_shares_table.sql
│ │ ├── 09_create_app_events_table.sql
│ │ └── 99_drop_all.sql
│ │
│ ├── seeders/ # Données de test
│ │ ├── 01_seed_users.sql
│ │ ├── 02_seed_tags.sql
│ │ ├── 03_seed_items.sql
│ │ └── 04_seed_item_tags.sql
│ │
│ └── triggers/ # Fonctions PostgreSQL
│ └── 01_trigger_updated_at.sql
│
├── scripts/ # 🔧 Automatisation
│ ├── init_db.sh # Initialiser toute la DB
│ ├── reset_db.sh # Réinitialiser DB
│ └── seed_db.sh # Peupler avec données test
│
├── docs/ # 📚 Documentation
│ ├── architecture.md
│ ├── api-endpoints.md
│ ├── database-schema.md
│ └── user-stories.md
│
├── public/ # 🎨 Assets statiques
│ ├── css/
│ │ ├── style.css
│ │ ├── auth.css
│ │ └── dashboard.css
│ ├── js/
│ │ └── main.js
│ └── images/
│ └── logo.png
│
└── src/ # 💻 CODE SOURCE
│
├── config/ # ⚙️ Configuration
│ ├── database.js # Connexion PostgreSQL
│ ├── session.js # Config express-session
│ ├── security.js # CSRF, CORS, Rate limiting
│ ├── upload.js # Config Cloudinary/Supabase
│ └── logger.js # Config PINO
│
├── entities/ # 🏗️ Modèles métier (1:1 avec tables SQL)
│ ├── UserEntity.js # Représentation User
│ ├── ItemEntity.js # Représentation Item (Pépite)
│ ├── TagEntity.js # Représentation Tag
│ ├── ItemTagEntity.js # Représentation pivot Item-Tag
│ └── ShareEntity.js # Représentation Share
│
├── dto/ # 📋 Formatage données pour vues
│ ├── UserDTO.js # Vue sécurisée User (sans password)
│ ├── ItemDTO.js # Vue formatée Item
│ ├── TagDTO.js # Vue formatée Tag
│ └── ShareDTO.js # Vue formatée Share
│
├── repositories/ # 💾 Requêtes SQL pures
│ ├── UserRepository.js # CRUD users
│ ├── ItemRepository.js # CRUD items
│ ├── TagRepository.js # CRUD tags
│ ├── ItemTagRepository.js # Relations items-tags
│ ├── ShareRepository.js # CRUD shares
│ └── AppEventRepository.js # Logs événements
│
├── services/ # 🧠 Logique métier
│ ├── AuthService.js # Inscription, Connexion, Token
│ ├── UserService.js # Gestion compte utilisateur
│ ├── ItemService.js # Logique métier pépites
│ ├── TagService.js # Logique métier tags
│ ├── ShareService.js # Logique métier partages
│ └── AppEventService.js # Logs événements app
│
├── controllers/ # 🎮 Gestion req/res HTTP
│ ├── AuthController.js # Inscription/Connexion
│ ├── ItemController.js # CRUD Pépites
│ ├── TagController.js # CRUD Tags
│ ├── ShareController.js # Gestion partages
│ ├── SearchController.js # Recherche/Filtres
│ └── ProfileController.js # Gestion profil utilisateur
│
├── middlewares/ # 🛡️ Protections et helpers
│ ├── authMiddleware.js # requireAuth, requireGuest
│ ├── flashMiddleware.js # Flash messages natifs
│ ├── validationMiddleware.js # Gestion erreurs validation
│ ├── ownershipMiddleware.js # Vérif propriété ressources
│ └── errorMiddleware.js # Gestion erreurs globales
│
├── routes/ # 🛤️ Définition des routes
│ ├── authRoutes.js # /auth/*
│ ├── itemRoutes.js # /items/_
│ ├── tagRoutes.js # /tags/_
│ ├── shareRoutes.js # /shares/\_
│ ├── dashboardRoutes.js # /dashboard
│ └── index.js # Point d'entrée routes
│
├── utils/ # 🔧 Fonctions utilitaires
│ ├── passwordHelper.js # Hash/verify Argon2
│ ├── slugHelper.js # Génération slugs SEO
│ ├── uploadHelper.js # Upload images externes
│ ├── dateHelper.js # Formatage dates
│ └── logHelper.js # Logger événements app
│
├── validators/ # ✅ Validation données entrantes
│ ├── userValidator.js # Règles validation User
│ ├── itemValidator.js # Règles validation Item
│ ├── tagValidator.js # Règles validation Tag
│ └── shareValidator.js # Règles validation Share
│
├── views/ # 🎨 Templates EJS
│ │
│ ├── layouts/ # Layouts
│ │ ├── main.ejs # Layout principal
│ │ └── dashboard.ejs # Layout dashboard
│ │
│ ├── partials/ # Composants réutilisables
│ │ ├── header.ejs
│ │ ├── footer.ejs
│ │ ├── flash.ejs # Affichage messages flash
│ │ └── navbar.ejs
│ │
│ ├── auth/ # Pages authentification
│ │ ├── register.ejs # Inscription
│ │ ├── login.ejs # Connexion
│ │ ├── profile.ejs # Profil utilisateur
│ │ └── delete-account.ejs # Suppression compte
│ │
│ ├── items/ # Pages pépites
│ │ ├── index.ejs # Liste toutes pépites
│ │ ├── new.ejs # Créer pépite
│ │ ├── edit.ejs # Modifier pépite
│ │ └── show.ejs # Détail pépite
│ │
│ ├── tags/ # Pages tags
│ │ ├── list.ejs # Liste tags
│ │ └── manage.ejs # Gérer tags
│ │
│ ├── shares/ # Pages partages
│ │ ├── index.ejs # Mes partages
│ │ └── new.ejs # Partager une pépite
│ │
│ ├── dashboard/ # Pages dashboard
│ │ ├── home.ejs # Tableau de bord
│ │ └── stats.ejs # Statistiques
│ │
│ └── errors/ # Pages erreurs
│ ├── 404.ejs
│ └── 500.ejs
│
└── app.js # 🚀 Point d'entrée application

# Flux de données complet

PostgreSQL (Table users)
↓
UserRepository.findById() → renvoie UserEntity
↓
UserService.getUserProfile() → applique logique métier
↓
UserController.getProfile() → convertit en UserDTO
↓
Vue EJS → reçoit uniquement { id, email, pseudo, role }

homeservice/
│
├── .env
├── .env.example
├── .gitignore
├── package.json
├── README.md
│
├── database/
│ ├── tables/
│ │ ├── 00_add_extensions_and_helpers.sql
│ │ ├── 01_add_users_table.sql
│ │ ├── 02_add_categories_table.sql
│ │ ├── 03_add_services_table.sql
│ │ ├── 04_add_bookings_table.sql
│ │ ├── 05_add_payments_table.sql
│ │ ├── 06_add_reviews_table.sql
│ │ └── 07_users_categories_table_pivot.sql
│ │
│ ├── seeders/
│ │ ├── 01_seed_users.sql
│ │ ├── 02_seed_categories.sql
│ │ ├── 03_seed_services.sql
│ │ ├── 04_seed_bookings.sql
│ │ ├── 05_seed_payments.sql
│ │ └── 06_seed_reviews.sql
│ │
│ ├── queries/
│ │ ├── 01_get_recent_users.sql
│ │ ├── 02_find_services_by_keyword.sql
│ │ ├── 03_get_services_by_category.sql
│ │ ├── 04_check_provider_availability.sql
│ │ ├── 05_get_client_bookings.sql
│ │ ├── 06_get_provider_bookings.sql
│ │ ├── 07_user_stats_count.sql
│ │ ├── 08_provider_stats.sql
│ │ ├── 09_unpaid_payments.sql
│ │ └── 10_revenue_by_month.sql
│ │
│ ├── triggers/
│ │ └── 01_trigger_updated_at.sql
│ │
│ └── views/
│ ├── 01_v_services_full.sql
│ ├── 02_v_bookings_full.sql
│ ├── 03_v_payments_full.sql
│ └── 04_v_provider_stats.sql
│
├── scripts/
│ ├── init_db.sh
│ ├── reset_db.sh
│ └── seed_db.sh
│
├── public/
│ ├── css/
│ │ └── style.css
│ ├── js/
│ │ └── main.js
│ ├── images/
│ │ └── logo.png
│ └── uploads/
│ └── .gitkeep
│
└── src/
├── app.js
│
├── config/
│ ├── database.js
│ ├── logger.js
│ ├── security.js
│ ├── session.js
│ └── upload.js
│
├── controllers/
│ ├── AuthController.js
│ ├── HomeController.js
│ ├── UserController.js
│ ├── CategoryController.js
│ ├── ServiceController.js
│ ├── BookingController.js
│ ├── PaymentController.js
│ └── ReviewController.js
│
├── routes/
│ ├── index.js
│ ├── authRoutes.js
│ ├── homeRoutes.js
│ ├── userRoutes.js
│ ├── categoryRoutes.js
│ ├── serviceRoutes.js
│ ├── bookingRoutes.js
│ ├── paymentRoutes.js
│ └── reviewRoutes.js
│
├── middlewares/
│ ├── authMiddleware.js
│ ├── flashMiddleware.js
│ ├── validationMiddleware.js
│ └── errorMiddleware.js
│
├── repositories/
│ ├── UserRepository.js
│ ├── CategoryRepository.js
│ ├── ServiceRepository.js
│ ├── BookingRepository.js
│ ├── PaymentRepository.js
│ └── ReviewRepository.js
│
├── services/
│ ├── AuthService.js
│ ├── UserService.js
│ ├── CategoryService.js
│ ├── ServiceService.js
│ ├── BookingService.js
│ ├── PaymentService.js
│ └── ReviewService.js
│
├── dto/
│ ├── UserDTO.js
│ ├── ServiceDTO.js
│ ├── BookingDTO.js
│ ├── PaymentDTO.js
│ └── ReviewDTO.js
│
├── validators/
│ ├── authValidator.js
│ ├── serviceValidator.js
│ ├── bookingValidator.js
│ ├── paymentValidator.js
│ └── reviewValidator.js
│
├── utils/
│ ├── passwordHelper.js
│ ├── dateHelper.js
│ └── slugHelper.js
│
└── views/
├── layouts/
│ └── main.ejs
├── partials/
│ ├── header.ejs
│ ├── navbar.ejs
│ ├── flash.ejs
│ └── footer.ejs
├── pages/
│ ├── home.ejs
│ ├── auth/
│ │ ├── login.ejs
│ │ └── register.ejs
│ ├── services/
│ │ ├── index.ejs
│ │ ├── show.ejs
│ │ ├── new.ejs
│ │ └── edit.ejs
│ ├── bookings/
│ │ ├── index.ejs
│ │ ├── show.ejs
│ │ └── new.ejs
│ ├── catégories/
│ │ ├── index.ejs
│ │ ├── new.ejs
│ │ └── edit.ejs
│ ├── payments/
│ │ ├── index.ejs
│ │ └── new.ejs
│ ├── reviews/
│ │ ├── index.ejs
│ │ └── new.ejs
│ └── errors/
│ ├── 403.ejs
│ ├── 404.ejs
│ └── 500.ejs
