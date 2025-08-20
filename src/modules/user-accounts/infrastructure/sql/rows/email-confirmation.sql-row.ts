export type EmailConfirmationSqlRow = {
  id: string; // PK
  userId: string; // FK
  code: string;
  isConfirmed: boolean;
  expirationAt: Date;
};
