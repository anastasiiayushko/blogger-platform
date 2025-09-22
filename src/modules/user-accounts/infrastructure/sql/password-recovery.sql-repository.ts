import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  PasswordRecovery,
  PasswordRecoveryPrimitiveType,
} from '../../domin/sql-entity/password-recovery.sql-entity';
import { PasswordRecoverySqlRow } from './rows/password-recovery.sql-row';
import { EmailConfirmationSqlRow } from './rows/email-confirmation.sql-row';

@Injectable()
export class PasswordRecoverySqlRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource) {}

  async findByCode(code: string): Promise<PasswordRecovery | null> {
    const SELECT_QUERY = `
        SELECT id, code, "expirationAt", "isConfirmed", "userId"
        FROM public."PasswordRecovery"
        WHERE public."PasswordRecovery".code = $1;
    `;

    const result = await this.dataSource.query<PasswordRecoverySqlRow[]>(
      SELECT_QUERY,
      [code],
    );

    if (!result || !result.length) {
      return null;
    }
    return PasswordRecovery.toDomain(result[0]);
  }

  async findByUserId(userId: string): Promise<PasswordRecovery | null> {
    const SELECT_QUERY = `
        SELECT id, code, "expirationAt", "isConfirmed", "userId"
        FROM public."PasswordRecovery"
        WHERE public."PasswordRecovery"."userId" = $1;
    `;

    const result = await this.dataSource.query<PasswordRecoverySqlRow[]>(
      SELECT_QUERY,
      [userId],
    );

    if (!result || !result.length) {
      return null;
    }
    return PasswordRecovery.toDomain(result[0]);
  }

  private async insert(
    recovery: PasswordRecoveryPrimitiveType,
  ): Promise<PasswordRecoverySqlRow> {
    const INSERT_SQL = `
        INSERT INTO public."PasswordRecovery"
            (code, "expirationAt", "isConfirmed", "userId")
        VALUES ($1, $2, $3, $4) RETURNING *;

    `;
    const resultRow = await this.dataSource.query<PasswordRecoverySqlRow[]>(
      INSERT_SQL,
      [
        recovery.code,
        recovery.expirationAt,
        recovery.isConfirmed,
        recovery.userId,
      ],
    );

    if (!resultRow || !resultRow.length) {
      throw new Error('Some error, insert recoveryPassword');
    }
    return resultRow[0];
  }

  private async update(
    recovery: PasswordRecoveryPrimitiveType,
  ): Promise<PasswordRecoverySqlRow> {
    const UPDATE_SQL = `
        UPDATE public."PasswordRecovery"
        SET code=$1,
            "expirationAt" =$2,
            "isConfirmed"=$3,
            "updatedAt" = NOW()
        WHERE public."PasswordRecovery"."userId" = $4 RETURNING *;
    `;
    const resultRow: EmailConfirmationSqlRow[] = await this.dataSource.query(
      UPDATE_SQL,
      [
        recovery.code,
        recovery.expirationAt,
        recovery.isConfirmed,
        recovery.userId,
      ],
    );
    if (!resultRow || !resultRow.length) {
      throw new Error('Some error, insert recoveryPassword');
    }
    return resultRow[0];
  }

  async save(recovery: PasswordRecovery): Promise<void> {
    if (recovery.id) {
      await this.update(recovery.toPrimitives());
      return;
    }
    await this.insert(recovery.toPrimitives());
    return;
  }

  async deleteByUserId(userId: string): Promise<boolean> {
    const deleteResult: [[], number] = await this.dataSource.query(
      `
          DELETE
          FROM public."PasswordRecovery" as c
          WHERE c."userId" = $1;
      `,
      [userId],
    );

    return deleteResult?.[1] > 0;
  }
}
