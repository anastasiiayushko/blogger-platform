import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { SessionDevice } from '../domin/session-device.entity';

@Injectable()
export class SessionDeviceRepository {
  constructor(
    @InjectRepository(SessionDevice)
    protected sessionRepository: Repository<SessionDevice>,
  ) {}

  async findByDeviceId(deviceId: string): Promise<SessionDevice | null> {
    return await this.sessionRepository.findOne({
      where: {
        id: deviceId,
      },
      relations: ['user'],
    });
  }

  async findByDeviceAndUserIds(
    deviceId: string,
    userId: string,
  ): Promise<SessionDevice | null> {
    return await this.sessionRepository.findOne({
      where: {
        id: deviceId,
        user: { id: userId },
      },
    });
  }

  async findActualDevice(
    deviceId: string,
    userId: string,
    lastActiveAt: Date,
  ): Promise<SessionDevice | null> {
    return await this.sessionRepository.findOne({
      where: {
        id: deviceId,
        user: { id: userId },
        lastActiveAt: lastActiveAt,
      },
    });
  }

  async save(sessionDevice: SessionDevice): Promise<SessionDevice> {
    return this.sessionRepository.save(sessionDevice);
  }

  async deleteByDeviceIdByCurrentUserId(
    deviceId: string,
    userId: string,
  ): Promise<boolean> {
    const sessionDevice = await this.sessionRepository.findOne({
      where: {
        id: deviceId,
        user: { id: userId },
      },
    });
    if (!sessionDevice) {
      return false;
    }
    const result = await this.sessionRepository.delete(sessionDevice?.id);
    return (result?.affected ?? 0) > 0;
  }

  async terminateAllOtherDevices(
    currentDeviceId: string,
    userId: string,
  ): Promise<boolean> {
    const sessionDevices = await this.sessionRepository.find({
      select: {
        id: true,
      },
      where: {
        id: Not(currentDeviceId),
        user: { id: userId },
      },
    });
    if (!sessionDevices.length) {
      return false;
    }
    const deletedIds = sessionDevices.map((d) => d.id);
    const results = await this.sessionRepository.delete(deletedIds);

    return (results?.affected ?? 0) > 0;
  }
}
