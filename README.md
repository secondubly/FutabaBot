# FutabaBot

A personal use discord bot written by myself. Built on top of the [sapphire framework][sapphire] and written in TypeScript.

## How to use it?

TODO

### Prerequisites

-   [Node.js][nodejs]
-   [PostgreSQL][postgres]
-   [Prisma][prisma]

```sh
npm install
```

### Development

You have two options for development with this bot. You may choose to use the Docker setup (recommended) or develop directly via your IDE/editor of choice. Please note that support for developing outside of Docker may be limited. Instructions for each are as follows:

## Docker

1. [Create a discord application][discord_app_getting_started] and be sure to note down your application token.
2. In the `src/` directory, copy the existing `.env.development` and rename it to `.env.development.local` file (**IMPORTANT:** The existing `.gitignore` rules should prevent this file from being committed but make sure not to commit any sensitive information!)
3. Fill out the empty fields with the appropriate information, namely the Discord IDs of the bot owners and your discord application token.
4. Run `docker compose --env-file src/.env.development.local up` in the terminal where the bot is located.
5. After a bit of time, all the relevant containers should be setup and running!

## Non-Docker

_Note: These steps assume you have an installed and running PostgreSQL server_

1. [Create a discord application][discord_app_getting_started] and be sure to note down your application token.
2. In the `src/` directory, copy the existing `.env.development` and rename it to `.env.development.local` file (**IMPORTANT:** The existing `.gitignore` rules should prevent this file from being committed but make sure not to commit any sensitive information!)
3. Fill out the empty fields with the appropriate information, namely the Discord IDs of the bot owners and your discord application token.
4. Run `npm install`
5. From the bot parent directory, run `npm run prisma dev migrate dev`
6. You can run the bot now in two ways:
    - If you wish to watch the repository files and automatically restart the bot when any are changed, execute `npm run watch:start`
    - If you wish to just run the bot, execute `npm run dev`

### Production

TODO

## License

This project uses the [MIT License][mit].

[sapphire]: https://github.com/sapphiredev/framework
[mit]: https://mit-license.org/
[nodejs]: https://nodejs.org/en/download/current/
[prisma]: https://www.prisma.io/
[postgres]: https://www.postgresql.org/
[discord_app_getting_started]: https://discord.com/developers/docs/getting-started
