import { PrismaClientInitializationError, PrismaClientKnownRequestError } from "@prisma/client/runtime/library"
import { PrismaError } from "./structures/PrismaError"

export function handlePrismaRequestError(err: PrismaClientKnownRequestError): PrismaError {
    switch (err.code) {
        case 'P2002': 
            // duplicate key errors
            return new PrismaError(`Duplicate field value: ${err.meta?.target}`, err.stack)
            case 'P2014':
                // invalid ID error
                return new PrismaError(`Invalid ID: ${err.meta?.target}`, err.stack)
            case 'P2003':
                return new PrismaError(`Invalid input data: ${err.meta?.data}`, err.stack)
            case 'P2025':
                // missing record error
                return new PrismaError(`Operation failed because the supplied record was not found`, err.stack)
            default:
                return new PrismaError(`Something went wrong: ${err.message}`, err.stack)
    }
}

export function handlePrismaInitializationError(err: PrismaClientInitializationError): PrismaError {
    switch (err.errorCode) {
        case 'P1001':
            return new PrismaError(`Could not connect to database server, please make sure your database is running.`, err.stack)
        default:
            return new PrismaError(`Something went wrong: ${err.message}`, err.stack)
    }
}