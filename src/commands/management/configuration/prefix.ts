import { FutabaCommand } from '#lib/structures'
import { ApplyOptions } from '@sapphire/decorators'
import { isStageChannel, isTextChannel } from '@sapphire/discord.js-utilities'
import type { Args, Command, SapphirePrefix } from '@sapphire/framework'
import type { Message } from 'discord.js'

@ApplyOptions<FutabaCommand.Options>({
	description: 'Set message prefix, or display the current prefix.'
})
export class UserCommand extends FutabaCommand {
	public override registerApplicationCommands(registry: Command.Registry) {
		// Register Chat Input command
		registry.registerChatInputCommand((builder) =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addStringOption((option) => option.setName('prefix').setDescription('The new prefix for messages').setRequired(false))
				.setDMPermission(false)
		)
	}

	public async messageRun(message: Message, args: Args) {
		if (!isTextChannel(message.channel) || isStageChannel(message.channel)) {
			return
		}
		const newPrefix = await args.pick('string').catch(() => undefined)
		if (!newPrefix) {
			const currentPrefix = await this.container.client.fetchPrefix(message)

			if (!currentPrefix) {
				// TODO: error-handling
				return
			}

			message.channel.send(`My current prefix is: ${currentPrefix}`)
		}
	}

	// Chat Input (slash) command
	public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const newPrefix = interaction.options.getString('prefix')
		if (!newPrefix) {
			// @ts-ignore: Argument of type <whatever> is not assignable to parameter of type
			const currentPrefix = await this.container.client.fetchPrefix(interaction)
			if (!currentPrefix) {
				// TODO: error-handling
				return
			}

			interaction.reply({ content: `My current prefix is ${currentPrefix}` })
			return
		}
	}
}
