import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SessionDevice } from '../../domin/session-device.entity';
import { Repository } from 'typeorm';
import { DeviceViewModel } from '../view-model/device-view-model';

@Injectable()
export class SessionDeviceQueryRepository {
  constructor(
    @InjectRepository(SessionDevice)
    private sessionDeviceRepository: Repository<SessionDevice>,
  ) {}

  async getAllDevicesByUserId(userId: string): Promise<DeviceViewModel[]> {
    return await this.sessionDeviceRepository
      .createQueryBuilder('s')
      .select([
        's.id as "deviceId"',
        's.title as title',
        's.ip as ip',
        's.last_active_at as "lastActiveDate"',
      ])
      .where('s.user.id = :userId', { userId })
      .getRawMany<DeviceViewModel>();
  }
}
