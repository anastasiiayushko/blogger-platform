import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { EmailConfirmationSqlRow } from './rows/email-confirmation.sql-row';
import { EmailConfirmation } from '../../domin/sql-entity/email-confirmation.sql-entity';

type InputType = {
  code: string;
  isConfirmed: boolean;
  expirationAt: Date;
  userId: string; //FK
  id: string | null; //Pk
};

@Injectable()
export class EmailConfirmationSqlRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource) {}

  async findByUserId(userId: string): Promise<EmailConfirmation | null> {
    const confirmationRow: EmailConfirmationSqlRow[] =
      await this.dataSource.query(
        `
            SELECT e."userId", e.code, e."expirationAt", e."isConfirmed", id
            FROM public."EmailConfirmations" as e
            where e."userId" = $1`,
        [userId],
      );
    if (!confirmationRow || !confirmationRow.length) {
      return null;
    }

    return EmailConfirmation.toDomain(confirmationRow[0]);
  }

  private async create(userDto: InputType): Promise<EmailConfirmation> {
    const INSERT_SQL = `
        INSERT INTO public."EmailConfirmations"
            ("userId", code, "expirationAt", "isConfirmed")
        VALUES ($1, $2, $3, $4) RETURNING *
    `;
    const confirmationRow: EmailConfirmationSqlRow[] =
      await this.dataSource.query(INSERT_SQL, [
        userDto.userId,
        userDto.code,
        userDto.expirationAt,
        userDto.isConfirmed,
      ]);

    return EmailConfirmation.toDomain(confirmationRow[0]);
  }

  private async update(userDto: InputType): Promise<EmailConfirmation> {
    const UPDATE_SQL = `
        UPDATE public."EmailConfirmations"
        SET code=$1,
            "expirationAt" =$2,
            "isConfirmed"=$3
        where public."EmailConfirmations" = $4 RETURNING *;
    `;
    const confirmationRow: EmailConfirmationSqlRow[] =
      await this.dataSource.query(UPDATE_SQL, [
        userDto.code,
        userDto.expirationAt,
        userDto.isConfirmed,
        userDto.userId,
      ]);

    return EmailConfirmation.toDomain(confirmationRow[0]);
  }

  async save(dtoInputType: InputType): Promise<void> {
    if (dtoInputType.id) {
      await this.create(dtoInputType);
    } else {
      await this.update(dtoInputType);
    }
  }

  async delete(userId: string): Promise<boolean> {
    const deleteResult: [[], number] = await this.dataSource.query(
      `
          DELETE
          FROM public."EmailConfirmations" as c
          WHERE c."userId" = $1;
      `,
      [userId],
    );

    return deleteResult?.[1] > 0;
  }
}
