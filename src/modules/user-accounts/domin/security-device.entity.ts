import { CreateSecurityDeviceDomainDto } from './dto/crate-securit-device.domain.dto';
import { UpdateSecurityDeviceDomainDto } from './dto/update-securit-device.domain.dto';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('sessions')
export class SecurityDevice {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar' })
  ip: string;

  @Column({ type: 'varchar', default: 'anonymous' })
  title: string;

  @Column({ type: 'timestamp' })
  lastActiveDate: Date;

  @Column({ type: 'timestamp' })
  expirationDate: Date;

  static createInstance(dto: CreateSecurityDeviceDomainDto): SecurityDevice {
    const securityDevice = new SecurityDevice();
    securityDevice.id = dto.deviceId;
    securityDevice.ip = dto.ip;
    securityDevice.title = dto.title;
    securityDevice.userId = dto.userId;
    securityDevice.lastActiveDate = dto.lastActiveDate;
    securityDevice.expirationDate = dto.expirationDate;
    return securityDevice;
  }

  updateDevice(dto: UpdateSecurityDeviceDomainDto): void {
    this.ip = dto.ip;
    this.title = dto.title;
    this.lastActiveDate = dto.lastActiveDate;
    this.expirationDate = dto.expirationDate;
  }
}
