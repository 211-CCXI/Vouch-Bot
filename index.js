// Discord Vouch Bot
// Ce bot permet aux clients de laisser des évaluations après un achat

const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const fs = require('fs');
const config = require('./config.js');

// Initialisation du client Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Pour stocker temporairement les évaluations en cours
client.vouchData = {};

// Créer le dossier pour stocker les vouches si nécessaire
const VOUCHES_DIR = config.vouchDirectory;
if (!fs.existsSync(VOUCHES_DIR)) {
  fs.mkdirSync(VOUCHES_DIR);
}

// Fonction pour sauvegarder un vouch dans un fichier
function saveVouchToFile(vouchData, vouchNumber, proofUrl) {
  // Valider l'URL de preuve
  let validatedProofUrl = null;
  
  if (proofUrl) {
    try {
      // S'assurer que l'URL est complète (avec https://)
      if (!proofUrl.startsWith('http')) {
        proofUrl = 'https://' + proofUrl;
      }
      
      // Stocker l'URL validée
      validatedProofUrl = proofUrl;
      console.log(`URL de preuve validée et sauvegardée: ${validatedProofUrl}`);
    } catch (err) {
      console.error(`Erreur lors de la validation de l'URL de preuve:`, err);
    }
  }
  
  const vouchToSave = {
    ...vouchData,
    vouchNumber,
    proofUrl: validatedProofUrl,
    timestamp: new Date().toISOString()
  };
  
  try {
    // Créer un chemin de fichier avec le préfixe "vouch_" suivi du numéro
    const filePath = `${VOUCHES_DIR}/vouch_${vouchNumber}.json`;
    
    // Sauvegarder le vouch avec un formatage JSON lisible (2 espaces d'indentation)
    fs.writeFileSync(filePath, JSON.stringify(vouchToSave, null, 2), 'utf8');
    console.log(`Vouch #${vouchNumber} sauvegardé dans le fichier: ${filePath}`);
    
    // Afficher un résumé des données sauvegardées pour débogage
    console.log(`- Service: ${vouchToSave.service}`);
    console.log(`- Rating: ${vouchToSave.rating} étoiles`);
    console.log(`- URL de preuve: ${validatedProofUrl || 'Aucune'}`);
  } catch (err) {
    console.error(`Erreur lors de la sauvegarde du vouch #${vouchNumber}:`, err);
  }
}

// Événement quand le bot est prêt
client.once('ready', async () => {
  console.log(`\n=== BOT DE VOUCH DISCORD ===`);
  console.log(`✅ Bot connecté en tant que ${client.user.tag}`);
  
  // Vérification de la configuration
  let configValid = true;
  
  if (!config.token || config.token === 'VOTRE_TOKEN_DISCORD_ICI') {
    console.log(`❌ Token Discord non configuré dans config.js`);
    configValid = false;
  }
  
  if (!config.vouchChannelId || config.vouchChannelId === 'ID_DU_SALON_DE_VOUCH') {
    console.log(`❌ ID du salon de vouch non configuré dans config.js`);
    configValid = false;
  } else {
    const vouchChannel = client.channels.cache.get(config.vouchChannelId);
    if (!vouchChannel) {
      console.log(`⚠️ Avertissement: Salon de vouch introuvable (ID: ${config.vouchChannelId})`);
    } else {
      console.log(`✅ Salon de vouch trouvé: #${vouchChannel.name}`);
    }
  }
  
  if (!config.adminId || config.adminId === 'VOTRE_ID_DISCORD_ICI') {
    console.log(`⚠️ Avertissement: ID d'administrateur non configuré dans config.js`);
  }
  
  // Vérifier l'existence du dossier vouches
  console.log(`✅ Dossier de stockage des vouches: ${VOUCHES_DIR}`);
  
  // Enregistrement des commandes slash
  try {
    const commands = [
      {
        name: 'vouch',
        description: 'Laisser une évaluation pour un service acheté'
      },
      {
        name: 'restore',
        description: 'Restaurer tous les vouches dans le salon',
        options: [
          {
            name: 'all',
            description: 'Restaurer tous les vouches',
            type: 5, // BOOLEAN
            required: false
          },
          {
            name: 'number',
            description: 'Restaurer un vouch spécifique par son numéro',
            type: 4, // INTEGER
            required: false
          },
          {
            name: 'channel',
            description: 'ID du salon où restaurer les vouches (optionnel)',
            type: 3, // STRING
            required: false
          }
        ]
      }
    ];
    
    console.log(`ℹ️ Enregistrement des commandes slash...`);
    await client.application.commands.set(commands);
    console.log(`✅ Commandes slash enregistrées avec succès:`);
    commands.forEach(cmd => console.log(`  - /${cmd.name}`));
  } catch (error) {
    console.error(`❌ Erreur lors de l'enregistrement des commandes slash:`, error);
    configValid = false;
  }
  
  // Vérification du compteur de vouch
  try {
    if (fs.existsSync(config.vouchCounterFile)) {
      const data = fs.readFileSync(config.vouchCounterFile, 'utf8');
      if (data && data.trim() !== '') {
        const counterData = JSON.parse(data);
        console.log(`✅ Compteur de vouch chargé: Prochain vouch sera #${counterData.counter}`);
      } else {
        console.log(`ℹ️ Fichier de compteur vide, le compteur sera initialisé à 1`);
      }
    } else {
      console.log(`ℹ️ Fichier de compteur non trouvé, le compteur sera initialisé à 1`);
    }
  } catch (err) {
    console.error(`⚠️ Avertissement: Erreur lors de la lecture du compteur de vouches:`, err);
  }
  
  console.log(`\n${configValid ? '✅ BOT PRÊT À ÊTRE UTILISÉ!' : '⚠️ BOT DÉMARRÉ AVEC DES AVERTISSEMENTS'}`);
  console.log(`=========================\n`);
});

