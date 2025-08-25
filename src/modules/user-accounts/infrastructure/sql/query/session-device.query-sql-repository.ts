import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { SecurityDeviceViewDto } from '../../../api/view-dto/security-device.view-dto';
import { SessionDeviceViewDTO } from '../mapper/session-device.sql-view-dto';
import { SessionDeviceSqlRow } from '../rows/session-device.sql-row';

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
