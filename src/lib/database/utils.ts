import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { PrismaError } from "./structures/PrismaError";

export function handlePrismaError(err: PrismaClientKnownRequestError): PrismaError {
    switch (err.code) {
        case 'P2002': 
            // duplicate key errors
            return new PrismaError(`Duplicate field value: ${err.meta?.target}`, err.stack)
            case 'P2014':
                // invalid ID error
                return new PrismaError(`Invalid ID: ${err.meta?.target}`, err.stack)
            case 'P2003':
                return new PrismaError(`Invalid input data: ${err.meta?.data}`, err.stack)
            default:
                return new PrismaError(`Something went wrong: ${err.message}`, err.stack)
    }
}