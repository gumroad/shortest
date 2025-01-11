import { isObject } from "./isObject";

export function merge<
  T extends Record<string, any>,
  S extends Record<string, any>[],
>(target: T, ...sources: S): T & UnionToIntersection<S[number]> {
  if (!sources.length) return target as T & UnionToIntersection<S[number]>;
  const source = sources.shift();

  if (isObject(target) && isObject(source!)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        merge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return merge(target, ...sources);
}

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never;
