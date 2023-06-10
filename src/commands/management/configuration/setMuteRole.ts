import { ApplyOptions } from '@sapphire/decorators'
import { isStageChannel, isTextChannel } from '@sapphire/discord.js-utilities'
import { Colors, Guild, Message, PermissionsBitField } from 'discord.js'
import { FutabaCommand } from '#lib/structures'
import type { Command } from '@sapphire/framework'

const MUTE_ROLE = 'MUTE_ROLE'

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

	public async messageRun(message: Message) {
		const channel = message.channel
		if (!isTextChannel(channel) || isStageChannel(channel)) {
			return
		}

		const roleExists = await this.container.settings.hasSetting(channel.guild.id, MUTE_ROLE)
		if (roleExists) {
			channel?.send({ content: 'Mute role has already been set up.' })
			return
		}

		const success = await this.setupMuteRole(channel.guild)
		if (!success) {
			channel?.send({ content: 'Something went wrong! Please try again.'})
		}

		channel?.send({ content: 'Mute role successfully created.' })
	}

	public async chatInputRun(interaction: Command.ChatInputCommandInteraction<'cached'>) {
		const roleExists = await this.container.settings.hasSetting(interaction.guild.id, MUTE_ROLE)
		if (roleExists) {
			interaction.reply({content: 'Mute role has already been set up.'})
			return
		}

		await interaction.deferReply({ fetchReply: true })
		const success = await this.setupMuteRole(interaction.guild)
		if (!success) {
			interaction.editReply({content: 'Something went wrong! Please try again.'})
		}

		interaction.editReply({content: 'Mute role successfully created.'})
	}

	private async setupMuteRole(guild: Guild): Promise<boolean> {
		// REF: see https://discordapi.com/permissions.html#67175424 and https://discordjs.guide/popular-topics/permissions.html#converting-permission-numbers
		const mutePermissions = new PermissionsBitField(67175424n)
		const muteRole = await guild.roles.create({
			name: 'muted',
			color: Colors.Orange,
			reason: 'Created by FutabaBot',
			position: 1,
			permissions: mutePermissions
		})

		const setValue = this.container.settings.updateSetting(guild.id, MUTE_ROLE, muteRole.id)
		return setValue === muteRole.id ? true : false
	}
}
