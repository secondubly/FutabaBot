import { join } from 'path'
export const rootDir = join(__dirname, '..', '..')
export const srcDir = join(rootDir, 'src')

export const enum Emojis {
	Cross = '<:redCross:1047160911628091402>',
	Confirm = '<:greenTick:832292523418189908>',
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
	Bot = '<:bot:1027129061430013973>',
	SweatSmile = ':sweat_smile:'
}

export const enum WarnSeverity {
	One = '1 day',
	Two = '3 days',
	Three = '1 week',
	Four = '2 weeks',
	Five = '4 weeks'
}

export const enum WarnStatus {
	Active = 'a',
	Inactive = 'd'
}

export const enum Color {
	Core = 0xffa500,
	Moderation = 0x228b22,
	Admin = 0xff6500
}

export enum Severity {
	ban = 0xf80404,
	kick = 0xfb9f06,
	timeout = 0xffcf06,
	softban = 0xfc7c09,
	warn = 0xfcfc7c,
	unban = 0x94ec94,
	warn_remove = 0x21fec0
}