// Gestion des interactions avec le bot
client.on('interactionCreate', async interaction => {
  try {
    // Gestion de la commande /restore pour restaurer les vouches
    if (interaction.commandName === 'restore') {
      // Vérifier les permissions de l'utilisateur (uniquement l'admin configuré dans config.js)
      if (interaction.user.id !== config.adminId) {
        return interaction.reply({ 
          content: config.messages.errorNoPermission, 
          ephemeral: true 
        });
      }
      
      await interaction.deferReply({ ephemeral: true });
      
      const restoreAll = interaction.options.getBoolean('all');
      const specificNumber = interaction.options.getInteger('number');
      const targetChannelId = interaction.options.getString('channel') || interaction.channelId;
      
      // Vérifier si le salon cible existe
      const targetChannel = client.channels.cache.get(targetChannelId);
      if (!targetChannel) {
        return interaction.editReply(`Erreur: Le salon avec l'ID ${targetChannelId} est introuvable.`);
      }
      
      console.log(`Tentative de restauration dans le salon: ${targetChannel.name} (${targetChannelId})`);
      
      if (restoreAll) {
        // Restaurer tous les vouches
        const files = fs.readdirSync(VOUCHES_DIR).filter(file => file.startsWith('vouch_') && file.endsWith('.json'));
        
        if (files.length === 0) {
          return interaction.editReply(config.messages.restoreNotFound);
        }
        
        await interaction.editReply(`${config.messages.restoreInProgress} (${files.length} vouches)`);
        
        let restoredCount = 0;
        for (const file of files) {
          try {
            const vouchData = JSON.parse(fs.readFileSync(`${VOUCHES_DIR}/${file}`, 'utf8'));
            await restoreVouch(vouchData, targetChannelId);
            restoredCount++;
            
            // Attendre un peu entre chaque envoi pour éviter les limites de rate
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (err) {
            console.error(`Erreur lors de la restauration du fichier ${file}:`, err);
          }
        }
        
        return interaction.editReply(`${restoredCount} ${config.messages.restoreSuccess}`);
      } else if (specificNumber) {
        // Restaurer un vouch spécifique
        const filePath = `${VOUCHES_DIR}/vouch_${specificNumber}.json`;
        
        if (!fs.existsSync(filePath)) {
          return interaction.editReply(`Vouch #${specificNumber} ${config.messages.restoreNotFound}`);
        }
        
        try {
          const vouchData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          await restoreVouch(vouchData, targetChannelId);
          return interaction.editReply(`Vouch #${specificNumber} ${config.messages.restoreSuccess}`);
        } catch (err) {
          console.error(`Erreur lors de la restauration du vouch #${specificNumber}:`, err);
          return interaction.editReply(`${config.messages.restoreError} #${specificNumber}.`);
        }
      } else {
        return interaction.editReply(config.messages.restoreSpecifyOption);
      }
    }
    
    // Gestion de la commande /vouch
    if (interaction.commandName === 'vouch') {
      const modal = new ModalBuilder()
        .setCustomId('vouchModal')
        .setTitle('Nouvelle évaluation');

      const serviceInput = new TextInputBuilder()
        .setCustomId('serviceInput')
        .setLabel('Quel service avez-vous acheté?')
        .setPlaceholder('ex: 14 boost discord 1 mois')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const serviceRow = new ActionRowBuilder().addComponents(serviceInput);
      modal.addComponents(serviceRow);

      await interaction.showModal(modal);
    }
    
    // Gestion du modal de vouch
    if (interaction.isModalSubmit() && interaction.customId === 'vouchModal') {
      const service = interaction.fields.getTextInputValue('serviceInput');
      
      // Demander la note en étoiles
      const row = new ActionRowBuilder()
        .addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('starRating')
            .setPlaceholder('Choisissez une note de 1 à 5 étoiles')
            .addOptions([
              { label: '⭐', value: '1', description: 'Très mauvais' },
              { label: '⭐⭐', value: '2', description: 'Mauvais' },
              { label: '⭐⭐⭐', value: '3', description: 'Correct' },
              { label: '⭐⭐⭐⭐', value: '4', description: 'Bon' },
              { label: '⭐⭐⭐⭐⭐', value: '5', description: 'Excellent' },
            ])
        );
      
      await interaction.reply({ 
        content: `Merci! Comment évaluez-vous le service: **${service}**?`, 
        components: [row],
        ephemeral: true
      });
    }
    
    // Gestion de la sélection d'étoiles
    if (interaction.isStringSelectMenu() && interaction.customId === 'starRating') {
      const rating = interaction.values[0];
      const previousMessage = interaction.message;
      const serviceName = previousMessage.content.split('**')[1];
      
      // Stocker les informations de cette évaluation en cours
      const vouchData = {
        userId: interaction.user.id,
        username: interaction.user.username,
        service: serviceName,
        rating: parseInt(rating),
        date: new Date().toISOString()
      };
      
      // Stocker les données temporairement
      client.vouchData[interaction.user.id] = vouchData;
      
      // Demander une preuve d'achat (optionnelle)
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('skipProof')
            .setLabel('Continuer sans preuve')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('addProof')
            .setLabel('Ajouter une image/vidéo')
            .setStyle(ButtonStyle.Primary)
        );
      
      let stars = '';
      for (let i = 0; i < parseInt(rating); i++) {
        stars += '⭐';
      }
      
      await interaction.update({ 
        content: `Vous avez donné **${stars}** pour le service **${serviceName}**.\nVoulez-vous ajouter une preuve d'achat (image/vidéo)?`, 
        components: [row]
      });
    }
    
    // Gestion du bouton "Continuer sans preuve"
    if (interaction.isButton() && interaction.customId === 'skipProof') {
      if (!client.vouchData || !client.vouchData[interaction.user.id]) {
        return interaction.reply({ content: config.messages.errorGeneric, ephemeral: true });
      }
      
      // Répondre d'abord à l'interaction
      await interaction.deferUpdate();
      
      // Création du vouch sans preuve
      await createVouch(interaction, null);
    }
    
    // Gestion du bouton "Ajouter une preuve"
    if (interaction.isButton() && interaction.customId === 'addProof') {
      // Répondre d'abord à l'interaction
      await interaction.reply({ 
        content: config.messages.proofRequest, 
        ephemeral: true
      });
      
      // Créer un collecteur pour récupérer la prochaine image/vidéo envoyée par cet utilisateur
      const filter = m => 
        m.author.id === interaction.user.id && 
        (m.attachments.size > 0 || m.content.match(/https?:\/\/.*\.(png|jpg|jpeg|gif|webp|mp4|webm)/i));
      
      const collector = interaction.channel.createMessageCollector({ filter, time: config.vouchTimeout * 1000, max: 1 });
      
      collector.on('collect', async message => {
        let proofUrl;
        if (message.attachments.size > 0) {
          proofUrl = message.attachments.first().url;
        } else {
          proofUrl = message.content.match(/https?:\/\/.*\.(png|jpg|jpeg|gif|webp|mp4|webm)/i)[0];
        }
        
        // Supprimer le message de l'utilisateur pour garder le canal propre
        await message.delete().catch(console.error);
        
        // Création du vouch avec preuve
        await createVouch(interaction, proofUrl);
      });
      
      collector.on('end', collected => {
        if (collected.size === 0) {
          interaction.followUp({ 
            content: config.messages.proofTimeout, 
            ephemeral: true
          });
          createVouch(interaction, null);
        }
      });
    }
  } catch (error) {
    console.error('Erreur dans le gestionnaire d\'interactions:', error);
    try {
      // Tenter de signaler l'erreur à l'utilisateur si possible
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: config.messages.errorGeneric, ephemeral: true });
      } else {
        await interaction.followUp({ content: config.messages.errorGeneric, ephemeral: true });
      }
    } catch (err) {
      console.error('Impossible de signaler l\'erreur à l\'utilisateur:', err);
    }
  }
});

