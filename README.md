# Ma collection LEGO

App web installable (PWA) pour téléphone et ordinateur. Sans serveur : les données vivent dans le navigateur (IndexedDB) et se synchronisent dans le dossier caché de l'app sur le Google Drive de chaque utilisateur.

## Sources de données

| Source | Sert à | Appel |
|---|---|---|
| Rebrickable | sets, recherche, personnages, inventaire et catalogue des pièces | direct depuis le navigateur |
| Brickset | collection (sous-thème, ex. Starship Collection) et mois de sortie | via le relais Google Apps Script (`apps-script/Code.gs`), car Brickset n'autorise pas les appels navigateur |

## Configuration

Copier `.env.example` en `.env.local` et remplir :

| Variable | Où l'obtenir |
|---|---|
| `VITE_REBRICKABLE_API_KEY` | rebrickable.com › Profil › Settings › API |
| `VITE_GOOGLE_CLIENT_ID` | voir « Connexion Google » |
| `VITE_BRICKSET_PROXY_URL` | voir « Relais Brickset » |

Chaque variable est facultative : sans Google, la collection reste sur l'appareil ; sans relais Brickset, collection et date de sortie se saisissent à la main.

## Connexion Google

1. console.cloud.google.com › créer un projet « Collection LEGO ».
2. APIs & Services › Library › activer **Google Drive API**.
3. OAuth consent screen › External › nom de l'app, e-mail › scopes : `drive.appdata`, `openid`, `email`, `profile` › **Test users** : ajouter l'adresse Gmail de chaque membre de la famille.
4. Credentials › Create credentials › OAuth client ID › **Web application** › Authorized JavaScript origins : `http://localhost:5173` et l'adresse de l'app une fois hébergée.
5. Copier le Client ID dans `VITE_GOOGLE_CLIENT_ID`.

## Relais Brickset

1. script.google.com › Nouveau projet › coller `apps-script/Code.gs`.
2. Paramètres du projet › Propriétés du script › ajouter `BRICKSET_API_KEY` = la clé Brickset.
3. Déployer › Nouveau déploiement › Application Web › Exécuter en tant que : **moi** › Accès : **tout le monde**.
4. Copier l'URL `/exec` dans `VITE_BRICKSET_PROXY_URL`.

Un seul déploiement sert toute la famille.

## Développement

```bash
pnpm install
pnpm dev
pnpm test
pnpm build
```
