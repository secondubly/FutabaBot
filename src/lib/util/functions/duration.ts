import { Time } from "@sapphire/duration";

export function mins(minutes: number) {
    if (isNaN(minutes)) throw new Error('Input must be a valid number');
    return Time.Minute * minutes
}

export function sec(seconds: number) {
    if (isNaN(seconds)) throw new Error('Input must be a valid number');
    return Time.Second * seconds
}