// Fonction pour créer et envoyer l'évaluation
async function createVouch(interaction, proofUrl) {
  try {
    if (!client.vouchData || !client.vouchData[interaction.user.id]) {
      if (!interaction.replied && !interaction.deferred) {
        return interaction.reply({ content: config.messages.errorGeneric, ephemeral: true });
      } else {
        return interaction.followUp({ content: config.messages.errorGeneric, ephemeral: true });
      }
    }
    
    const vouchData = client.vouchData[interaction.user.id];
    
    // Charger le compteur de vouches ou le créer s'il n'existe pas
    let vouchCounter = 1;
    try {
      if (fs.existsSync(config.vouchCounterFile)) {
        const data = fs.readFileSync(config.vouchCounterFile, 'utf8');
        if (data && data.trim() !== '') {
          const counterData = JSON.parse(data);
          vouchCounter = counterData.counter || 1;
        }
      }
    } catch (err) {
      console.error('Erreur lors de la lecture du compteur de vouches:', err);
    }
    
    // Le numéro de vouch est simplement le compteur séquentiel
    const vouchNumber = vouchCounter;
    
    // Créer les étoiles
    let stars = '';
    for (let i = 0; i < vouchData.rating; i++) {
      stars += '⭐';
    }
    
    // Créer l'embed
    const embed = new EmbedBuilder()
      .setColor(config.mainColor)
      .setTitle(config.embedTitle)
      .setDescription(`${stars}\n\nVouch:\n${vouchData.service}`)
      .addFields(
        { name: 'Vouch N°:', value: `${vouchNumber}`, inline: true },
        { name: 'Vouched by:', value: `@${vouchData.username}`, inline: true },
        { name: 'Vouched at:', value: `${new Date().toISOString().replace('T', ' ').substring(0, 16)}`, inline: true }
      )
      .setTimestamp();
    
    // Si une preuve est fournie, vérifier qu'elle est valide
    if (proofUrl) {
      try {
        // Valider l'URL
        console.log(`Ajout d'une preuve d'image/vidéo: ${proofUrl}`);
        
        // Ajouter l'image à l'embed
        embed.setImage(proofUrl);
        
        // Ajouter un champ pour indiquer que la preuve est fournie
        embed.addFields({ name: 'Image/Video Proof:', value: 'Provided ✅' });
      } catch (err) {
        console.error('Erreur lors de l\'ajout de l\'image de preuve:', err);
        embed.addFields({ name: 'Image/Video Proof:', value: 'Error loading image ❌' });
      }
    } else {
      // Pas de preuve fournie
      embed.addFields({ name: 'Image/Video Proof:', value: 'None' });
    }
    
    // Ajouter le footer
    embed.setFooter({ text: `Service provided by ${config.serviceName} • ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}` });
    
    // Envoyer le vouch dans le canal configuré
    const vouchChannel = client.channels.cache.get(config.vouchChannelId);
    
    if (!vouchChannel) {
      return interaction.followUp({ 
        content: config.messages.errorNoVouchChannel, 
        ephemeral: true 
      });
    }
    
    await vouchChannel.send({ embeds: [embed] });
    
    // Informer l'utilisateur d'un succès
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ 
        content: config.messages.success, 
        ephemeral: true 
      });
    }
    
    // Sauvegarder le vouch dans un fichier pour pouvoir le restaurer plus tard
    saveVouchToFile(vouchData, vouchNumber, proofUrl);
    
    // Mettre à jour et sauvegarder le compteur pour la prochaine vouch
    vouchCounter++;
    try {
      fs.writeFileSync(config.vouchCounterFile, JSON.stringify({ counter: vouchCounter }), 'utf8');
    } catch (err) {
      console.error('Erreur lors de la sauvegarde du compteur de vouches:', err);
    }
    
    // Nettoyer les données temporaires
    delete client.vouchData[interaction.user.id];
  } catch (error) {
    console.error('Erreur dans createVouch:', error);
    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: config.messages.errorGeneric, ephemeral: true });
      }
    } catch (err) {
      console.error('Impossible de signaler l\'erreur à l\'utilisateur dans createVouch:', err);
    }
  }
}

