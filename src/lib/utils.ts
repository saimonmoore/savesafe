import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Array, Effect, Either, flow, pipe, Schema } from "effect";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const validate = <A, I>(schema: Schema.Schema<A, I>) =>
  flow(
    Schema.decodeEither(schema),
    Either.flip,
    Either.map((error) => error.message),
    Either.getOrNull
  );

export const singleResult = <A, E>(orFail: () => E) =>
  Effect.flatMap((results: A[]) =>
    pipe(results, Array.head, Effect.mapError(orFail))
  );