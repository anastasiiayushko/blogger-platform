import { SessionDeviceSqlRow } from '../rows/session-device.sql-row';

export class SessionDeviceViewDTO {
  ip: string;
  title: string;
  lastActiveDate: string;
  deviceId: string;

  /**
   * Converts a row slq  into a UserMeSqlViewDto.
   * @param {SessionDeviceSqlRow} device - The session device row from the database.
   * @returns {SessionDeviceViewDTO} - The transformed session device DTO.
   */
  static mapToView(device: SessionDeviceSqlRow): SessionDeviceViewDTO {
    const dto = new SessionDeviceViewDTO();
    dto.ip = device.id;
    dto.title = device.title;
    dto.lastActiveDate = device.lastActiveAt.toISOString();
    dto.deviceId = device.deviceId;
    return dto;
  }
}
