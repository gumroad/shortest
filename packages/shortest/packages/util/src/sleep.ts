/**
 * Pauses execution for the specified number of milliseconds.
 *
 * @param ms - The duration to sleep, in milliseconds.
 * @returns A Promise that resolves after the specified time has elapsed.
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
