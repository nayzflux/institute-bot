import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  CategoryChannel,
  ChannelType,
  Client,
  Colors,
  EmbedBuilder,
  GatewayIntentBits,
  GuildForumThreadManager,
  GuildMemberRoleManager,
  ModalBuilder,
  Partials,
  PermissionFlagsBits,
  REST,
  Routes,
  SlashCommandBuilder,
  SlashCommandRoleOption,
  SlashCommandStringOption,
  SlashCommandSubcommandBuilder,
  TextInputBuilder,
  TextInputStyle,
  type MessageActionRowComponentBuilder,
  type RepliableInteraction,
} from "discord.js";

import { env } from "./env";
import { db } from "./lib/db";
import { generateId } from "lucia";

const client = new Client({
  partials: [Partials.GuildMember, Partials.Channel, Partials.Message],
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

// Register commands
const commands = [
  new SlashCommandBuilder()
    .setName("subject")
    .setDescription("Gérer les disciplines")
    .addSubcommand(
      new SlashCommandSubcommandBuilder()
        .setName("add")
        .setDescription("Créer une nouvelle discipline")
    )
    .addSubcommand(
      new SlashCommandSubcommandBuilder()
        .setName("remove")
        .setDescription("Supprimer une nouvelle discipline")
        .addStringOption(
          new SlashCommandStringOption()
            .setName("subject")
            .setDescription("Le nom de la discipline que vous voulez supprimer")
        )
    )
    .toJSON(),
  new SlashCommandBuilder()
    .setName("role")
    .setDescription("Gérer les rôles")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(
      new SlashCommandSubcommandBuilder()
        .setName("teacher")
        .setDescription("Modifier le rôle d'enseignant")
        .addRoleOption(
          new SlashCommandRoleOption()
            .setName("role")
            .setDescription("Le rôle à definir en tant que rôle d'enseignant")
        )
    )
    .addSubcommand(
      new SlashCommandSubcommandBuilder()
        .setName("director")
        .setDescription("Modifier le rôle directeur")
        .addRoleOption(
          new SlashCommandRoleOption()
            .setName("role")
            .setDescription("Le rôle à definir en tant que rôle de directeur")
        )
    )
    .toJSON(),
];

const rest = new REST({ version: "10" }).setToken(env.DISCORD_TOKEN);

try {
  console.log("Started refreshing application (/) commands.");

  await rest.put(Routes.applicationCommands(env.DISCORD_CLIENT_ID), {
    body: commands,
  });

  await rest.put(
    Routes.applicationGuildCommands(
      env.DISCORD_CLIENT_ID,
      "1241810705167159368"
    ),
    {
      body: commands,
    }
  );

  console.log("Successfully reloaded application (/) commands.");
} catch (error) {
  console.error(error);
}

client.on("ready", () => {
  db.guild.upsert({
    where: {
      id: "1241810705167159368",
    },
    create: {
      id: "1241810705167159368",
    },
    update: {},
  });

  console.log(`Logged in!`);
});

client.on("interactionCreate", async (interaction) => {
  // If not guild command
  if (!interaction.guild) {
    if (interaction.isRepliable()) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder({
            author: {
              name: `❌ Erreur:`,
            },
            description: `Vous devez être dans un serveur pour utiliser les commandes !`,
            color: Colors.Red,
          }),
        ],
      });
    }

    return;
  }

  if (interaction.isModalSubmit()) {
    /**
     * Subject Add Modal
     */
    if (interaction.customId === "subject-add") {
      const name = interaction.fields.getField("name");
      const rules = interaction.fields.getField("rules");
      const description = interaction.fields.getField("description");

      await interaction.reply("⏳ **Merci de patienter quelques instants...**");

      console.log("sbadd");

      // Create rôle
      try {
        const teacherRole = await interaction.guild.roles.create({
          name: `Prof de ${name.value}`,
        });

        const studentRole = await interaction.guild.roles.create({
          name: `Elève de ${name.value}`,
        });

        // Créer les salons
        const category = await interaction.guild.channels.create({
          name: `🔥╎${name.value}`,
          type: ChannelType.GuildCategory,
          permissionOverwrites: [
            {
              id: interaction.guild.id,
              deny: [PermissionFlagsBits.ViewChannel],
            },
            {
              id: studentRole.id,
              allow: [PermissionFlagsBits.ViewChannel],
              deny: [
                PermissionFlagsBits.CreatePublicThreads,
                PermissionFlagsBits.CreatePrivateThreads,
                PermissionFlagsBits.SendMessagesInThreads,
              ],
            },
            {
              id: teacherRole.id,
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.ManageMessages,
                PermissionFlagsBits.ManageThreads,
                PermissionFlagsBits.CreatePublicThreads,
                PermissionFlagsBits.CreatePrivateThreads,
                PermissionFlagsBits.SendMessagesInThreads,
                PermissionFlagsBits.AttachFiles,
                PermissionFlagsBits.EmbedLinks,
                PermissionFlagsBits.MoveMembers,
                PermissionFlagsBits.CreateEvents,
              ],
            },
          ],
        });

        const courses = await interaction.guild.channels.create({
          name: "📖╎cours",
          parent: category.id,
          type: ChannelType.GuildForum,
          permissionOverwrites: [
            {
              id: interaction.guild.id,
              deny: [PermissionFlagsBits.ViewChannel],
            },
            {
              id: studentRole.id,
              allow: [PermissionFlagsBits.ViewChannel],
              deny: [
                PermissionFlagsBits.CreatePublicThreads,
                PermissionFlagsBits.CreatePrivateThreads,
                PermissionFlagsBits.SendMessagesInThreads,
              ],
            },
            {
              id: teacherRole.id,
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.ManageMessages,
                PermissionFlagsBits.ManageThreads,
                PermissionFlagsBits.CreatePublicThreads,
                PermissionFlagsBits.CreatePrivateThreads,
                PermissionFlagsBits.SendMessagesInThreads,
                PermissionFlagsBits.AttachFiles,
                PermissionFlagsBits.EmbedLinks,
                PermissionFlagsBits.MoveMembers,
              ],
            },
          ],
        });

        const help = await interaction.guild.channels.create({
          name: "🤝╎entraide",
          parent: category.id,
          permissionOverwrites: [
            {
              id: interaction.guild.id,
              deny: [PermissionFlagsBits.ViewChannel],
            },
            {
              id: studentRole.id,
              allow: [PermissionFlagsBits.ViewChannel],
              deny: [
                PermissionFlagsBits.CreatePublicThreads,
                PermissionFlagsBits.CreatePrivateThreads,
                PermissionFlagsBits.SendMessagesInThreads,
              ],
            },
            {
              id: teacherRole.id,
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.ManageMessages,
                PermissionFlagsBits.ManageThreads,
                PermissionFlagsBits.CreatePublicThreads,
                PermissionFlagsBits.CreatePrivateThreads,
                PermissionFlagsBits.SendMessagesInThreads,
                PermissionFlagsBits.AttachFiles,
                PermissionFlagsBits.EmbedLinks,
                PermissionFlagsBits.MoveMembers,
              ],
            },
          ],
        });

        const pause = await interaction.guild.channels.create({
          name: "🪸╎récréation",
          parent: category.id,
          permissionOverwrites: [
            {
              id: interaction.guild.id,
              deny: [PermissionFlagsBits.ViewChannel],
            },
            {
              id: studentRole.id,
              allow: [PermissionFlagsBits.ViewChannel],
              deny: [
                PermissionFlagsBits.CreatePublicThreads,
                PermissionFlagsBits.CreatePrivateThreads,
                PermissionFlagsBits.SendMessagesInThreads,
              ],
            },
            {
              id: teacherRole.id,
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.ManageMessages,
                PermissionFlagsBits.ManageThreads,
                PermissionFlagsBits.CreatePublicThreads,
                PermissionFlagsBits.CreatePrivateThreads,
                PermissionFlagsBits.SendMessagesInThreads,
                PermissionFlagsBits.AttachFiles,
                PermissionFlagsBits.EmbedLinks,
                PermissionFlagsBits.MoveMembers,
              ],
            },
          ],
        });

        await interaction.guild.channels.create({
          name: "🔊╎Récreation",
          type: ChannelType.GuildVoice,
          parent: category.id,
          permissionOverwrites: [
            {
              id: interaction.guild.id,
              deny: [PermissionFlagsBits.ViewChannel],
            },
            {
              id: studentRole.id,
              allow: [PermissionFlagsBits.ViewChannel],
              deny: [
                PermissionFlagsBits.CreatePublicThreads,
                PermissionFlagsBits.CreatePrivateThreads,
                PermissionFlagsBits.SendMessagesInThreads,
              ],
            },
            {
              id: teacherRole.id,
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.ManageMessages,
                PermissionFlagsBits.ManageThreads,
                PermissionFlagsBits.CreatePublicThreads,
                PermissionFlagsBits.CreatePrivateThreads,
                PermissionFlagsBits.SendMessagesInThreads,
                PermissionFlagsBits.AttachFiles,
                PermissionFlagsBits.EmbedLinks,
                PermissionFlagsBits.MoveMembers,
              ],
            },
          ],
        });

        await interaction.guild.channels.create({
          name: "💼╎Bureau du Prof",
          type: ChannelType.GuildVoice,
          parent: category.id,
          permissionOverwrites: [
            {
              id: interaction.guild.id,
              deny: [PermissionFlagsBits.ViewChannel],
            },
            {
              id: studentRole.id,
              allow: [PermissionFlagsBits.ViewChannel],
              deny: [
                PermissionFlagsBits.CreatePublicThreads,
                PermissionFlagsBits.CreatePrivateThreads,
                PermissionFlagsBits.SendMessagesInThreads,
                PermissionFlagsBits.Connect,
              ],
            },
            {
              id: teacherRole.id,
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.ManageMessages,
                PermissionFlagsBits.ManageThreads,
                PermissionFlagsBits.CreatePublicThreads,
                PermissionFlagsBits.CreatePrivateThreads,
                PermissionFlagsBits.SendMessagesInThreads,
                PermissionFlagsBits.AttachFiles,
                PermissionFlagsBits.EmbedLinks,
                PermissionFlagsBits.MoveMembers,
              ],
            },
          ],
        });

        const stage = await interaction.guild.channels.create({
          name: "🏦╎L'amphi",
          type: ChannelType.GuildStageVoice,
          parent: category.id,
          permissionOverwrites: [
            {
              id: interaction.guild.id,
              deny: [PermissionFlagsBits.ViewChannel],
            },
            {
              id: studentRole.id,
              allow: [PermissionFlagsBits.ViewChannel],
              deny: [
                PermissionFlagsBits.CreatePublicThreads,
                PermissionFlagsBits.CreatePrivateThreads,
                PermissionFlagsBits.SendMessagesInThreads,
              ],
            },
            {
              id: teacherRole.id,
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.AttachFiles,
                PermissionFlagsBits.EmbedLinks,
                PermissionFlagsBits.MoveMembers,
                PermissionFlagsBits.MuteMembers,
                PermissionFlagsBits.ManageMessages,
                PermissionFlagsBits.ManageChannels,
              ],
            },
          ],
        });

        console.log("created");

        // Send onboarding channel message
        pause.send({
          embeds: [
            new EmbedBuilder()
              .setAuthor({ name: "Récréation" })
              .setColor(Colors.Blue)
              .setDescription("Ce salon est destiné à la détente entre eleves"),
          ],
        });

        help.send({
          embeds: [
            new EmbedBuilder()
              .setAuthor({ name: "Entre-Aides" })
              .setColor(Colors.Blue)
              .setDescription("Ce salon est destiné à l'entre aides"),
          ],
        });

        if (!interaction.member) return;

        // Add teacher role to teacher
        if (interaction.member.roles instanceof GuildMemberRoleManager) {
          interaction.member.roles.add(teacherRole.id);
        }

        console.log("before cnf");

        // Poster le message de canditature
        const config = await db.guild.findFirst({
          where: {
            id: interaction.guild.id,
          },
        });

        console.log("after cnf");

        if (!config?.canditatureChannelId) {
          return errorMessage(
            interaction,
            "Le salon de candidature présentant l'ensemble des discipline n'est pas définie."
          );
        }

        const candidatureChannel = await interaction.guild.channels.fetch(
          config.canditatureChannelId
        );

        if (!candidatureChannel) {
          return errorMessage(
            interaction,
            "Le salon de candidature présentant l'ensemble des disciplines n'existe plus."
          );
        }

        if (candidatureChannel.type !== ChannelType.GuildForum) {
          return errorMessage(
            interaction,
            "Le salon de candidature présentant l'ensemble des disciplines n'est pas du type Forum."
          );
        }

        console.log("channel");

        const subjectEmbed = new EmbedBuilder()
          .setAuthor({ name: `📌╎${name.value}` })
          .setDescription(`${description.value}`)
          .setFooter({ text: "Clique sur Canditater pour candidater" });

        const button = new ButtonBuilder()
          .setCustomId("candidate")
          .setStyle(ButtonStyle.Secondary)
          .setLabel("Candidater");

        const row =
          new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
            button
          );

        const candidatureMessage = await candidatureChannel.threads.create({
          name: name.value,
          message: {
            embeds: [subjectEmbed],
            components: [row],
            content: `**__📜 Règlement de la discipline ${name.value}:__**\n \n${rules.value}\n \n⚠️ En cliquant sur candidater vous vous déclarer avoir compris et vous vous engagez à le respecter.`,
          },
        });

        // Insert subject in database
        const subjectId = "subject_" + generateId(16);

        await db.subject.create({
          data: {
            id: subjectId,
            subjectName: name.value,
            teacherRoleId: teacherRole.id,
            sudentRoleId: studentRole.id,
            categoryChannelId: category.id,
            candidatureMessageId: candidatureMessage.id,
            guildId: interaction.guild.id,
          },
        });

        console.log(interaction.isRepliable());

        console.log("create");

        return interaction.editReply({
          content: "",
          embeds: [
            new EmbedBuilder({
              author: {
                name: `✅ Nouvelle discipline:`,
              },
              description: `La discipline ${name.value} à bien été créer !`,
              color: Colors.Green,
              fields: [
                {
                  name: "Rôle Professeur:",
                  value: `${teacherRole}`,
                },
                {
                  name: "Rôle Elève:",
                  value: `${studentRole}`,
                },
              ],
            }),
          ],
        });
      } catch (err) {
        console.error(err);

        return errorMessage(
          interaction,
          "Impossible de créer la discipline. Vérifiez que le bot possèdes les permissions de créer des rôles et des salons."
        );
      }

      return;
    }

    return;
  }

  if (interaction.isButton()) {
    console.log("btn");

    if (interaction.customId === "candidate") {
      // Créer le salon de ticket
      const subject = await db.subject.findFirst({
        where: {
          candidatureMessageId: interaction.message.id,
        },
      });

      if (!subject)
        return errorMessage(interaction, "Cette discipline n'existe plus !");

      const ticket = await interaction.guild.channels.create({
        name: `⏳╎candidature-${interaction.member?.user.username}`,
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: interaction.member?.user.id || "",
            allow: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: subject.teacherRoleId,
            allow: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: subject.sudentRoleId,
            deny: [PermissionFlagsBits.ViewChannel],
          },
        ],
        parent: subject.categoryChannelId,
      });

      await interaction.reply({
        ephemeral: true,
        content: "Votre candidature à bien été prise en compte " + ticket,
      });

      const teacherRole = await interaction.guild.roles.fetch(
        subject.teacherRoleId
      );

      if (!teacherRole)
        return errorMessage(
          interaction,
          "Le rôle d'enseignant de cette discipline n'existe plus !"
        );

      // const teacher = teacherRole.members.first();

      // if (!teacher)
      //   return errorMessage(
      //     interaction,
      //     "Aucun enseignant n'est assigné à cette discipline !"
      //   );

      const acceptButton = new ButtonBuilder()
        .setCustomId("candidate-accept")
        .setLabel("Accepter")
        .setStyle(ButtonStyle.Success);

      const denyButton = new ButtonBuilder()
        .setCustomId("candidate-deny")
        .setLabel("Rejeter")
        .setStyle(ButtonStyle.Danger);

      const row =
        new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
          acceptButton,
          denyButton
        );

      const controlMessage = await ticket?.send({
        embeds: [
          new EmbedBuilder()
            .setAuthor({ name: "Candidature ouverte" })
            .setDescription(
              "La candidature a été ouverte, vous pouvez vous entrenir avec le professeur"
            )
            .addFields(
              {
                name: "Elève:",
                value: `${interaction.member?.user}`,
              },
              {
                name: "Professeur:",
                value: `${teacherRole}`,
              }
            ),
        ],
        content: `${interaction.member?.user}`,
        components: [row],
      });

      await db.candidature.create({
        data: {
          id: "c_" + generateId(16),
          applierUserId: interaction.user.id,
          controlMessageId: controlMessage?.id || "",
          status: "PENDING",
          subjectId: subject.id,
        },
      });
    }

    if (interaction.customId === "candidate-deny") {
      // Check if allowed
      const candidate = await db.candidature.findFirst({
        where: {
          controlMessageId: interaction.message.id,
        },
        include: {
          subject: true,
        },
      });

      if (!candidate)
        return errorMessage(interaction, "Cette candidature n'existe plus !");

      // Check pers
      const roles = interaction.member?.roles;

      let isAllowed = false;

      if (roles instanceof Array) {
        if (roles.includes(candidate.subject.teacherRoleId)) {
          isAllowed = true;
        }
      }

      if (roles instanceof GuildMemberRoleManager) {
        const role = await interaction.guild.roles.fetch(
          candidate.subject.teacherRoleId
        );

        if (role?.members.has(interaction.user.id)) {
          isAllowed = true;
        }
      }

      if (!interaction.memberPermissions?.has("ManageChannels") && !isAllowed)
        return errorMessage(
          interaction,
          "Vous n'avez pas la permission d'effectuer cette action !"
        );

      interaction.channel
        ?.delete()
        .catch((err) => console.log("Cant delete channel"));

      // Update status
      await db.candidature.update({
        where: {
          id: candidate.id,
        },
        data: {
          status: "REJECTED",
        },
      });
    }

    if (interaction.customId === "candidate-accept") {
      // Check if allowed
      const candidate = await db.candidature.findFirst({
        where: {
          controlMessageId: interaction.message.id,
        },
        include: { subject: true },
      });

      if (!candidate)
        return errorMessage(interaction, "Cette candidature n'existe plus !");

      // Check pers
      const roles = interaction.member?.roles;

      let isAllowed = false;

      if (roles instanceof Array) {
        if (roles.includes(candidate.subject.teacherRoleId)) {
          isAllowed = true;
          console.log("allowed");
        }
      }

      if (roles instanceof GuildMemberRoleManager) {
        const role = await interaction.guild.roles.fetch(
          candidate.subject.teacherRoleId
        );

        if (role?.members.has(interaction.user.id)) {
          isAllowed = true;
        }
      }

      if (!interaction.memberPermissions?.has("ManageChannels") && !isAllowed)
        return errorMessage(
          interaction,
          "Vous n'avez pas la permission d'effectuer cette action !"
        );

      const applier = await interaction.guild.members.fetch(
        candidate.applierUserId
      );

      applier?.roles
        .add(candidate.subject.sudentRoleId)
        .catch((err) => console.log("Unable to add role"));

      interaction.channel
        ?.delete()
        .catch((err) => console.log("Cant delete channel"));

      applier
        ?.send("Votre candidature a été accepté")
        .catch((err) => console.log("Unable to send dm"));

      // Update status
      await db.candidature.update({
        where: {
          id: candidate.id,
        },
        data: {
          status: "SUCCEED",
        },
      });
    }
  }

  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "role") {
    const subcommand = interaction.options.getSubcommand();
    const role = interaction.options.getRole("role");

    if (!interaction.memberPermissions?.has("Administrator"))
      return errorMessage(
        interaction,
        "Vous n'avez pas la permission d'effectuer cette action !"
      );

    if (!role) return errorMessage(interaction, "Ce rôle n'existe pas !");

    if (subcommand === "teacher") {
      const config = await db.guild.upsert({
        where: {
          id: interaction.guild.id,
        },
        create: {
          id: interaction.guild.id,
          teacherRoleId: role.id,
        },
        update: {
          teacherRoleId: role.id,
        },
      });

      return interaction.reply({
        embeds: [
          new EmbedBuilder({
            author: {
              name: "✅ Rôle d'enseignant mis à jour:",
            },
            description:
              "Le rôle d'enseignant est désormais <@#" +
              config.teacherRoleId +
              ">.",
          }),
        ],
      });
    }

    if (subcommand === "director") {
      const config = await db.guild.upsert({
        where: {
          id: interaction.guild.id,
        },
        create: {
          id: interaction.guild.id,
          directorRoleId: role.id,
        },
        update: {
          directorRoleId: role.id,
        },
      });

      return interaction.reply({
        embeds: [
          new EmbedBuilder({
            author: {
              name: "✅ Rôle de directeur mis à jour:",
            },
            description:
              "Le rôle de directeur est désormais <@#" +
              config.directorRoleId +
              ">.",
          }),
        ],
      });
    }
  }

  if (interaction.commandName === "subject") {
    const subcommand = interaction.options.getSubcommand();

    const config = await db.guild.findFirst({
      where: {
        id: interaction.guild.id,
      },
    });

    if (!config?.teacherRoleId)
      return errorMessage(
        interaction,
        "Le rôle d'enseignant n'est pas définie !"
      );

    // Check pers
    const roles = interaction.member?.roles;

    let isAllowed = false;

    if (roles instanceof Array) {
      if (roles.includes(config.teacherRoleId)) {
        isAllowed = true;
      }
    }

    if (roles instanceof GuildMemberRoleManager) {
      const role = await interaction.guild.roles.fetch(config.teacherRoleId);

      if (role?.members.has(interaction.user.id)) {
        isAllowed = true;
      }
    }

    if (!interaction.memberPermissions?.has("Administrator") && !isAllowed)
      return errorMessage(
        interaction,
        "Vous n'avez pas la permission d'effectuer cette action !"
      );

    if (subcommand === "add") {
      const modal = new ModalBuilder()
        .setCustomId("subject-add")
        .setTitle("Créer une nouvelle discipline");

      const nameInput = new TextInputBuilder()
        .setCustomId("name")
        .setLabel("Nom")
        .setStyle(TextInputStyle.Short);

      const descriptionInput = new TextInputBuilder()
        .setCustomId("description")
        .setLabel("Description")
        .setStyle(TextInputStyle.Paragraph);

      const rulesInput = new TextInputBuilder()
        .setCustomId("rules")
        .setLabel("Règles")
        .setStyle(TextInputStyle.Paragraph);

      const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(
        nameInput
      );

      const row2 = new ActionRowBuilder<TextInputBuilder>().addComponents(
        descriptionInput
      );

      const row3 = new ActionRowBuilder<TextInputBuilder>().addComponents(
        rulesInput
      );

      modal.setComponents(row1, row2, row3);

      await interaction.showModal(modal);
    }

    if (subcommand === "remove") {
      const subjectName = interaction.options.getString("subject");

      if (!subjectName)
        return errorMessage(
          interaction,
          "Merci de fournir un nom de discipline !"
        );

      const subject = await db.subject.findFirst({
        where: {
          subjectName: subjectName,
          guildId: interaction.guild.id,
        },
        include: {
          guild: true,
        },
      });

      if (!subject)
        return errorMessage(interaction, "Cette discipline est introuvable !");

      await db.subject.delete({
        where: {
          id: subject?.id,
        },
      });

      const candidatureChannel = await interaction.guild.channels.fetch(
        subject.guild.canditatureChannelId
      );

      if (
        candidatureChannel &&
        candidatureChannel.type === ChannelType.GuildForum
      ) {
        const candidatureMsg = await candidatureChannel.messages.fetch(
          subject.candidatureMessageId
        );

        if (candidatureMsg) {
          candidatureMsg.thread
            ?.delete()
            .catch((err) => console.log("Cant delete thread"));
        }
      }

      const categoryChannel = await interaction.guild.channels.fetch(
        subject.categoryChannelId
      );

      const teacherRole = await interaction.guild.roles.fetch(
        subject.teacherRoleId
      );
      const studentRole = await interaction.guild.roles.fetch(
        subject.sudentRoleId
      );

      if (teacherRole) {
        teacherRole.delete().catch((e) => console.log("Cant delete role"));
      }

      if (studentRole) {
        studentRole.delete().catch((e) => console.log("Cant delete role"));
      }

      if (categoryChannel instanceof CategoryChannel) {
        categoryChannel.children.cache.forEach((child) =>
          child.delete().catch((e) => console.log("Cant delete channel"))
        );

        categoryChannel
          .delete()
          .catch((e) => console.log("Cant delete channel"));
      }

      return interaction.reply({
        embeds: [
          new EmbedBuilder({
            author: {
              name: "✅ Discipline supprimé:",
            },
            description:
              "La discipline " +
              subject.subjectName +
              " a été supprimé avec succès !",
          }),
        ],
      });
    }
  }
});

const errorMessage = (interaction: RepliableInteraction, message: string) => {
  console.log("err msg");

  if (interaction.replied) {
    return interaction.editReply({
      embeds: [
        new EmbedBuilder({
          author: {
            name: `❌ Erreur:`,
          },
          description: message,
          color: Colors.Red,
        }),
      ],
    });
  } else {
    return interaction.reply({
      ephemeral: true,
      embeds: [
        new EmbedBuilder({
          author: {
            name: `❌ Erreur:`,
          },
          description: message,
          color: Colors.Red,
        }),
      ],
    });
  }
};

client.login(env.DISCORD_TOKEN);
