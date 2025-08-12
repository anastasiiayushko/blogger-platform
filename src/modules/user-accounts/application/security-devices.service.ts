import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  SecurityDevice,
  SecurityDeviceModelType,
} from '../domin/security-device.entity';
import { SecurityDeviceRepository } from '../infrastructure/security-device.repository';
import { Types } from 'mongoose';

export class SecurityDeviceInputDto {
  userId: string;
  deviceId: Types.ObjectId;
  ip: string;
  agent: string;
  lastActiveDate: Date;
  expirationDate: Date;
}

@Injectable()
export class SecurityDevicesService {
  constructor(
    @InjectModel(SecurityDevice.name)
    private readonly securityDeviceModel: SecurityDeviceModelType,
    private readonly securityDeviceRepository: SecurityDeviceRepository,
  ) {}

  private async create(device: SecurityDeviceInputDto) {}

  private async update(device: SecurityDeviceInputDto) {}

  async upsertDevice(
    dto: SecurityDeviceInputDto,
    strategy: 'create' | 'update',
  ) {
    await this[strategy](dto);
  }
}