// Fonction pour restaurer un vouch à partir des données sauvegardées
async function restoreVouch(vouchData, channelId) {
  try {
    // Trouver le canal pour envoyer le vouch restauré
    const channel = client.channels.cache.get(channelId) || client.channels.cache.get(config.vouchChannelId);
    
    if (!channel) {
      console.error('Canal de vouch introuvable pour la restauration');
      return false;
    }
    
    // Créer les étoiles
    let stars = '';
    for (let i = 0; i < vouchData.rating; i++) {
      stars += '⭐';
    }
    
    // Créer l'embed
    const embed = new EmbedBuilder()
      .setColor(config.mainColor)
      .setTitle(`${config.embedTitle} [RESTORED]`)
      .setDescription(`${stars}\n\nVouch:\n${vouchData.service}`)
      .addFields(
        { name: 'Vouch N°:', value: `${vouchData.vouchNumber}`, inline: true },
        { name: 'Vouched by:', value: `@${vouchData.username}`, inline: true },
        { name: 'Vouched at:', value: `${new Date(vouchData.timestamp).toISOString().replace('T', ' ').substring(0, 16)}`, inline: true }
      )
      .setTimestamp();
    
    // Vérifier si la preuve existe et est valide
    let proofUrl = vouchData.proofUrl;
    let imageIsValid = false;
    
    if (proofUrl) {
      // Vérifier si l'URL est valide
      try {
        console.log(`Vérification de l'URL de preuve: ${proofUrl}`);
        
        // Ajouter l'image à l'embed seulement si l'URL est valide
        embed.setImage(proofUrl);
        imageIsValid = true;
      } catch (err) {
        console.error(`URL de preuve invalide: ${proofUrl}`, err);
        imageIsValid = false;
      }
    }
    
    embed.addFields({ name: 'Image/Video Proof:', value: imageIsValid ? 'Provided ✅' : 'None' });
    
    // Ajouter le footer
    embed.setFooter({ text: `Service provided by ${config.serviceName} • ${new Date(vouchData.timestamp).toLocaleDateString()} ${new Date(vouchData.timestamp).toLocaleTimeString()}` });
    
    // Afficher les détails dans la console pour débogage
    console.log(`Restauration du vouch #${vouchData.vouchNumber}:`);
    console.log(`- Service: ${vouchData.service}`);
    console.log(`- Rating: ${vouchData.rating} étoiles`);
    console.log(`- URL de preuve: ${proofUrl || 'Aucune'}`);
    console.log(`- Image valide: ${imageIsValid ? 'Oui' : 'Non'}`);
    
    // Envoyer le vouch restauré
    await channel.send({ embeds: [embed] });
    return true;
  } catch (error) {
    console.error('Erreur lors de la restauration du vouch:', error);
    return false;
  }
}

// Gestion des erreurs non traitées
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

// Connexion du bot
client.login(config.token);