# Bot de Vouch Discord

Ce bot Discord permet à vos clients de laisser des évaluations (vouches) après un achat sur votre serveur. Les évaluations comprennent :
- Description du service acheté
- Note de 1 à 5 étoiles
- Option pour ajouter une preuve d'achat (image/vidéo)
- Stockage permanent des vouches pour pouvoir les restaurer en cas de besoin

## Installation

1. Assurez-vous d'avoir Node.js installé sur votre système (version 16.9.0 ou supérieure recommandée)
2. Clonez ou téléchargez ce dépôt
3. Ouvrez un terminal dans le dossier du projet
4. Créez un dossier nommé "vouches" dans le répertoire principal du projet
5. Installez les dépendances en exécutant :
   ```
   npm install discord.js
   ```

## Configuration

1. Ouvrez le fichier `config.js` et modifiez les paramètres suivants :
   - `token` : Le token de votre bot Discord
   - `vouchChannelId` : L'ID du salon où les évaluations seront envoyées
   - `adminId` : Votre ID Discord (seul l'utilisateur avec cet ID peut utiliser la commande `/restore`)
   - Les autres paramètres selon vos préférences

2. Pour obtenir un token de bot Discord :
   - Rendez-vous sur [Discord Developer Portal](https://discord.com/developers/applications)
   - Créez une nouvelle application
   - Allez dans l'onglet "Bot"
   - Cliquez sur "Add Bot"
   - Copiez le token

3. Pour inviter le bot sur votre serveur :
   - Dans le Developer Portal, allez dans l'onglet "OAuth2" > "URL Generator"
   - Sélectionnez les scopes "bot" et "applications.commands"
   - Dans les permissions du bot, sélectionnez au minimum :
     - "Send Messages"
     - "Embed Links"
     - "Attach Files"
     - "Read Message History"
     - "Use Slash Commands"
   - Utilisez l'URL générée pour inviter le bot sur votre serveur

## Démarrage du bot

**Important** : Avant de démarrer le bot pour la première fois, assurez-vous d'avoir créé le dossier `vouches` dans le même répertoire que les fichiers index.js et config.js. Bien que le code tente de créer ce dossier automatiquement, il est recommandé de le créer manuellement pour éviter tout problème.

```
node index.js
```

Lors du démarrage, le bot affichera des informations détaillées sur :
- État de la connexion
- Vérification de la configuration
- Commandes slash enregistrées
- État du compteur de vouch
- Dossier de stockage des vouches

## Utilisation

### Créer une évaluation

Les utilisateurs peuvent créer une évaluation en suivant ces étapes :

1. Taper `/vouch` dans n'importe quel canal où le bot a accès
2. Entrer une description du service acheté
3. Choisir une note de 1 à 5 étoiles
4. Optionnellement ajouter une preuve d'achat (image/vidéo)

L'évaluation sera ensuite publiée dans le salon configuré et sauvegardée dans un fichier pour une restauration future si nécessaire.

### Restaurer des évaluations

En cas de suppression accidentelle d'un salon ou pour recréer des évaluations, l'administrateur (défini par `adminId` dans config.js) peut utiliser la commande `/restore` de différentes façons :

1. Restaurer toutes les évaluations :
   ```
   /restore all:true
   ```

2. Restaurer une évaluation spécifique par son numéro :
   ```
   /restore number:5
   ```

3. Restaurer dans un salon spécifique :
   ```
   /restore all:true channel:123456789012345678
   ```
   où `123456789012345678` est l'ID du salon cible

4. Restaurer une évaluation spécifique dans un salon spécifique :
   ```
   /restore number:5 channel:123456789012345678
   ```

## Structure des fichiers

- `index.js` - Fichier principal du bot
- `config.js` - Configuration du bot
- `vouches/` - Dossier contenant les évaluations sauvegardées (doit être créé manuellement)
- `vouchCounter.json` - Fichier contenant le compteur pour la numérotation des vouches (créé automatiquement)

## Personnalisation

Vous pouvez personnaliser de nombreux aspects du bot en modifiant le fichier `config.js`, notamment :

- Couleur des embeds
- Titre des messages
- Nom du service
- Messages et textes
- Options pour les preuves (taille maximale, délai d'attente, etc.)

## Troubleshooting

### Problème de dossier manquant

Si vous obtenez une erreur comme `Error: ENOENT: no such file or directory './vouches/...'` :
1. Arrêtez le bot
2. Créez manuellement un dossier nommé `vouches` dans le répertoire principal du projet
3. Redémarrez le bot

### Problèmes avec les images

Si vous rencontrez des problèmes avec l'affichage des images lors de la restauration des vouches, voici quelques solutions possibles :

1. **URLs expirées** : Les liens vers les images Discord peuvent expirer après un certain temps. Dans ce cas, vous devrez uploader à nouveau les images.

2. **Erreur de stockage** : Vérifiez que les URLs des images sont correctement sauvegardées dans les fichiers de vouch (dans le dossier `vouches/`).

3. **Permissions** : Assurez-vous que le bot a les permissions nécessaires pour afficher des images dans le salon cible.

4. **Limitations Discord** : Dans certains cas, Discord peut limiter le nombre de requêtes, ce qui peut empêcher le chargement des images. Dans ce cas, attendez quelques minutes et réessayez.

## Support

Si vous rencontrez des problèmes, assurez-vous que :
- Le bot a les permissions nécessaires sur votre serveur
- L'ID du canal de vouch est correctement configuré
- Votre ID est correctement configuré comme administrateur
- Le token du bot est valide
