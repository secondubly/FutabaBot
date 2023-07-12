import { ApplyOptions } from '@sapphire/decorators'
import { isStageChannel, isTextChannel } from '@sapphire/discord.js-utilities'
import { ChannelType, Colors, Guild, GuildChannel, Message, PermissionsBitField, TextChannel, VoiceBasedChannel } from 'discord.js'
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
		const muteRole = await this.container.settings.readSettings(interaction.guild.id, MUTE_ROLE)
		const muteRoleInGuild = await interaction.guild.roles.cache.get(muteRole)
		// check to make sure that 
		if (muteRole && muteRoleInGuild) {
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
		const muteRole = await guild.roles.create({
			name: 'muted',
			color: Colors.Orange,
			reason: 'Created by FutabaBot',
			position: 1,
			permissions: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ChangeNickname]
		})


		const textChannels = guild.channels.cache.filter(chan => chan.type === ChannelType.GuildText)
		const voiceChannels = guild.channels.cache.filter(chan => chan.type === ChannelType.GuildVoice || chan.type === ChannelType.GuildStageVoice)
		for (const channel of textChannels.values()) {
			(channel as TextChannel).permissionOverwrites.create(muteRole, {
				SendMessages: false
			})
		}

		for (const channel of voiceChannels.values()) {
			(channel as VoiceBasedChannel).permissionOverwrites.create(muteRole, {
				Speak: false,
				Connect: false
			})
		}
		const setValue = this.container.settings.updateSetting(guild.id, MUTE_ROLE, muteRole.id)
		return setValue === muteRole.id ? true : false
	}
}
