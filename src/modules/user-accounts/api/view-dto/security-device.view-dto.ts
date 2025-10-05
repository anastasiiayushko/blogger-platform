//::TODO dto unused

export class SecurityDeviceViewDto {
  public ip: string;
  public title: string;
  public lastActiveDate: string;
  public deviceId: string;

  static mapView(): SecurityDeviceViewDto {
    const dto = new SecurityDeviceViewDto();

    return dto;
  }
}
