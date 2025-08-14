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

  async findDeviceById(
    deviceId: string,
  ): Promise<SecurityDeviceDocument | null> {
    return this.securityDeviceModel.findOne({
      _id: new Types.ObjectId(deviceId),
    });
  }

  async findDeviceByIdAndUserId(
    deviceId: string,
    userId: string,
  ): Promise<SecurityDeviceDocument | null> {
    return this.securityDeviceModel.findOne({
      _id: new Types.ObjectId(deviceId),
      userId: new Types.ObjectId(userId),
    });
  }

  async findActualDevice(
    deviceId: string,
    userId: string,
    lastActiveDate: Date,
  ): Promise<SecurityDeviceDocument | null> {
    return this.securityDeviceModel.findOne({
      _id: new Types.ObjectId(deviceId),
      userId: new Types.ObjectId(userId),
      lastActiveDate: lastActiveDate,
    });
  }

  async save(securityDevice: SecurityDeviceDocument): Promise<void> {
    await securityDevice.save();
  }

  async deleteById(deviceId: string, userId: string): Promise<boolean> {
    const result = await this.securityDeviceModel.deleteOne({
      _id: new Types.ObjectId(deviceId),
      userId: new Types.ObjectId(userId),
    });
    return result.deletedCount > 0;
  }

  async terminateAllOtherDevices(
    currentDeviceId: string,
    userId: string,
  ): Promise<boolean> {
    const result = await this.securityDeviceModel.deleteMany({
      _id: { $ne: new Types.ObjectId(currentDeviceId) },
      userId: new Types.ObjectId(userId),
    });

    return result.deletedCount > 0;
  }
}
