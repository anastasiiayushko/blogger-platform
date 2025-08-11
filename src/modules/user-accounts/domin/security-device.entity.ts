import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model, Types } from 'mongoose';
import { CreateSecurityDeviceDomainDto } from './dto/crate-securit-device.domain.dto';

@Schema({ timestamps: true })
export class SecurityDevice {
  @Prop({ type: Types.ObjectId, required: true })
  userId: Types.ObjectId;

  @Prop({ type: String, required: true })
  ip: string;

  @Prop({ type: String, required: true, default: 'incognita' })
  title: string;

  @Prop({ type: Date, required: true })
  lastActiveDate: Date;

  @Prop({ type: Date, required: true, expires: 60 * 60 * 24 })
  expirationDate: Date;

  static createInstance(
    dto: CreateSecurityDeviceDomainDto,
  ): SecurityDeviceDocument {
    const securityDevice = new SecurityDevice();
    securityDevice.ip = dto.ip;
    securityDevice.title = dto.title;
    securityDevice.userId = dto.userId;
    securityDevice.lastActiveDate = dto.lastActiveDate;
    securityDevice.expirationDate = dto.expirationDate;
    return securityDevice as SecurityDeviceDocument;
  }
}

export const SecurityDeviceSchema = SchemaFactory.createForClass(SecurityDevice);
SecurityDeviceSchema.loadClass(SecurityDevice);

export type SecurityDeviceDocument = HydratedDocument<SecurityDevice>;
export type SecurityDeviceModelType = Model<SecurityDeviceDocument> &
  typeof SecurityDevice;
