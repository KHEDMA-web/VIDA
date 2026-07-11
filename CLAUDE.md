# CLAUDE.md — Ma Superapp Personnelle

## Vue d'ensemble

Superapp personnelle de suivi de vie ("life OS") construite en un seul fichier React (`ma-superapp.jsx`, ~2000 lignes). Elle regroupe **13 domaines de vie** dans une architecture "hub + mini-apps" : un dashboard central avec une vision globale, et une mini-app dédiée par domaine. Toutes les données sont persistées entre les sessions via `window.storage` (stockage clé-valeur des artifacts Claude).

**Utilisateur cible** : usage personnel quotidien sur mobile (saisie rapide matin/soir) + bilan hebdomadaire. Langue : français. Localisation : Algérie (devise DA, horaires de prière méthode du Ministère algérien).

## Les 13 domaines

| ID | Label | Couleur | Contenu |
|---|---|---|---|
| `fin` | Finances | `#E9B950` or | Transactions (dépense/revenu, catégorie), budget mensuel, dépenses par catégorie |
| `sport` | Sport | `#FF7A6B` corail | Séances (type, durée), objectif hebdo, **suivi du poids** avec courbe (12 dernières pesées) |
| `hab` | Habitudes | `#4FD1C5` teal | Habitudes cochables, séries (streaks) 🔥, grille 7 jours corrigeable |
| `goal` | Objectifs | `#7FA3FF` bleu | Objectifs avec progression % (+/-5), sessions d'apprentissage en minutes |
| `book` | Livres | `#C792EA` violet | Livres avec progression page par page, journal de pages lues, terminés |
| `dep` | Sans (Dépendances) | `#F06595` rose | Compteur de **jours sans**, conso du jour +/-, économies estimées, barres 7 jours |
| `maison` | Maison | `#FFA94D` orange | Tâches récurrentes (fréquence en jours), tri par urgence, "En retard de X j" |
| `rel` | Liens (Relations) | `#69DB7C` vert | Proches avec rythme de contact, tri par personnes à recontacter |
| `priere` | Prière | `#63E6BE` menthe | 5 prières cochables + **horaires exacts calculés localement**, série de jours complets |
| `vehicule` | Véhicule | `#4DABF7` bleu ciel | Entretiens récurrents (vidange, assurance…), alerte à J-14 |
| `sommeil` | Sommeil | `#9775FA` violet foncé | Heures + qualité (1-5), objectif réglable, barres 7 nuits avec ligne d'objectif |
| `todo` | To-do | `#CED4DA` argent | Tâches avec étoile ⭐ importante, terminées restaurables |
| — | Réglages | — | Prénom, devise, domaines actifs, ville de prière, méthode de calcul, reset |

## Architecture du code

```
ma-superapp.jsx (fichier unique, export default App)
├── THÈME (objet T) + DOMAINS + PRAYERS + ALL_IDS + DEFAULTS
├── Helpers : uid, localDate, today, lastNDays, monthKey, eur (devise dynamique), daysSince
├── Storage : loadDomain / saveDomain  →  clés "superapp:<id>"
├── Calcul horaires de prière (astronomique local) : computeTimes, METHOD_ANGLES, CITIES, getPrayerTimes, nextPrayer
├── UI de base : Card, Section, Btn, Input, Empty, MiniHeader
├── Boussole (signature visuelle, SVG)
├── App (état global, chargement, migrations, fractions, routage par onglet)
├── Shell (conteneur + barre de navigation défilante en bas)
├── Home (dashboard)
└── 13 composants mini-apps + Reglages
```

### Persistance des données

- Une clé de stockage par domaine : `superapp:fin`, `superapp:sport`, etc. + `superapp:settings`.
- Données **personnelles** (`shared: false`, défaut) — accessibles uniquement par l'utilisateur.
- Chaque mutation appelle `set(next)` qui met à jour l'état React **et** sauvegarde immédiatement.
- Toutes les lectures sont protégées par try/catch (clé absente = premier lancement → valeurs `DEFAULTS`).
- Les dates sont stockées en local `YYYY-MM-DD` (pas UTC, pour éviter les décalages de fuseau).

### Migrations

Le champ `settings` porte des drapeaux de version pour activer automatiquement les nouveaux domaines **une seule fois** sans écraser les choix de l'utilisateur :
- `v2` : ajout de priere/vehicule/sommeil aux domaines actifs.
- `v3` : ajout de todo.
- Migration ville : si une ville avait été tapée en texte libre (ancienne version API), elle est convertie en coordonnées si reconnue dans `CITIES`, sinon réinitialisée.

**Convention** : tout nouveau domaine doit être ajouté à `ALL_IDS`, `DOMAINS`, `DEFAULTS`, à l'état de `App` (state + load + setter + resetAll), aux `fractions` de la boussole, au bilan 7 jours de `Home`, et déclenché par un nouveau drapeau `vN` de migration.

## La boussole (élément signature)

Anneau SVG segmenté sur le dashboard : **un segment par domaine actif**, qui se remplit selon l'activité du jour. Le centre affiche le pourcentage global. Règles de remplissage par domaine :

