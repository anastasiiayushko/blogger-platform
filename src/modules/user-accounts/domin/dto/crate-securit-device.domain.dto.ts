import { Types } from 'mongoose';

export class CreateSecurityDeviceDomainDto {
  //::TODO убрать Types.ObjectId
  deviceId: Types.ObjectId | string;
  ip: string;
  title: string;
  userId: string;
  lastActiveDate: Date;
  expirationDate: Date;
}
