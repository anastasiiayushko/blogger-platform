export const envFilePaths = [
  process.env.ENV_FILE_PATH?.trim() || '',
  `.env.${process.env.NODE_ENV}.local`,
  `.env.${process.env.NODE_ENV}`,
  '.env.development',
];
