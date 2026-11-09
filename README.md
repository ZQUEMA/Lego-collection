# Ma collection LEGO

App web installable (PWA) pour téléphone et ordinateur. Sans serveur : les données vivent dans le navigateur (IndexedDB) et se synchronisent dans le dossier caché de l'app sur le Google Drive de chaque utilisateur.

Aucune clé d'API n'est dans le code de l'app : elles vivent dans les propriétés du relais Google Apps Script.

## Sources de données

Toutes passent par le relais (`apps-script/Code.gs`), qui détient les clés.

| Source | Sert à |
|---|---|
| Rebrickable | sets, recherche, personnages, inventaire et catalogue des pièces |
| lego.com (page des notices, en français) | nom français officiel du set |
| Brickset | collection (sous-thème, ex. Starship Collection) ou épisode, et mois de sortie |

## Configuration de l'app

Copier `.env.example` en `.env.local` et remplir :

| Variable | Où l'obtenir |
|---|---|
| `VITE_GOOGLE_CLIENT_ID` | voir « Connexion Google ». Public par nature : Google ne l'accepte que depuis les origines autorisées |
| `VITE_RELAY_URL` | voir « Relais » |

Sans Google, la collection reste sur l'appareil. Sans relais, l'app ne peut pas chercher de sets.

## Connexion Google

1. console.cloud.google.com › créer un projet « Collection LEGO ».
2. APIs & Services › Library › activer **Google Drive API**.
3. OAuth consent screen › External › nom de l'app, e-mail › scopes : `drive.appdata`, `openid`, `email`, `profile` › **Test users** : ajouter l'adresse Gmail de chaque membre de la famille.
4. Credentials › Create credentials › OAuth client ID › **Web application** › Authorized JavaScript origins : `http://localhost:5173` et l'adresse de l'app une fois hébergée.
5. Copier le Client ID dans `VITE_GOOGLE_CLIENT_ID`.

À la première connexion, cocher la case Drive sur l'écran de Google : sans elle, l'app refuse la connexion.

## Relais

1. script.google.com › Nouveau projet › coller `apps-script/Code.gs`.
2. Paramètres du projet › Propriétés du script :
   - `REBRICKABLE_API_KEY` : rebrickable.com › Profil › Settings › API (obligatoire) ;
   - `BRICKSET_API_KEY` : clé Brickset (facultative : sans elle, ni collection ni date de sortie automatiques).
3. Déployer › Nouveau déploiement › Application Web › Exécuter en tant que : **moi** › Accès : **tout le monde**.
4. Copier l'URL `/exec` dans `VITE_RELAY_URL`.

Pour une mise à jour du script : Déployer › Gérer les déploiements › crayon › Version : **Nouvelle version** › Déployer. L'URL ne change pas.

Un seul déploiement sert toute la famille. Le relais garde ses réponses 6 heures en cache.

## Développement

```bash
pnpm install
pnpm dev
pnpm test
pnpm build
```
