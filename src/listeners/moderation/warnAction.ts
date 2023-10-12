import { Timestamp } from "#lib/structures/classes/Timestamp";
import { type WarnAction as warnAction } from "#lib/types/Data";
import { FutabaEvents } from "#lib/types/Events";
import { ApplyOptions } from "@sapphire/decorators";
import { Listener } from "@sapphire/framework";
import { GuildMember } from "discord.js";

@ApplyOptions<Listener.Options>({
    event: FutabaEvents.WarnAction
})
export class UserListener extends Listener {
    public override async run(member: GuildMember, severity: number, actions: WarnAction[]) {
        const action = actions.sort((act1, act2) => act2.severity - act1.severity).find((a) => a.severity <= severity)

        if (!action) {
            return
        }

        const data = {
            action: action.action,
            moderator: member.guild.members.me!,
            target: member,
            reason: `Automated Action (Crossed ${action.severity} severity threshold)`,
            duration: action.action === 'timeout' ? new Timestamp(Date.now() + (action as TimeoutWarnAction).expiration) : undefined
        }
    }
}

interface BaseWarnAction {
	action: warnAction;
	severity: number;
}
interface TimeoutWarnAction extends BaseWarnAction {
	action: 'timeout';
	expiration: number;
}
type WarnAction<T extends warnAction = warnAction> = T extends 'timeout' ? TimeoutWarnAction : BaseWarnAction;