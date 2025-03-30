// Configuration du bot de vouch
module.exports = {
    // Données de connexion
    token: '',
    
    // IDs importants
    vouchChannelId: '',
    adminId: '',
    
    // Paramètres du système de vouch
    vouchDirectory: './vouches',         // Dossier où stocker les fichiers de vouch
    vouchCounterFile: './vouchCounter.json', // Fichier pour le compteur de vouches
    
    // Apparence et style
    mainColor: '#FF00FF',           // Couleur principale des embeds (au format hexadécimal)
    embedTitle: 'New vouch created !', // Titre de l'embed de vouch
    serviceName: 'NovaBot',    // Nom du service (sera affiché dans le footer)
    
    // Options pour les preuves
    allowImages: true,        // Autoriser les images de preuve
    allowVideos: true,        // Autoriser les vidéos de preuve
    maxProofSize: 8,          // Taille maximale de la preuve en Mo
    vouchTimeout: 60,         // Délai d'attente pour télécharger une preuve (en secondes)
    
    // Messages et textes
    messages: {
      success: 'Merci! Votre évaluation a été publiée avec succès.',
      errorNoPermission: 'Vous n\'êtes pas autorisé à utiliser cette commande. Seul l\'administrateur configuré peut restaurer les vouches.',
      errorNoVouchChannel: 'Erreur: Le canal de vouch n\'est pas configuré correctement.',
      errorGeneric: 'Une erreur est survenue. Veuillez recommencer.',
      proofRequest: 'Veuillez uploader une image ou une vidéo comme preuve. Envoyez simplement votre fichier dans ce canal.',
      proofTimeout: 'Vous n\'avez pas envoyé de preuve dans le temps imparti. Votre évaluation a été envoyée sans preuve.',
      restoreNotFound: 'Vouch introuvable.',
      restoreSuccess: 'Vouch(es) restauré(s) avec succès.',
      restoreError: 'Erreur lors de la restauration du vouch.',
      restoreInProgress: 'Restauration en cours...',
      restoreSpecifyOption: 'Veuillez spécifier si vous souhaitez restaurer tous les vouches ou un vouch spécifique.'
    }
  };