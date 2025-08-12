import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  SecurityDevice,
  SecurityDeviceDocument,
  SecurityDeviceModelType,
} from '../domin/security-device.entity';
import { Types } from 'mongoose';

@Injectable()
export class SecurityDeviceRepository {
  constructor(
    @InjectModel(SecurityDevice.name)
    private readonly securityDeviceModel: SecurityDeviceModelType,
  ) {}

  async findActualDevice(
    deviceId: string,
    userId: string,
    lastActiveDate: Date,
  ): Promise<SecurityDeviceDocument | null> {
    return this.securityDeviceModel.findById({
      _id: new Types.ObjectId(deviceId),
      userId: new Types.ObjectId(userId),
      lastActiveDate: lastActiveDate,
    });
  }

  async save(securityDevice: SecurityDeviceDocument): Promise<void> {
    await securityDevice.save();
  }
}
