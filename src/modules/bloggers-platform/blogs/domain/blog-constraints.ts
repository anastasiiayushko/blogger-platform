export const blogNameConstraints = {
  maxLength: 15,
};
export const blogDescriptionConstraints = {
  maxLength: 500,
};
export const blogWebsitUrlConstraints = {
  match: /^https:\/\/([a-zA-Z0-9_-]+\.)+[a-zA-Z0-9_-]+(\/[a-zA-Z0-9_-]+)*\/?$/,
  maxLength: 100,
};