//если специфических кодов будет много лучше разнести их в соответствующие модули
export enum DomainExceptionCode {
  //common
  NotFound = 404,
  BadRequest = 400,
  InternalServerError = 500,
  Forbidden = 403,
  ManyRequests = 429,
  ValidationError = 5,
  //auth
  Unauthorized = 401,
  EmailNotConfirmed = 12,
  ConfirmationCodeExpired = 13,
  PasswordRecoveryCodeExpired = 14,

  //...
}
