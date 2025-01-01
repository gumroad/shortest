export interface APIRequest extends RequestInit {
  /**
   * Target URL for the request
   */
  url?: string;
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
   * @default 30000
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
