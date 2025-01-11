import { sleep } from "./sleep";

/**
 * Retries a function call for a specified number of attempts with a delay between retries.
 * @param fn The function to be retried, should return a Promise.
 * @param retries The number of retries (default is 3).
 * @param delay The delay between retries in milliseconds (default is 1000ms).
 * @returns The result of the function if successful, or throws an error after the final retry.
 */
export const retry = async <T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T | undefined> => {
  let attempts = 0;
  while (attempts < retries) {
    try {
      return await fn();
    } catch (error) {
      attempts++;
      if (attempts >= retries) throw error;
      await sleep(delay);
    }
  }
};
