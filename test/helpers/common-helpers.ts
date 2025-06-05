export const getAuthHeaderBasicTest = (auth: string = 'admin:qwerty') => {
  const encoded = Buffer.from(auth, 'utf8').toString('base64');
  return `Basic ${encoded}`;
};

export const delay = async (delay: number): Promise<void> => {
  return new Promise((resolve) =>
    setTimeout(resolve, delay)
  );
};
