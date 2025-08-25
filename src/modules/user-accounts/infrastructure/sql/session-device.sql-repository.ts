import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { SessionDevice } from '../../domin/sql-entity/session-device.sql-entity';
import { SessionDeviceSqlRow } from './rows/session-device.sql-row';

@Injectable()
export class SessionDeviceSqlRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource) {}

  async findByDeviceId(deviceId: string): Promise<SessionDevice | null> {
    const deviceRows = await this.dataSource.query<SessionDeviceSqlRow[]>(
      `     SELECT *
            FROM public."SessionDevieces"
            WHERE public."SessionDevieces"."deviceId" = $1;
      `,
      [deviceId],
    );
    if (!deviceRows || !deviceRows.length) {
      return null;
    }

    return SessionDevice.toDomain(deviceRows[0]);
  }

  async findDeviceByIdAndUserId(
    deviceId: string,
    userId: string,
  ): Promise<SessionDevice | null> {
    const deviceRows = await this.dataSource.query<SessionDeviceSqlRow[]>(
      `     SELECT device.*
            FROM public."SessionDevieces" as device
            WHERE device."deviceId" = $1
              AND device."userId" = $2;
      `,
      [deviceId, userId],
    );
    if (!deviceRows || !deviceRows.length) {
      return null;
    }

    return SessionDevice.toDomain(deviceRows[0]);
  }

  async findActualDevice(
    deviceId: string,
    userId: string,
    lastActiveAt: Date,
  ): Promise<SessionDevice | null> {
    const deviceRows = await this.dataSource.query<SessionDeviceSqlRow[]>(
      `     SELECT device.*
            FROM public."SessionDevieces" as device
            WHERE device."deviceId" = $1
              AND device."userId" = $2
              AND device."lastActiveAt" = $3;
      `,
      [deviceId, userId, lastActiveAt],
    );
    if (!deviceRows || !deviceRows.length) {
      return null;
    }

    return SessionDevice.toDomain(deviceRows[0]);
  }

  private async insert(inputDto: {
    deviceId: string;
    userId: string;
    lastActiveAt: Date;
    expirationAt: Date;
    ip: string;
    title: string;
  }): Promise<SessionDeviceSqlRow> {
    const INSERT_SQL = `
        INSERT INTO public."SessionDevieces"
            ("deviceId", "userId", "lastActiveAt", "expirationAt", ip, title)
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;
    `;
    const deviceRows = await this.dataSource.query<SessionDeviceSqlRow[]>(
      INSERT_SQL,
      [
        inputDto.deviceId,
        inputDto.userId,
        inputDto.lastActiveAt,
        inputDto.expirationAt,
        inputDto.ip,
        inputDto.title,
      ],
    );
    if (!deviceRows || !deviceRows.length) {
      throw new Error('No insert confirmation row');
    }
    return deviceRows[0];
  }

  private async update(inputDto: {
    deviceId: string;
    lastActiveAt: Date;
    expirationAt: Date;
    ip: string;
    title: string;
  }): Promise<SessionDeviceSqlRow> {
    const UPDATE_SQL = `
        UPDATE public."SessionDevieces"
        SET "lastActiveAt" = $1,
            "expirationAt" = $2,
            "ip"           = $3,
            "title"        = $4,
            "updatedAt"    = $5
        WHERE public."SessionDevieces"."deviceId" = $6 RETURNING *;
    `;
    const deviceRows = await this.dataSource.query<SessionDeviceSqlRow[]>(
      UPDATE_SQL,
      [
        inputDto.lastActiveAt,
        inputDto.expirationAt,
        inputDto.ip,
        inputDto.title,
        new Date(),
        inputDto.deviceId,
      ],
    );
    if (!deviceRows || !deviceRows.length) {
      throw new Error('No update confirmation row.');
    }

    return deviceRows[0];
  }

  async save(sessionDevice: SessionDevice): Promise<void> {
    if (sessionDevice.id) {
      await this.update(sessionDevice.toPrimitives());
      return;
    }
    await this.insert(sessionDevice.toPrimitives());
    return;
  }

  async deleteById(deviceId: string, userId: string): Promise<void> {
    const DELETE_SQL = `
        DELETE
        FROM public."SessionDevieces" as device
        WHERE device."deviceId" = $1
          AND device."userId" = $2;
    `;
    await this.dataSource.query(DELETE_SQL, [deviceId, userId]);
    return;
  }

  async terminateAllOtherDevices(
    currentDeviceId: string,
    userId: string,
  ): Promise<void> {
    const DELETE_SQL = `
        DELETE
        FROM public."SessionDevieces" as device
        WHERE device."deviceId" <> $1
          AND device."userId" = $2;
    `;
    await this.dataSource.query(DELETE_SQL, [currentDeviceId, userId]);
    return;
  }
}
