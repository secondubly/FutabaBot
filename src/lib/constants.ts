import { join } from 'path'
export const rootDir = join(__dirname, '..', '..')
export const srcDir = join(rootDir, 'src')


export const enum Emojis {
    Cross = '<:redCross:957909502911471636>',
	Confirm = '<:greenTick:957909436477878302>',
	Left = '<:arrow_lilleft:959362275171508234>',
	Right = '<:arrow_lilright:959363096781148160>',
	Backward = '<:arrow_left_r:959362559595655179>',
	Forward = '<:arrow_right_r:959361662064930827>',
	Stop = '<:radon_stop:959386465807265794>',
	Owner = '<:owner:1026798797839409173>',
	TextChannel = '<:text:1027126127690514462>',
	CategoryChannel = '<:category:1027126168949895198>',
	VoiceChannel = '<:vc:1027126195067826196>',
	ThreadChannel = '<:thread:1027126259328749598>',
	Member = '<:member:1027127446006419506>',
	Bot = '<:bot:1027129061430013973>'
}