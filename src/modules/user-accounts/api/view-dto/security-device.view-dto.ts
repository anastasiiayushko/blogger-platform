import { SecurityDeviceDocument } from '../../domin/security-device.entity';

export class SecurityDeviceViewDto {
  public ip: string;
  public title: string;
  public lastActiveDate: string;
  public deviceId: string;

  static mapView(device: SecurityDeviceDocument): SecurityDeviceViewDto {
    const dto = new SecurityDeviceViewDto();
    dto.ip = device.ip;
    dto.deviceId = device._id.toString();
    dto.title = device.title;
    dto.lastActiveDate = device.lastActiveDate.toISOString();
    return dto;
  }
}
