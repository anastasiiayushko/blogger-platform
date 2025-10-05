import { CreateSecurityDeviceDomainDto } from './dto/crate-securit-device.domain.dto';
import { UpdateSecurityDeviceDomainDto } from './dto/update-securit-device.domain.dto';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity()
export class SessionDevice {
  @PrimaryColumn('uuid')
  id: string;

  @ManyToOne(() => User, (u) => u.sessionDevices)
  user: User;

  @Column({ type: 'varchar', nullable: false })
  ip: string;

  @Column({ type: 'varchar', default: 'anonymous' })
  title: string;

  @Column({ type: 'timestamptz' })
  lastActiveAt: Date;

  @Column({ type: 'timestamptz' })
  expirationAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  static createInstance(dto: CreateSecurityDeviceDomainDto): SessionDevice {
    const securityDevice = new SessionDevice();
    securityDevice.id = dto.id;
    securityDevice.user = { id: dto.userId } as User;
    securityDevice.ip = dto.ip;
    securityDevice.title = dto.title;
    securityDevice.lastActiveAt = dto.lastActiveAt;
    securityDevice.expirationAt = dto.expirationAt;
    return securityDevice;
  }

  updateDevice(dto: UpdateSecurityDeviceDomainDto): void {
    this.ip = dto.ip;
    this.title = dto.title;
    this.lastActiveAt = dto.lastActiveAt;
    this.expirationAt = dto.expirationAt;
  }
}
