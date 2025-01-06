export function urlSafe(url: string): string {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.toString();
  } catch {
    throw new Error("Invalid URL");
  }
}
