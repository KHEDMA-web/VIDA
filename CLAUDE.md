# CLAUDE.md — VIDA (Ma Superapp Personnelle)

## Vue d'ensemble

Superapp personnelle de suivi de vie ("life OS") en **Next.js 15 (App Router) +
TypeScript + Prisma + Supabase Auth**, regroupant **14 domaines de vie** dans
une architecture "hub + mini-apps" : un dashboard central (`/`) avec une
vision globale, et une mini-app dédiée par domaine (`/sport`, `/nutrition`,
`/fin`, …). Les données sont persistées dans Postgres via Prisma, une ligne
par utilisateur et par domaine ; l'authentification est **1 compte Supabase
Auth = 1 utilisateur** (email + mot de passe).

**Utilisateur cible** : usage personnel quotidien sur mobile (saisie rapide
matin/soir) + bilan hebdomadaire. Langue : français. Localisation : Algérie
(devise DA par défaut, horaires de prière méthode du Ministère algérien).

> Historique : le projet a démarré comme un artifact React à fichier unique
> (`ma-superapp.jsx`, toujours présent à la racine pour référence/archive,
> **plus utilisé par l'app**) persistant via `window.storage`. Il a été
> réécrit en vraie app Next.js/Prisma/Supabase pour avoir un vrai compte,
> une vraie base de données et un déploiement web. Ne pas repartir du fichier
> unique — toute la logique vit maintenant dans `app/`, `components/`, `lib/`.

## Les 14 domaines

| ID | Label | Couleur | Contenu |
|---|---|---|---|
| `fin` | Finances | `#E9B950` or | Transactions (dépense/revenu, catégorie), budget mensuel, dépenses par catégorie, comparaison au mois dernier |
| `sport` | Sport | `#FF7A6B` corail | Séances (type, durée), objectif hebdo, poids (courbe + **objectif + projection de tendance**), **charges par exercice** ("mes charges") |
| `nutrition` | Nutrition | `#A9E34B` citron vert | Repas (kcal/protéines), **cibles caloriques calculées** (Mifflin-St Jeor, à partir du profil et de la dernière pesée), bilan 7 jours, **liste de courses** par catégorie avec reset hebdo |
| `hab` | Habitudes | `#4FD1C5` teal | Habitudes cochables, séries (streaks) 🔥 + **record de série**, grille 7 jours corrigeable |
| `goal` | Objectifs | `#7FA3FF` bleu | Objectifs avec progression % (+/-5), sessions d'apprentissage en minutes, **répartition par sujet** |
| `book` | Livres | `#C792EA` violet | Livres avec progression page par page, journal de pages lues, **rythme de lecture + date de fin estimée**, terminés |
| `dep` | Sans (Dépendances) | `#F06595` rose | Compteur de **jours sans** + **record de série**, conso du jour +/-, économies estimées, barres 7 jours |
| `maison` | Maison | `#FFA94D` orange | Tâches récurrentes (fréquence en jours), tri par urgence, "En retard de X j", **historique récent** |
| `rel` | Liens (Relations) | `#69DB7C` vert | Proches avec rythme de contact, tri par personnes à recontacter, **historique récent** |
| `priere` | Prière | `#63E6BE` menthe | 5 prières cochables + **horaires exacts calculés localement**, série de jours complets |
| `vehicule` | Véhicule | `#4DABF7` bleu ciel | Entretiens récurrents (vidange, assurance…), alerte à J-14, **historique récent** |
| `sommeil` | Sommeil | `#9775FA` violet foncé | Heures + qualité (1-5), objectif réglable, barres 7 nuits, **qualité moyenne + meilleure/pire nuit** |
| `todo` | To-do | `#CED4DA` argent | Tâches avec étoile ⭐ importante, terminées restaurables, **compteur 7 jours** |
| — | Réglages | — | Prénom, devise, domaines actifs, **profil physique (taille/âge/sexe/activité/objectif nutrition)**, ville de prière, méthode de calcul, reset |

## Architecture du code

```
app/
├── (app)/                 route group authentifiée — layout + une page par domaine (ex: app/(app)/nutrition/page.tsx)
│   └── page.tsx            dashboard (Home)
├── api/                    routes API REST par domaine (ex: app/api/nutrition/meals/route.ts)
├── auth/actions.ts         server actions Supabase (signOut, etc.)
├── sign-in/, sign-up/      pages d'auth
└── layout.tsx, globals.css

components/
├── domains/                 un composant *View par domaine (ex: Nutrition.tsx, Sport.tsx…), "use client"
├── Home.tsx, Boussole.tsx, Shell.tsx, ui.tsx (Card/Section/Btn/Input/Select/Empty/MiniHeader)

lib/
├── theme.ts                 thème T + DOMAINS (id/label/couleur/icône) + ALL_IDS
├── dashboard.ts              getDashboardData() : agrège tout pour Home (fractions boussole + bilan 7j)
├── dates.ts                  today/lastNDays/monthKey/previousMonthKey/daysSince (dates locales YYYY-MM-DD)
├── currency.ts                devise dynamique (curSym/formatAmount/CURRENCIES)
├── nutrition.ts               cibles caloriques/protéines (Mifflin-St Jeor), ACTIVITY_LEVELS, NUTRITION_GOALS
├── projection.ts              régression linéaire sur les pesées → tendance + estimation date objectif
├── prayer-times.ts            calcul astronomique local des horaires de prière (CITIES, METHOD_ANGLES)
├── prisma.ts, user.ts (requireUserId/getOrCreateSettings), api.ts (withAuth), api-client.ts (fetch wrapper)
└── supabase/                  client.ts / server.ts / middleware.ts (Supabase Auth SSR)

prisma/
├── schema.prisma              1 modèle par domaine + Settings (réglages/profil), toutes les dates métier en String "YYYY-MM-DD"
└── migrations/                 migrations SQL versionnées, appliquées avec `prisma migrate deploy`/`dev`
```

### Convention pour un composant de domaine

- `app/(app)/<id>/page.tsx` (server component) : `requireUserId()`, fetch Prisma, passe les props à `<XxxView>`.
- `components/domains/Xxx.tsx` (`"use client"`) : état local des formulaires, `apiFetch` vers `app/api/<domaine>/...`, puis `router.refresh()` pour re-fetch les server components (pas de state global côté client — la source de vérité reste la base).
- `app/api/<domaine>/.../route.ts` : `withAuth((userId) => prisma...)` (voir `lib/api.ts`), jamais de logique métier dupliquée côté client au-delà de la validation de saisie.

### Persistance des données

- Une table par domaine + `Settings` (1 ligne par utilisateur, réglages + profil physique).
- Toutes les dates métier (pas les timestamps techniques) sont des `String "YYYY-MM-DD"` **locales**, jamais des `DateTime` UTC — évite les décalages de fuseau. Les timestamps techniques (`createdAt` sur `User`, `updatedAt` sur `Settings`) restent en `DateTime`.
- `getOrCreateSettings(userId)` (`lib/user.ts`) fait l'upsert `User` + `Settings` au premier accès (défauts dans `Settings.activeDomains` = `ALL_IDS`).
- `/api/reset` supprime en transaction toutes les tables de l'utilisateur et réinitialise `Settings` — **à tenir à jour** à chaque nouveau modèle (sinon les données du nouveau domaine survivent à un reset).

### Ajouter un nouveau domaine — check-list

1. `prisma/schema.prisma` : nouveau(x) modèle(s) + relation sur `User` + migration SQL dans `prisma/migrations/` (pas de DB de dev connectée dans cet environnement : écrire le SQL à la main en suivant le style des migrations existantes, puis `npx prisma generate` pour valider/régénérer le client).
2. `lib/theme.ts` : ajouter l'id à `DomainId`, une couleur à `T`, une entrée à `DOMAINS` (déduit `ALL_IDS` automatiquement).
3. `app/api/<domaine>/...` : routes REST avec `withAuth`.
4. `app/(app)/<domaine>/page.tsx` + `components/domains/Xxx.tsx`.
5. `lib/dashboard.ts` : fraction boussole (`fractions`) + ligne de bilan 7 jours (`bilan`), toutes deux filtrées par `active`.
6. `components/Home.tsx` : ajouter au besoin un raccourci dans `QUICK_ACCESS`.
7. Si le domaine a des réglages numériques/texte, les ajouter à `Settings` (schema) + `EDITABLE_FIELDS` (`app/api/settings/route.ts`) + `/api/reset`.
8. Domaines actifs : `Settings.activeDomains` a une valeur par défaut en base (tous actifs) — un nouveau domaine n'apparaît automatiquement que pour les **nouveaux** comptes ; il n'y a pas (encore) de mécanisme pour l'activer rétroactivement chez les comptes existants (pas de champ de version sur `Settings`). À réévaluer si ça devient un vrai produit avec des utilisateurs existants.

## La boussole (élément signature)

Anneau SVG segmenté sur le dashboard (`components/Boussole.tsx`) : **un
segment par domaine actif**, qui se remplit selon l'activité du jour. Le
centre affiche le pourcentage global. Règles de remplissage (`lib/dashboard.ts`) :

- `fin`, `sport`, `nutrition`, `goal`, `book` : binaire — au moins une entrée aujourd'hui = segment plein.
- `hab` : proportion d'habitudes cochées. `priere` : prières faites / 5.
- `dep` : proportion de suivis restés à zéro aujourd'hui.
- `maison`, `vehicule`, `rel` : proportion d'éléments "à jour" (pas en retard).
- `sommeil` : heures dormies / objectif (plafonné à 1). `todo` : faites aujourd'hui / (faites + en attente).

Le nombre de segments s'adapte dynamiquement aux domaines activés dans Réglages.

## Nutrition — cibles caloriques (décision technique)

`lib/nutrition.ts` calcule les cibles **localement**, sans aucun appel
externe : formule de Mifflin-St Jeor (BMR) × facteur d'activité (5 niveaux,
1.2 à 1.9) → TDEE, puis ajustement selon l'objectif (perte -350 kcal, maintien
0, prise +300 kcal) et protéines en g/kg de poids de corps (2.0/1.8/1.9 selon
l'objectif). Le poids utilisé est **la dernière pesée notée dans Sport**
(pas de champ dupliqué) — d'où le couplage volontaire entre les deux
domaines. Si taille/âge/sexe ne sont pas renseignés dans Réglages, ou qu'aucune
pesée n'existe, `computeNutritionTargets` renvoie `null` et l'UI invite à
compléter le profil plutôt que d'inventer une valeur par défaut.

## Sport — projection de poids (décision technique)

`lib/projection.ts` fait une régression linéaire simple sur les 8 dernières
pesées pour estimer un rythme (kg/mois) et, si un objectif de poids est
renseigné, une date d'atteinte approximative. Pas de dépendance de charting
(pas de recharts) : la courbe reste un `<svg><path>` fait main comme
l'existant, avec un segment supplémentaire en pointillés pour la projection —
cohérent avec le choix de style du design system (voir plus bas).

## Horaires de prière (décision technique)

Calcul astronomique **local** (algorithme de référence praytimes.org) —
position solaire, déclinaison, équation du temps, angles crépusculaires,
implémenté dans `lib/prayer-times.ts`. Ce choix date de la version artifact
(CSP bloquant les appels réseau externes) ; il a été conservé tel quel dans
la réécriture Next.js pour ses vrais avantages produit — hors ligne, instantané,
zéro dépendance externe, résultat validé à ±1 min de l'API AlAdhan pour Alger
— pas parce que la contrainte technique d'origine s'applique encore ici.

- `CITIES` : les 48 chefs-lieux de wilaya algériens + villes de la diaspora (Paris, Marseille, Lyon, Lille, Bruxelles, Montréal, Londres) avec coordonnées, + option coordonnées manuelles.
- `METHOD_ANGLES` : Algérie 19 (18°/17°, défaut), MWL, Égypte, Umm Al-Qura (Isha = Maghrib + 90 min), Maroc, ISNA, France UOIF.
- Fuseau horaire : celui de l'appareil, hypothèse valide pour un usage personnel.
- La **prochaine prière** est mise en avant (halo) sur le dashboard et dans la mini-app.

## Design system

- **Thème sombre** : fond `#12151F` (encre nuit), surfaces `#1B2030` / `#242A3E`, texte `#EEF0F8`, muted `#8A90A8`.
- **Typographies** : Space Grotesk (titres, chiffres) + Inter (corps).
- **Styles inline** (pas de Tailwind) pour un contrôle total des couleurs par domaine — voir `components/ui.tsx` pour les primitives partagées (`Card`, `Section`, `Btn`, `Input`, `Select`, `Empty`, `MiniHeader`).
- Mobile-first : conteneur max 480px, barre de navigation fixe en bas **défilante horizontalement** (14+ onglets), safe-area iOS gérée.
- Icônes : lucide-react. Chaque domaine a sa couleur d'accent, utilisée partout (nav, boussole, boutons, stats).
- Pas de dépendance de charting lourde (pas de recharts) : tous les graphes sont des `<svg>` faits main, cohérent avec le budget de style inline. À reconsidérer seulement si un futur graphe devient trop complexe pour rester lisible en SVG manuel.

## Dashboard (Home) — ordre des sections

1. En-tête : salutation personnalisée ("Salut {prénom} 👋") + date + bouton ⚙️ Réglages
2. Boussole + légende des domaines actifs
3. Prières du jour (cochables, avec heures exactes, prochaine prière en surbrillance)
4. À faire (4 tâches to-do prioritaires, cochables)
5. Habitudes du jour (cochables)
6. Accès rapide (raccourcis vers les mini-apps, `QUICK_ACCESS` dans `Home.tsx`)
7. Bilan des 7 derniers jours (une ligne par domaine actif)

Toutes les sections respectent le filtre des domaines actifs (`Settings.activeDomains`).

## Historique des évolutions

1. **v1 (artifact)** : 5 domaines (Finances, Sport, Habitudes, Objectifs, Livres) + boussole + bilan 7 jours, persistance `window.storage`.
2. **+3 domaines (artifact)** : Dépendances, Maison, Relations. Boussole dynamique, nav défilante.
3. **Réglages + poids (artifact)** : prénom, devise dynamique, toggles de domaines, reset, suivi du poids dans Sport.
4. **Devise DA (artifact)** : ajout du Dinar algérien.
5. **+3 domaines (artifact)** : Prière, Véhicule, Sommeil.
6. **Horaires de prière (artifact)** : API AlAdhan (bloquée par la CSP des artifacts) → calcul astronomique local.
7. **To-do (artifact)** : tâches importantes ⭐, section dashboard, restauration.
8. **Réécriture Next.js/Prisma/Supabase** : passage de l'artifact fichier unique à une vraie app web avec compte utilisateur, base Postgres, déploiement web (voir historique git : "Rebuild VIDA as a real Next.js/Prisma/Supabase app").
9. **Nutrition & Courses (14e domaine) + Sport enrichi** : nouveau domaine Nutrition (repas, cibles Mifflin-St Jeor, liste de courses par catégorie avec reset hebdo) ; Sport gagne le suivi de charges par exercice et la projection de tendance de poids vers un objectif ; petits enrichissements sur tous les autres domaines (comparaisons, records de série, historiques, rythmes) pour rapprocher chaque domaine du niveau de détail de Nutrition/Sport.

## Pistes d'évolution évoquées (non implémentées)

- Grille d'apps sur le dashboard / refonte de la navigation.
- Domaines : Humeur, Films & séries, Journal de bord, Gratitude, Carrière.
- Export des données en fichier ; bilan mensuel ; migration de `Settings.activeDomains` pour les comptes existants quand un nouveau domaine sort (pas de champ de version aujourd'hui, voir "Ajouter un nouveau domaine" ci-dessus).
- Charting plus riche (recharts ou équivalent) si un futur graphe dépasse ce qu'un `<svg>` fait main peut raisonnablement exprimer.

## Comment reprendre le développement

```bash
npm install
npm run dev            # nécessite DATABASE_URL / DIRECT_URL (Postgres) + les variables Supabase
npm run build           # tsc + next build — à faire tourner avant de livrer
npx prisma generate      # après toute modif de schema.prisma
npx prisma migrate dev   # applique les migrations sur une DB de dev réelle
```

- Pour un nouveau domaine, suivre la **check-list** ci-dessus (8 points d'intégration).
- Le fichier `ma-superapp.jsx` à la racine est un vestige de la version artifact : ne pas le modifier en pensant que ça affecte l'app, et ne pas repartir de son architecture (`window.storage`, fichier unique) pour de nouvelles fonctionnalités.
- Aucune donnée ne doit partir vers un service externe sans raison explicite (l'app est volontairement "tout calcule localement" pour la prière et la nutrition) — si un besoin réseau apparaît (ex: API météo, notifications push), documenter la décision ici.
