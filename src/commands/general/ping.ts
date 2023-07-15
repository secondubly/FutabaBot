import { ApplyOptions } from '@sapphire/decorators'
import { isStageChannel, isTextChannel } from '@sapphire/discord.js-utilities'
import { Message } from 'discord.js'
import { FutabaCommand } from '#lib/structures'
import type { Command } from '@sapphire/framework'
// import { ApplicationCommandType } from 'discord.js'

@ApplyOptions<FutabaCommand.Options>({
	description: 'ping pong'
})
export class UserCommand extends FutabaCommand {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName(this.name)
				.setDescription(this.description)
		)
	}

	// Message command
	public async messageRun(message: Message) {
		return this.sendPing(message)
	}

	// Chat Input (slash) command
	public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		return this.sendPing(interaction)
	}

	private async sendPing(interactionOrMessage: Message | Command.ChatInputCommandInteraction) {
		const channel = interactionOrMessage.channel
		if (!isTextChannel(channel) || isStageChannel(channel)) {
			return
		}

		const pingMessage =
			interactionOrMessage instanceof Message
				? await channel?.send({ content: 'Ping?' })
				: await interactionOrMessage.reply({ content: 'Ping?', fetchReply: true })

		const content = `Pong! Bot Latency ${Math.round(this.container.client.ws.ping)}ms. API Latency ${
			pingMessage.createdTimestamp - interactionOrMessage.createdTimestamp
		}ms.`

		if (interactionOrMessage instanceof Message) {
			return pingMessage.edit({ content })
		}

		return interactionOrMessage.editReply({
			content: content
		})
	}
}