- `fin`, `sport`, `goal`, `book` : binaire — au moins une entrée aujourd'hui = segment plein.
- `hab` : proportion d'habitudes cochées. `priere` : prières faites / 5.
- `dep` : proportion de suivis restés à zéro aujourd'hui.
- `maison`, `vehicule`, `rel` : proportion d'éléments "à jour" (pas en retard).
- `sommeil` : heures dormies / objectif (plafonné à 1). `todo` : faites aujourd'hui / (faites + en attente).

Le nombre de segments s'adapte dynamiquement aux domaines activés dans Réglages.

## Horaires de prière (décision technique importante)

**Historique** : la première version utilisait l'API AlAdhan (`api.aladhan.com`) via `fetch`. **Échec** : les artifacts Claude bloquent les requêtes réseau vers des domaines externes (CSP du bac à sable) — seule l'API Anthropic est autorisée. Symptôme : "je définis ma ville et rien ne se passe".

**Solution actuelle** : calcul astronomique **local** (algorithme de référence praytimes.org) — position solaire, déclinaison, équation du temps, angles crépusculaires. Validé contre l'API officielle pour Alger : résultat identique à ±1 min.

- `CITIES` : les 48 chefs-lieux de wilaya algériens + villes de la diaspora (Paris, Marseille, Lyon, Lille, Bruxelles, Montréal, Londres) avec coordonnées, + option coordonnées manuelles.
- `METHOD_ANGLES` : Algérie 19 (18°/17°, défaut), MWL, Égypte, Umm Al-Qura (Isha = Maghrib + 90 min), Maroc, ISNA, France UOIF.
- Fuseau horaire : celui de l'appareil (`getTimezoneOffset`), hypothèse valide pour un usage personnel.
- La **prochaine prière** est mise en avant (halo) sur le dashboard et dans la mini-app.
- Avantages : hors ligne, instantané, recalcul quotidien automatique, zéro dépendance réseau.

## Design system

- **Thème sombre** : fond `#12151F` (encre nuit), surfaces `#1B2030` / `#242A3E`, texte `#EEF0F8`, muted `#8A90A8`.
- **Typographies** : Space Grotesk (titres, chiffres) + Inter (corps), via Google Fonts.
- **Styles inline** (pas de Tailwind) pour un contrôle total des couleurs par domaine.
- Mobile-first : conteneur max 480px, barre de navigation fixe en bas **défilante horizontalement** (13+ onglets), safe-area iOS gérée, `prefers-reduced-motion` respecté.
- Icônes : lucide-react. Chaque domaine a sa couleur d'accent, utilisée partout (nav, boussole, boutons, stats).
- Interdits respectés : pas de `<form>`, pas de `localStorage`/`sessionStorage` (uniquement `window.storage`).

## Dashboard (Home) — ordre des sections

1. En-tête : salutation personnalisée ("Salut {prénom} 👋") + date + bouton ⚙️ Réglages
2. Boussole + légende des domaines actifs
3. Prières du jour (cochables, avec heures exactes, prochaine prière en surbrillance)
4. À faire (4 tâches to-do prioritaires, cochables)
5. Habitudes du jour (cochables)
6. Accès rapide (raccourcis vers les mini-apps)
7. Bilan des 7 derniers jours (une ligne par domaine actif)

Toutes les sections respectent le filtre des domaines actifs.

## Historique des évolutions (sessions de développement)

1. **v1** : 5 domaines (Finances, Sport, Habitudes, Objectifs, Livres) + boussole + bilan 7 jours.
2. **+3 domaines** : Dépendances, Maison, Relations. Boussole passée en dynamique, nav défilante.
3. **Réglages + poids** : prénom, devise dynamique (fonction `eur` + `CURRENCY` module), toggles de domaines, reset avec confirmation ; suivi du poids dans Sport. Bouton ⚙️ ajouté en haut du dashboard (l'onglet seul n'était pas assez visible).
4. **Devise DA** : ajout du Dinar algérien + symboles dynamiques dans tous les placeholders.
5. **+3 domaines** : Prière, Véhicule, Sommeil (migration v2).
6. **Horaires de prière** : d'abord API AlAdhan (bloquée par la CSP), puis réécriture en calcul astronomique local avec sélecteur des 48 wilayas.
7. **To-do** (migration v3) : tâches importantes ⭐, section dashboard, restauration.
8. Disposition de la nav : options proposées (grille d'apps, favoris+tiroir, boussole interactive) — **l'utilisateur a choisi de garder la barre défilante pour l'instant**.

## Pistes d'évolution évoquées (non implémentées)

- Grille d'apps sur le dashboard / refonte de la navigation.
- Domaines : Humeur, Nutrition/Hydratation, Films & séries, Journal de bord, Gratitude, Carrière.
- Objectif de poids avec projection ; export des données en fichier ; bilan mensuel.

## Comment reprendre le développement

- Le fichier est autonome : le coller comme artifact React suffit.
- Vérifier la syntaxe après modification : `npx esbuild ma-superapp.jsx --loader:.jsx=jsx --jsx=automatic --outfile=/tmp/out.js`.
- Pour un nouveau domaine, suivre la **convention** listée dans "Migrations" ci-dessus (8 points d'intégration).
- Ne jamais réintroduire de `fetch` vers des API externes (bloqué par la CSP des artifacts) ni de `localStorage`.
