export function isObject(item: Record<string, any>) {
  return item && typeof item === "object" && !Array.isArray(item);
}

export function mergeDeep<
  T extends Record<string, any>,
  S extends Record<string, any>[],
>(target: T, ...sources: S): T & UnionToIntersection<S[number]> {
  if (!sources.length) return target as T & UnionToIntersection<S[number]>;
  const source = sources.shift();

  if (isObject(target) && isObject(source!)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        mergeDeep(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return mergeDeep(target, ...sources);
}

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never;
