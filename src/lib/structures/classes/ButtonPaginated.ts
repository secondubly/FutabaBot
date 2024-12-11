import { PaginatedMessage, PaginatedMessageOptions, PaginatedMessagePage } from "@sapphire/discord.js-utilities";
import { ButtonStyle, ComponentType } from "discord.js";
import { Emojis } from "#lib/constants";


/*
REF: https://github.com/EvolutionX-10/Radon/blob/main/src/lib/structures/classes/JustButtons.ts
*/
export class ButtonPaginated extends PaginatedMessage {
    constructor(options: PaginatedMessageOptions = {}) {
        super(options)
        this.setActions([
            {
                customId: '@sapphire/paginated-messages.firstPage',
                style: ButtonStyle.Secondary,
                emoji: Emojis.Backward,
                type: ComponentType.Button,
                run: ({ handler}) => (handler.index= 0)
            },
            {
				customId: '@sapphire/paginated-messages.previousPage',
				style: ButtonStyle.Secondary,
				emoji: Emojis.Left,
				type: ComponentType.Button,
				run: ({ handler }) => {
					if (handler.index === 0) {
						handler.index = handler.pages.length - 1;
					} else {
						--handler.index;
					}
				}
			},
			{
				customId: '@sapphire/paginated-messages.stop',
				style: ButtonStyle.Secondary,
				emoji: Emojis.Stop,
				type: ComponentType.Button,
				run: ({ collector }) => collector.stop()
			},
			{
				customId: '@sapphire/paginated-messages.nextPage',
				style: ButtonStyle.Secondary,
				emoji: Emojis.Right,
				type: ComponentType.Button,
				run: ({ handler }) => {
					if (handler.index === handler.pages.length - 1) {
						handler.index = 0;
					} else {
						++handler.index;
					}
				}
			},
			{
				customId: '@sapphire/paginated-messages.goToLastPage',
				style: ButtonStyle.Secondary,
				emoji: Emojis.Forward,
				type: ComponentType.Button,
				run: ({ handler }) => (handler.index = handler.pages.length - 1)
			}
        ])
    }

    public override addPage(page: PaginatedMessagePage): this {
		this.pages.push(page);
		return this;
	}
}