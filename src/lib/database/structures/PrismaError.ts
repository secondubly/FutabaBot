export class PrismaError extends Error {
    constructor(message: string, stack?: Error["stack"]) {
        super(message)
        this.name = 'PrismaError'
        this.stack = stack ?? undefined
    }
}