import { Types } from 'mongoose';

export class CreateSecurityDeviceDomainDto {
  deviceId: Types.ObjectId;
  ip: string;
  title: string;
  userId: string;
  lastActiveDate: Date;
  expirationDate: Date;
}
