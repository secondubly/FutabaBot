import { GuildMember, User } from "discord.js"
import { Emojis } from "#lib/constants"
import { isAdmin } from "../functions";

/**
 * Check to see if the action is able to be performed on the specified user
 * @param executor User executing the action
 * @param target The member whom the action is being performed on
 * @param action Action that is being executed
 * @returns 
 */
export function runAllChecks(executor: GuildMember, target: GuildMember | User, action: string) {
	let result: boolean;
	let content: string;
	if (target instanceof User) {
		result = true;
		content = '';
	} else if (!target.manageable || isAdmin(target)) {
		result = false;
		content = `${Emojis.Cross} I can't ${action} ${target}`;
	} else if (executor.roles.highest.position === target.roles.highest.position) {
		content = `${Emojis.Cross} You can't ${action} ${target}`;
		result = false;
	} else {
		(result = true), (content = '');
	}
	return { result, content };
}