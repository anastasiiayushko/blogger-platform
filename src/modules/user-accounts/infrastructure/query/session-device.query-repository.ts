import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SessionDevice } from '../../domin/session-device.entity';
import { Repository } from 'typeorm';
import { SecurityDeviceViewDto } from '../mapper/security-device.view-dto';

@Injectable()
export class SessionDeviceQueryRepository {
  constructor(
    @InjectRepository(SessionDevice)
    private sessionDeviceRepository: Repository<SessionDevice>,
  ) {}

  async getAllDevicesByUserId(
    userId: string,
  ): Promise<SecurityDeviceViewDto[]> {
    const devices = await this.sessionDeviceRepository.find({
      where: {
        user: {
          id: userId,
        },
      },
      select: {
        id: true,
        title: true,
        ip: true,
        lastActiveAt: true,
      },
    });

    return devices.map((d) => SecurityDeviceViewDto.mapView(d));
  }
}
