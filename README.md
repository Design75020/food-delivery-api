# Food Delivery API

Une API RESTful prête pour la production pour un système de livraison de nourriture, construite avec Node.js, Express, PostgreSQL et Prisma ORM.

## 🚀 Fonctionnalités

- **Architecture Clean** : Code modulaire, séparé par domaine (auth, restaurants, orders, couriers).
- **Authentification & Autorisation** : JWT avec gestion stricte des rôles (ADMIN, RESTAURANT, CLIENT, COURIER).
- **Validation Robuste** : Validation des requêtes avec Zod (v4) et typage strict TypeScript.
- **Base de données Relationnelle** : Modélisation complète avec PostgreSQL et Prisma ORM.
- **Workflow de Commandes** : Machine à états stricte (PENDING → APPROVED → PREPARING → READY → DELIVERING → DONE) avec historique d'audit.
- **Sécurité** : Rate limiting, Helmet, CORS, et gestion centralisée des erreurs.
- **Tests d'Intégration** : Suite de tests complète validant tous les workflows et règles métier.

## 🛠️ Technologies Utilisées

- **Runtime** : Node.js (v22)
- **Framework** : Express (v5)
- **Langage** : TypeScript
- **Base de données** : PostgreSQL
- **ORM** : Prisma (v5)
- **Validation** : Zod
- **Sécurité** : bcryptjs, jsonwebtoken, helmet, express-rate-limit

## 📦 Installation & Démarrage

### Prérequis
- Node.js (v20+)
- PostgreSQL (v14+)
- pnpm (recommandé) ou npm

### Configuration

1. Cloner le dépôt et installer les dépendances :
```bash
pnpm install
```

2. Configurer les variables d'environnement :
Créer un fichier `.env` à la racine :
```env
PORT=3000
NODE_ENV=development
DATABASE_URL="postgresql://user:password@localhost:5432/food_delivery?schema=public"
JWT_SECRET="votre_secret_jwt_tres_long_et_securise"
JWT_EXPIRES_IN="7d"
```

3. Initialiser la base de données :
```bash
# Exécuter les migrations
pnpm db:migrate

# Générer le client Prisma
pnpm db:generate

# Peupler la base de données avec des données de test
pnpm db:seed
```

### Démarrage

```bash
# Mode développement (avec rechargement à chaud)
pnpm dev

# Mode production
pnpm build
pnpm start
```

## 🔑 Comptes de Test (Seed)

Le script de seed crée les comptes suivants (mot de passe pour tous : `Admin123!`, `Owner123!`, etc.) :

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| **ADMIN** | admin@fooddelivery.com | Admin123! |
| **RESTAURANT** | owner@pizzapalace.com | Owner123! |
| **RESTAURANT** | owner@burgerking.com | Owner123! |
| **CLIENT** | client@example.com | Client123! |
| **COURIER** | courier@example.com | Courier123! |

## 📚 Documentation de l'API

L'API est versionnée sous `/api/v1`.

### Authentification (`/auth`)
- `POST /auth/register` : Créer un nouveau compte
- `POST /auth/login` : Obtenir un token JWT
- `GET /auth/me` : Obtenir le profil de l'utilisateur connecté

### Restaurants (`/restaurants`)
- `GET /restaurants` : Lister les restaurants (Public)
- `GET /restaurants/:id` : Détails d'un restaurant et son menu (Public)
- `POST /restaurants` : Créer un restaurant (Auth: ADMIN, RESTAURANT)
- `PATCH /restaurants/:id` : Modifier un restaurant (Auth: ADMIN, Propriétaire)
- `POST /restaurants/:restaurantId/menu` : Ajouter un plat (Auth: ADMIN, Propriétaire)

### Commandes (`/orders`)
- `POST /orders` : Créer une commande (Auth: CLIENT)
- `GET /orders` : Lister les commandes (filtré selon le rôle)
- `GET /orders/:id` : Détails d'une commande et historique (Auth: Impliqué)
- `PATCH /orders/:id/status` : Mettre à jour le statut (Auth: Selon la transition)

#### Workflow des statuts de commande :
1. `PENDING` : Créée par le client
2. `APPROVED` : Acceptée par le restaurant
3. `PREPARING` : En cours de préparation
4. `READY` : Prête pour la livraison
5. `DELIVERING` : Prise en charge par le livreur (nécessite l'assignation d'un livreur par l'admin)
6. `DONE` : Livrée au client

### Livreurs (`/couriers`)
- `GET /couriers` : Lister les livreurs (Auth: ADMIN)
- `GET /couriers/me` : Profil du livreur connecté (Auth: COURIER)
- `POST /couriers/profile` : Créer son profil livreur (Auth: COURIER)
- `PATCH /couriers/:userId/availability` : Mettre à jour sa disponibilité/position (Auth: COURIER, ADMIN)

## 🧪 Tests

Une suite de tests d'intégration complète est fournie pour valider les workflows et les règles de sécurité.

```bash
# Démarrer le serveur dans un terminal
pnpm dev

# Lancer les tests dans un autre terminal
bash test_api.sh
```

## 🏗️ Architecture

Le projet suit une architecture modulaire (Clean Architecture simplifiée) :

```
src/
├── config/         # Configuration (Prisma, env)
├── middlewares/    # Middlewares Express (Auth, Validation, Erreurs)
├── modules/        # Modules métier (Domaines)
│   ├── auth/       # Authentification
│   ├── couriers/   # Gestion des livreurs
│   ├── orders/     # Système de commandes
│   └── restaurants/# Restaurants et menus
├── routes/         # Routeur principal
├── types/          # Définitions TypeScript globales
├── utils/          # Utilitaires (Erreurs, JWT, Réponses)
├── app.ts          # Configuration Express
└── server.ts       # Point d'entrée
```

Chaque module contient ses propres :
- `*.routes.ts` : Définition des routes
- `*.controller.ts` : Logique HTTP (req/res)
- `*.service.ts` : Logique métier et accès DB
- `*.schema.ts` : Schémas de validation Zod

## 📝 Licence

MIT
