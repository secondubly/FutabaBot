import { ApplyOptions } from '@sapphire/decorators'
import { Command, Args } from '@sapphire/framework'
import { ApplicationCommandType, Message } from 'discord.js'
import type { User } from 'discord.js'
import { isNullishOrEmpty } from '@sapphire/utilities'

@ApplyOptions<Command.Options>({
	description: 'Kicks a user from the sever with an optional reason'
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
			interactionOrMessage instanceof Message ? await args?.repeat('user') : this.parseMembers(interactionOrMessage)
		if (!users) {
			return
		}
	}

	private async parseMembers(interaction: Command.ChatInputCommandInteraction | Command.ContextMenuCommandInteraction): Promise<User[]> {
		const users: User[] = []
		if (interaction.isUserContextMenuCommand()) {
			users.push(interaction.targetUser)
		} else if (interaction.isMessageContextMenuCommand()) {
			users.push(interaction.targetMessage.author)
		} else {
			// is a slash command
			let usersToParse = (interaction as Command.ChatInputCommandInteraction).options.getString('members')?.split(/[\s,]+/)

			if (isNullishOrEmpty(usersToParse)) {
				throw Error('No users provided.')
			}

			// I originally was using a forEach loop here, see an explanation here on why that's a terrilbe idea
			// REF: https://stackoverflow.com/a/37576787
			for (const userID of usersToParse) {
				const strippedUserID = userID.replace(/\D/g, '')
				// Try to get the user from the cache first before fetching
				const user = this.container.client.users.cache.get(strippedUserID) ?? (await this.container.client.users.fetch(strippedUserID))
				users.push(user)
			}
		}
		return users
	}
}
