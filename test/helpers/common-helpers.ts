export const getAuthHeaderBasicTest = (auth: string = 'admin:qwerty') => {
  const encoded = Buffer.from(auth, 'utf8').toString('base64');
  return `Basic ${encoded}`;
};

export const delay = async (delay: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, delay));
};

export const generateRandomStringForTest = (lengthSymbols: number): string => {
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'; // Набор символов
  let result = '';
  for (let i = 0; i < lengthSymbols; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }
  return result;
};

// export const sortedBySortKeyAndDirectionTest =
//   <T>(data: T[], sortBy: keyof T, direction: SortDirectionsType) => {
//     return data.sort((a, b) => {
//       const valueA = String(a[sortBy]).toLowerCase(); // Приводим к строке и в нижний регистр
//       const valueB = String(b[sortBy]).toLowerCase();
//
//       if (valueA < valueB) return direction === 'asc' ? -1 : 1;
//       if (valueA > valueB) return direction === 'asc' ? 1 : -1;
//       return 0;
//     });
//   }

export const getCookieValueByName = (cookies: string[], cookieName: string) => {
  for (let i = 0; i < cookies.length; i++) {
    const cookiesString = cookies[i];
    const name = cookiesString.split(';')[i].split('=')[0];
    const value = cookiesString.split(';')[i].split('=')[1] as string;
    if (name === cookieName) {
      return value;
    }
  }
  return null;
};

export const excludeCookiesFromHeaders = (headers: {
  [index: string]: string;
}) => {
  return Array.isArray(headers['set-cookie'])
    ? headers['set-cookie']
    : [headers['set-cookie']];
};

export const findCookieByName = (cookies: string[], cookieName: string)=>{
  return cookies.find(cookie => cookie.startsWith(`${cookieName}=`));
}
