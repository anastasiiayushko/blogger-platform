//::TODO dto unused

import { SessionDevice } from '../../domin/session-device.entity';

export class SecurityDeviceViewDto {
  public ip: string;
  public title: string;
  public lastActiveDate: string;
  public deviceId: string;

  static mapView(device: SessionDevice): SecurityDeviceViewDto {
    const dto = new SecurityDeviceViewDto();
    dto.deviceId = device.id;
    dto.ip = device.ip;
    dto.title = device.title;
    dto.lastActiveDate = device.lastActiveAt.toISOString();
    return dto;
  }
}
