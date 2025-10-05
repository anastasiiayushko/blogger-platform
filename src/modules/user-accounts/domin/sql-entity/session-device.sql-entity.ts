import { CreateSecurityDeviceDomainDto } from '../dto/crate-securit-device.domain.dto';
import { UpdateSecurityDeviceDomainDto } from '../dto/update-securit-device.domain.dto';

type InputModelType = {
  id: string | null;
  userId: string;
  deviceId: string;
  lastActiveAt: Date;
  expirationAt: Date;
  title: string;
  ip: string;
};

export class SessionDevice {
  public readonly id: string | null;
  public readonly userId: string;
  public readonly deviceId: string;

  private _title: string;
  private _ip: string;
  private _lastActiveAt: Date;
  private _expirationAt: Date;

  private constructor(arg: InputModelType) {
    this.id = arg.id;
    this.deviceId = arg.deviceId;
    this.userId = arg.userId;
    this._lastActiveAt = arg.lastActiveAt;
    this._expirationAt = arg.expirationAt;
    this._title = arg.title;
    this._ip = arg.ip;
  }

  static createInstance(dto: CreateSecurityDeviceDomainDto): SessionDevice {
    return new SessionDevice({
      id: null,
      deviceId: dto.id as string,
      userId: dto.userId,
      expirationAt: dto.expirationAt,
      lastActiveAt: dto.lastActiveAt,
      title: dto.title,
      ip: dto.ip,
    });
  }

  updateDevice(dto: UpdateSecurityDeviceDomainDto) {
    this._ip = dto.ip;
    this._title = dto.title;
    this._lastActiveAt = dto.lastActiveAt;
    this._expirationAt = dto.expirationAt;
  }

  /** Для маппера */
  toPrimitives(): InputModelType {
    return {
      id: this.id,
      userId: this.userId,
      deviceId: this.deviceId,
      title: this._title,
      ip: this._ip,
      lastActiveAt: this._lastActiveAt,
      expirationAt: this._expirationAt,
    };
  }

  /** Ре-гидратация из  бд  */
  static toDomain(p: InputModelType): SessionDevice {
    return new SessionDevice({
      id: p.id,
      deviceId: p.deviceId,
      userId: p.userId,
      lastActiveAt: p.lastActiveAt,
      expirationAt: p.expirationAt,
      ip: p.ip,
      title: p.title,
    });
  }

  // Геттеры (удобно для чтения снаружи)
  get ip() {
    return this._ip;
  }

  get lastActiveAt() {
    return this._lastActiveAt;
  }

  get expirationAt() {
    return this._expirationAt;
  }
}
