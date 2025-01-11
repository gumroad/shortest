export function isObject(item: Record<string, any>) {
  return item && typeof item === "object" && !Array.isArray(item);
}
