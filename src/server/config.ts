import "dotenv/config";

export interface HyperwalletDbConfig {
  mongoUri?: string;
  dbName: string;
  collectionPrefix: string;
  mainApiUrl?: string;
}

export interface RequiredHyperwalletDbConfig extends HyperwalletDbConfig {
  mongoUri: string;
}

function optionalEnv(name: string): string | undefined {
  return process.env[name] || undefined;
}

export function getHyperwalletDbConfig(): HyperwalletDbConfig {
  return {
    mongoUri: optionalEnv("MONGODB_URI"),
    dbName: process.env.HYPERWALLET_DB_NAME ?? "celestial_hyperwallet",
    collectionPrefix: process.env.HYPERWALLET_COLLECTION_PREFIX ?? "",
    mainApiUrl: optionalEnv("MAIN_APP_API_URL"),
  };
}

export function getRequiredDbConfig(): RequiredHyperwalletDbConfig {
  const config = getHyperwalletDbConfig();

  if (!config.mongoUri) {
    throw new Error("Missing required environment variable: MONGODB_URI");
  }

  return config as RequiredHyperwalletDbConfig;
}

export function getCollectionName(
  config: HyperwalletDbConfig,
  model: string,
): string {
  return `${config.collectionPrefix}${model}`;
}
