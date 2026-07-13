# CLAUDE.md — Ma Superapp Personnelle (VIDA)

## Vue d'ensemble

Superapp personnelle de suivi de vie ("life OS"), app Next.js (App Router, TypeScript) avec base Postgres via Prisma. Elle regroupe **13 domaines de vie** dans une architecture "hub + mini-apps" : un dashboard central avec une vision globale, et une mini-app dédiée par domaine. Toutes les données sont persistées en base (Supabase Postgres), par utilisateur authentifié (Supabase Auth).

**Utilisateur cible** : usage personnel quotidien sur mobile (saisie rapide matin/soir) + bilan hebdomadaire. Langue : français. Localisation : Algérie (devise DA, horaires de prière méthode du Ministère algérien).

**Historique** : le projet a démarré comme un artifact React un seul fichier (`ma-superapp.jsx`, ~2000 lignes, stockage `window.storage`). Il a été entièrement reconstruit en app Next.js/Prisma/Supabase le 2026-07-11 pour avoir une vraie base de données et, à terme, servir un client iOS personnel (sideload, pas d'App Store). Le fichier `ma-superapp.jsx` original n'existe plus dans le repo actuel.

## Les 13 domaines

| ID | Label | Couleur | Modèles Prisma | Route API | Composant |
|---|---|---|---|---|---|
| `fin` | Finances | `#E9B950` or | `Transaction` | `/api/finances/transactions` | `components/domains/Finances.tsx` |
| `sport` | Sport | `#FF7A6B` corail | `SportSession`, `Weight` | `/api/sport/sessions`, `/api/sport/weights` | `Sport.tsx` |
| `hab` | Habitudes | `#4FD1C5` teal | `Habit`, `HabitCheck` | `/api/habits` | `Habits.tsx` |
| `goal` | Objectifs | `#7FA3FF` bleu | `Goal`, `LearningSession` | `/api/goals`, `/api/goals/sessions` | `Goals.tsx` |
| `book` | Livres | `#C792EA` violet | `Book`, `ReadingLog` | `/api/books` | `Books.tsx` |
| `dep` | Sans (Dépendances) | `#F06595` rose | `DependencyItem`, `DependencyCount` | `/api/dependencies` | `Dependencies.tsx` |
| `maison` | Maison | `#FFA94D` orange | `HouseTask`, `HouseTaskLog` | `/api/house` | `Maison.tsx` |
| `rel` | Liens (Relations) | `#69DB7C` vert | `Contact`, `ContactLog` | `/api/relations` | `Relations.tsx` |
| `priere` | Prière | `#63E6BE` menthe | `PrayerCheck` (+ `Settings.prayer*`) | `/api/prayer` | `Priere.tsx` |
| `vehicule` | Véhicule | `#4DABF7` bleu ciel | `VehicleTask`, `VehicleTaskLog` | `/api/vehicle` | `Vehicule.tsx` |
| `sommeil` | Sommeil | `#9775FA` violet foncé | `SleepLog` | `/api/sleep` | `Sommeil.tsx` |
| `todo` | To-do | `#CED4DA` argent | `TodoTask` | `/api/todo` | `Todo.tsx` |
| — | Réglages | — | `Settings` | `/api/settings` | `app/(app)/settings/page.tsx` |

Couleurs et ids centralisés dans `lib/theme.ts` (objet `T`, tableau `DOMAINS`, `ALL_IDS`).

## Architecture du code

```
app/
├── (app)/                     — routes protégées (layout vérifie l'auth, affiche le Shell)
│   ├── layout.tsx             — requireUserId() + getOrCreateSettings() + <Shell>
│   ├── page.tsx                — dashboard (getDashboardData + getTrendData)
│   ├── fin/, sport/, hab/, …  — une page par domaine (13 dossiers)
│   └── settings/
├── api/                        — routes REST JSON (voir "Pourquoi des routes API")
│   ├── finances/, sport/, habits/, goals/, books/, dependencies/,
│   │   house/, relations/, prayer/, vehicle/, sleep/, todo/, settings/, reset/
├── auth/actions.ts             — Server Actions signIn/signUp/signOut (seule exception aux routes API)
├── sign-in/, sign-up/
lib/
├── theme.ts                    — couleurs/domaines/PRAYERS/ALL_IDS
├── dates.ts                    — today(), lastNDays(), daysSince() — dates locales YYYY-MM-DD
├── prisma.ts                   — client Prisma singleton
├── user.ts                     — requireUserId() (lit x-user-id posé par le middleware), getOrCreateSettings() (React cache())
├── dashboard.ts                — getDashboardData() : fractions boussole + bilan 7 jours
├── trends.ts                   — getTrendData() : mêmes fractions que la boussole, par jour, sur 7/30 jours
├── prayer-times.ts             — calcul astronomique local des horaires de prière
├── api.ts                      — withAuth() wrapper pour les routes API
├── currency.ts, api-client.ts
└── supabase/
    ├── client.ts, server.ts    — clients Supabase (browser / Server Components)
    └── middleware.ts           — updateSession() : vérifie le JWT, pose le header x-user-id
components/
├── ui.tsx                      — Card, Section, Btn, Input, Select, Empty, MiniHeader
├── Shell.tsx                   — conteneur + nav du bas
├── Home.tsx                    — dashboard (client component)
├── Boussole.tsx                — anneau SVG signature
├── TrendChart.tsx              — graphique de tendance multi-domaines (client component, SVG fait main)
└── domains/                    — un composant par domaine
prisma/schema.prisma            — schéma complet, voir "Persistance des données"
middleware.ts                   — délègue à lib/supabase/middleware.ts
vercel.json                     — { "regions": ["arn1"] } (voir "Déploiement")
```

### Pourquoi des routes API plutôt que des Server Actions

Le but final est aussi un client iOS personnel (sideload). Le backend est donc en routes `app/api/*` (JSON, authentifiées par la session Supabase) plutôt qu'en Server Actions, pour qu'un futur client mobile (React Native/Expo ou Swift) puisse appeler les mêmes endpoints sans réécriture. Le web app lui-même appelle ces routes depuis les composants client (`lib/api-client.ts`).

**Convention à respecter** : toute nouvelle mutation passe par une route `/api/<domaine>/...`, jamais par une Server Action — c'est structurant pour le plan iOS. Les chargements initiaux de page utilisent Prisma directement dans les Server Components (SSR rapide) ; les mutations interactives passent par l'API REST puis `router.refresh()`. Seules les actions d'auth (signIn/signUp/signOut) sont des Server Actions (`app/auth/actions.ts`), suivant le pattern officiel Supabase SSR — un client mobile utilisera le SDK Supabase directement pour l'auth, donc ce n'est pas un problème.

### Persistance des données

- Postgres via Supabase, un projet unique (`olszkukythmzzpdtcezi`, région `eu-north-1` Stockholm). Prisma comme ORM (`prisma/schema.prisma`).
- `DATABASE_URL` = pooler pgbouncer port 6543 (requêtes normales), `DIRECT_URL` = port 5432 direct (requis par `prisma migrate` car le pooler ne supporte pas les prepared statements).
- Une ligne `User` par utilisateur Supabase Auth (`id` = `auth.users.id`), une ligne `Settings` par utilisateur (créée à la volée via `getOrCreateSettings`, idempotente, wrappée en React `cache()` pour dédupliquer les appels multiples sur une même requête).
- Toutes les dates métier sont des `String` `"YYYY-MM-DD"` (jamais `DateTime`), calculées côté client via `lib/dates.ts` — jamais l'heure serveur, pour éviter tout décalage de fuseau.
- Domaines actifs par défaut : tous les 13 (`Settings.activeDomains`), personnalisables dans Réglages.

### Authentification

Supabase Auth (email + mot de passe réel, pas de confirmation email — désactivée dans le dashboard Supabase pour un usage perso instantané). `middleware.ts` → `lib/supabase/middleware.ts` vérifie le JWT une fois par requête (`supabase.auth.getUser()`) et pose un header interne `x-user-id` (toujours explicitement posé ou supprimé, jamais laissé passer tel quel côté client) que `requireUserId()` réutilise partout en aval (layout, pages, routes API) pour éviter de revalider le JWT plusieurs fois sur la même requête.

## La boussole (élément signature)

Anneau SVG segmenté sur le dashboard : **un segment par domaine actif**, qui se remplit selon l'activité du jour. Le centre affiche le pourcentage global. Logique dans `lib/dashboard.ts` (`getDashboardData`) :

- `fin`, `sport`, `goal`, `book` : binaire — au moins une entrée aujourd'hui = segment plein.
- `hab` : proportion d'habitudes cochées. `priere` : prières faites / 5.
- `dep` : proportion de dépendances **restées à zéro conso aujourd'hui** — ne rien cocher = ça compte comme "propre", ce n'est jamais pénalisé.
- `maison`, `vehicule`, `rel` : proportion d'éléments **à jour** (`daysSince(lastDone) < freqDays`) — pas une activité quotidienne, un statut de fraîcheur qui redescend progressivement entre deux entretiens/contacts.
- `sommeil` : heures dormies / objectif (plafonné à 1). `todo` : faites aujourd'hui / (faites + en attente).

Le nombre de segments s'adapte dynamiquement aux domaines activés dans Réglages.

### Graphique de tendances

En bas du dashboard : `components/TrendChart.tsx` (SVG fait main, pas de lib de charting) affiche les **mêmes fractions que la boussole**, mais calculées jour par jour sur une fenêtre 7j/30j (`lib/trends.ts`, `getTrendData`) plutôt que juste "aujourd'hui" — une ligne par domaine actif, couleur du thème, points par jour, légende cliquable pour masquer une courbe, survol/tap = valeurs du jour. Le toggle 7j/30j re-découpe côté client un seul fetch 30 jours (pas de requête supplémentaire).

## Horaires de prière (décision technique importante)

**Historique** : la première version (artifact) utilisait l'API AlAdhan via `fetch`, bloquée par la CSP du bac à sable Claude-artifact. La solution — calcul astronomique **local** (algorithme praytimes.org) — a été portée telle quelle dans `lib/prayer-times.ts` lors du rebuild Next.js. Le réseau n'est plus bloqué hors artifact, mais la propriété "hors ligne, instantané, zéro dépendance réseau" reste un choix délibéré à conserver.

- `CITIES` : 48 chefs-lieux de wilaya algériens + diaspora (Paris, Marseille, Lyon, Lille, Bruxelles, Montréal, Londres) + coordonnées manuelles.
- `METHOD_ANGLES` : Algérie 19 (18°/17°, défaut), MWL, Égypte, Umm Al-Qura, Maroc, ISNA, France UOIF.
- Fuseau horaire de l'appareil (`getTimezoneOffset`). La prochaine prière est mise en avant (halo) sur le dashboard et dans la mini-app.

## Design system

- **Thème sombre** : fond `#12151F`, surfaces `#1B2030` / `#242A3E`, texte `#EEF0F8`, muted `#8A90A8`.
- **Typographies** : Space Grotesk (titres, chiffres) + Inter (corps).
- **Styles inline** (pas de Tailwind) pour un contrôle total des couleurs par domaine — `components/ui.tsx` fournit les briques de base (Card, Section, Btn, Input, Select, Empty, MiniHeader).
- Mobile-first : conteneur max 480px, nav du bas fixe défilante horizontalement, `prefers-reduced-motion` respecté.
- Icônes : lucide-react. Chaque domaine garde sa couleur d'accent partout (nav, boussole, tendances, boutons, stats).

## Dashboard (Home) — ordre des sections

1. En-tête : salutation personnalisée + date + bouton ⚙️ Réglages
2. Boussole + légende des domaines actifs
3. Prières du jour (cochables, horaires exacts, prochaine prière en surbrillance)
4. À faire (4 tâches to-do prioritaires, cochables)
5. Habitudes du jour (cochables)
6. Accès rapide (raccourcis vers les mini-apps)
7. Bilan des 7 derniers jours (une ligne par domaine actif)
8. **Tendances** (nouveau) : graphique multi-domaines 7j/30j

Toutes les sections respectent le filtre des domaines actifs.

## Déploiement

Vercel, projet `vida-superapp` (compte `aniskhelifi1608-1633`), connecté au repo GitHub `KHEDMA-web/VIDA` (auto-deploy sur push `master`). Live : https://vida-superapp.vercel.app.

- **Région fonctions** : `arn1` (Stockholm) via `vercel.json`, co-localisée avec la base Supabase (`eu-north-1`) — un mauvais choix de région ici coûte ~150-300ms de latence transatlantique par appel Prisma/auth.
- **Variables d'env** : les 5 clés de `.env` doivent être poussées sur Vercel pour Production **et** Development (`vercel env add <NAME> <env> --value X --yes`). L'environnement Preview a un bug CLI connu (exige une branche git spécifique, refuse la branche de prod) — sans impact tant qu'il n'y a qu'une seule branche.
- **Process de déploiement** : `npx tsc --noEmit` puis `npm run build` en local avant tout `vercel --prod`, jamais l'inverse.
- Nom de projet Vercel : doit être en minuscules (le nom du dossier `VIDA` ne passe pas tel quel, d'où `--project vida-superapp` explicite au premier `vercel link`).

## Performance — pièges déjà rencontrés

- **Vérifier la région des Functions vs la région de la base de données** avant tout diagnostic de lenteur — un décalage de région coûte largement plus cher qu'une requête Prisma mal optimisée.
- **`requireUserId()` ne doit jamais re-vérifier le JWT** si le header `x-user-id` posé par le middleware est présent — ne pas réintroduire d'appel direct à `supabase.auth.getUser()` dans une page/route sans repasser par `requireUserId()`.
- **`getOrCreateSettings` doit rester wrappé en React `cache()`** — layout et pages l'appellent tous les deux sur une même requête ; sans dédup, en plus du coût double, une course entre les deux peut faire planter le tout premier chargement d'un compte neuf (la page lisait les settings avant que le layout les ait créés).

## Comment reprendre le développement

- `npm install`, `.env` avec les 5 clés (voir `.env.example`), `npx prisma generate`, `npm run dev`.
- Avant toute modification poussée en prod : `npx tsc --noEmit` puis `npm run build`, les deux doivent passer sans erreur.
- Pour un nouveau domaine : modèle(s) Prisma + migration, route(s) `/api/<domaine>/...`, composant `components/domains/<Domaine>.tsx`, page `app/(app)/<domaine>/page.tsx`, entrée dans `lib/theme.ts` (`T`, `DOMAINS`, `ALL_IDS`), et prise en compte dans `lib/dashboard.ts` (fraction boussole + bilan) et `lib/trends.ts` (fraction historique) si le domaine doit apparaître dans la boussole/les tendances.
- Ne jamais réintroduire `localStorage`/`sessionStorage` ni de mutation hors des routes `/api/*` (voir "Pourquoi des routes API").
- Déploiement : `vercel --prod` (CLI déjà authentifiée et liée localement, voir "Déploiement").

## Pistes d'évolution évoquées (non implémentées)

- Grille d'apps sur le dashboard / refonte de la navigation.
- Domaines : Humeur, Nutrition/Hydratation, Films & séries, Journal de bord, Gratitude, Carrière.
- Objectif de poids avec projection ; export des données en fichier ; bilan mensuel.
- Client iOS personnel (sideload) consommant les routes `/api/*` existantes.
- Environnement Preview Vercel fonctionnel (bloqué par un bug CLI tant qu'il n'y a qu'une branche `master`).
