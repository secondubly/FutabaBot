import { ApplyOptions } from '@sapphire/decorators'
import { isStageChannel, isTextChannel } from '@sapphire/discord.js-utilities'
import { Colors, Guild, Message, MessageContextMenuCommandInteraction, PermissionsBitField, Role } from 'discord.js'
import { FutabaCommand } from '#lib/structures'
import type { Args, Command, ContextMenuCommand } from '@sapphire/framework'
// import { ApplicationCommandType } from 'discord.js'

@ApplyOptions<FutabaCommand.Options>({
	aliases: ['smr'],
	description: 'Sets up the mute role for the server.'
})
export class UserCommand extends FutabaCommand {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.setDMPermission(false)
		)
	}

	// Message command
	public async messageRun(message: Message, args: Args) {
		const channel = message.channel
		if (!isTextChannel(channel) || isStageChannel(channel)) {
			return
		}

		this.setupMuteRole(channel.guild)
		// TODO: check if mute role already exists - if so, return a warning
	}

	// Chat Input (slash) command
	public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		this.setupMuteRole(interaction.guild!)
	}

	private async setupMuteRole(guild: Guild) {
		// REF: see https://discordapi.com/permissions.html#67175424 and https://discordjs.guide/popular-topics/permissions.html#converting-permission-numbers
		const mutePermissions = new PermissionsBitField(67175424n)
		const muteRole = await guild.roles.create({
			name: 'muted',
			color: Colors.DarkOrange,
			reason: 'Created by FutabaBot',
			position: 1,
			permissions: mutePermissions
		})

		this.container.settings.updateSetting(guild.id, 'MUTE_ROLE', muteRole.id)
	}
}
