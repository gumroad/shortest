export interface APIRequest extends RequestInit {
  /**
   * Target URL for the request
   */
  url?: string;

  /**
   * Query parameters to be sent with the URL
   */
  params?: URLSearchParams | string;

  /**
   * Data to be sent with the request
   */
  data?: string;
}

export interface APIRequestConfig {
  baseURL: string;

  /**
   * An object containing additional HTTP headers to be sent with every request
   * @default {}
   */
  extraHTTPHeaders: {
    [key: string]: string;
  };

  /**
   * Maximum time in milliseconds to wait for the response
   */
  timeout: number;

  /**
   * Whether to ignore HTTPS errors when sending network requests
   * @default false
   */
  ignoreHTTPSErrors: boolean;

  /**
   * Set cookies for the request
   */
  storageState: SessionStorageState[];
}

export interface SessionStorageState {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires: number;
  httpOnly: boolean;
  secure: boolean;
  sameSite: "Strict" | "Lax" | "None";
}

export interface APIFetchConfig {
  /**
   * Maximum number of retries to attempt
   * @default 0
   */
  maxRetries: number;

  /**
   * Whether to ignore HTTPS errors when sending network requests
   * This will override the global setting in the APIRequestConfig
   * @default false
   */
  ignoreHTTPSErrors: boolean;
}
