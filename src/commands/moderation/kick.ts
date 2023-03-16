import { ApplyOptions } from '@sapphire/decorators'
import { Command, Args } from '@sapphire/framework'
import { ApplicationCommandType, EmbedBuilder, Message } from 'discord.js'
import type { User, GuildMember } from 'discord.js'
import { isNullishOrEmpty, isNullOrUndefinedOrEmpty } from '@sapphire/utilities'
import { isStageChannel, isTextChannel } from '@sapphire/discord.js-utilities'

@ApplyOptions<Command.Options>({
	description: 'Kicks a user from the sever with an optional reason',
	requiredClientPermissions: ['KickMembers'],
	aliases: ['k'],
	typing: true
})
export class UserCommand extends Command {
	// Register Chat Input and Context Menu command
	public override registerApplicationCommands(registry: Command.Registry) {
		// Register Chat Input command
		registry.registerChatInputCommand((builder) =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addStringOption((option) => option.setName('members').setDescription('Users to kick.').setRequired(true))
				.addStringOption((option) => option.setName('reason').setDescription('Reason why the users were kicked.'))
		)

		// Register Context Menu command available from any message
		registry.registerContextMenuCommand((builder) => builder.setName(this.name).setType(ApplicationCommandType.Message))

		// Register Context Menu command available from any user
		registry.registerContextMenuCommand((builder) => builder.setName(this.name).setType(ApplicationCommandType.User))
	}

	// Message command
	public async messageRun(message: Message, args: Args) {
		return this.kickUser(message, args)
	}

	// Chat Input (slash) command
	public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		return this.kickUser(interaction)
	}

	// Context Menu command
	public async contextMenuRun(interaction: Command.ContextMenuCommandInteraction) {
		return this.kickUser(interaction)
	}

	private async kickUser(interactionOrMessage: Message | Command.ChatInputCommandInteraction | Command.ContextMenuCommandInteraction, args?: Args) {
		// if we have an args value, then parse as many members as possible
		const users: Promise<User[]> | User[] | undefined =
			interactionOrMessage instanceof Message ? await args?.repeat('user') : await this.parseMembers(interactionOrMessage)
		if (isNullOrUndefinedOrEmpty(users)) {
			// TODO: spit back an error message
			if (interactionOrMessage instanceof Message) {
				// if this was a message command, we want to send back an embed response with an error
				const channel = interactionOrMessage.channel

				if (!isTextChannel(channel) || isStageChannel(channel)) {
					return
				}

				const errorEmbed = new EmbedBuilder()
					.setColor(0x800000)
					.setDescription(`${interactionOrMessage.member}, You provided invalid input, please check your input and try again.`)

				channel.send({ embeds: [errorEmbed] })
			} else {
				// TODO: generic error response
				interactionOrMessage.reply({ content: 'You provided invalid input, please check your input and try again.', ephemeral: true })
			}
			return
		}

		const guild = interactionOrMessage.guild
		if (!guild) {
			// TODO something went wrong, return early
		}

		// TODO: Do some request batching here - maybe 10 at a time?
		const kickPromises: Promise<string | User | GuildMember>[] = []
		for (const user of users!) {
			kickPromises.push(guild!.members.kick(user))
		}

		await Promise.allSettled(kickPromises).catch((err) => {
			console.error(err)
			console.log('some promises failed to resolve')
			throw err
		})
	}

	private async parseMembers(interaction: Command.ChatInputCommandInteraction | Command.ContextMenuCommandInteraction): Promise<User[]> {
		const users: User[] = []
		if (interaction.isUserContextMenuCommand()) {
			users.push(interaction.targetUser)
		} else if (interaction.isMessageContextMenuCommand()) {
			users.push(interaction.targetMessage.author)
		} else {
			// is a slash command
			const usersToParse = (interaction as Command.ChatInputCommandInteraction).options.getString('members')?.split(/[\s,]+/)

			if (isNullishOrEmpty(usersToParse)) {
				throw Error('No users provided.')
			}

			// I originally was using a forEach loop here, see an explanation here on why that's a terrilbe idea
			// REF: https://stackoverflow.com/a/37576787
			for (const userID of usersToParse) {
				const strippedUserID = userID.replace(/\D/g, '')
				if (isNullishOrEmpty(strippedUserID)) {
					continue
				}

				console.log(await this.container.client.users.fetch(strippedUserID))
				const user = await this.container.client.users.fetch(strippedUserID).catch((err) => {
					console.error(err)
					throw err
				})

				console.log(user)
				if (user) {
					users.push(user)
				}
			}
		}
		return users
	}
}
