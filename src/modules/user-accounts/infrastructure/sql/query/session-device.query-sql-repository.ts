import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { SessionDeviceViewDTO } from '../mapper/session-device.sql-view-dto';
import { SessionDeviceSqlRow } from '../rows/session-device.sql-row';
import { SecurityDeviceViewDto } from '../../mapper/security-device.view-dto';

@Injectable()
export class SessionDeviceQuerySqlRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource) {}

  async getAllDevicesByUserId(
    userId: string,
  ): Promise<SecurityDeviceViewDto[]> {
    const items = await this.dataSource.query<SessionDeviceSqlRow[]>(
      `SELECT *
       FROM public."SessionDevieces"
       WHERE public."SessionDevieces"."userId" = $1
      `,
      [userId],
    );
    return items.map((item) => SessionDeviceViewDTO.mapToView(item));
  }
}
