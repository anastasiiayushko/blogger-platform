export type SessionDeviceSqlRow = {
  id: string; // PK
  userId: string; // FK
  deviceId: string; // uuid
  title: string;
  ip: string;
  lastActiveAt: Date;
  expirationAt: Date;
  createdAt: Date;
  updatedAt: Date;
};
