export type PasswordRecoverySqlRow = {
  id: string; // PK
  userId: string; // FK
  code: string;
  isConfirmed: boolean;
  expirationAt: Date;
  createdAt: Date;
  updatedAt: Date;
};
