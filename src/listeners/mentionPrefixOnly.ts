import type { Events } from '@sapphire/framework';
import { isStageChannel, isTextChannel } from '@sapphire/discord.js-utilities';
import { Listener } from '@sapphire/framework';
import type { Message } from 'discord.js';

export class UserEvent extends Listener<typeof Events.MentionPrefixOnly> {
	public async run(message: Message) {
		const prefix = this.container.client.options.defaultPrefix;
		if(!isTextChannel(message.channel) || isStageChannel(message.channel)) {
			return
		}
		return message.channel.send(prefix ? `My prefix in this guild is: \`${prefix}\`` : 'Cannot find any Prefix for Message Commands.');
	}
}
