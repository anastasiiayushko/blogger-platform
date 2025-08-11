import { Types } from 'mongoose';
import { Prop } from '@nestjs/mongoose';

export class CreateSecurityDeviceDomainDto {
  ip: string;
  title: string;
  userId: Types.ObjectId;
  lastActiveDate: Date;
  expirationDate: Date;
}