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

export const findCookieByName = (cookies: string[], cookieName: string) => {
  return cookies.find((cookie) => cookie.startsWith(`${cookieName}=`));
};
