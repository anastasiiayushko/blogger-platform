import { validateOrReject } from 'class-validator';
/**
 * @ValidateDomainDto(SomeDtoClass) — это метод-декоратор, который:
 *
 * Ищет среди аргументов метода экземпляр класса SomeDtoClass.
 *
 * Валидирует этот аргумент через class-validator (validateOrReject()).
 *
 * Если DTO невалидный — выбрасывает ошибку и не выполняет оригинальный метод.
 *
 */
export function ValidateDomainDto<T>(
  InstanceInputModel: new (...args: any[]) => T,
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const modelInput = args.find(
        (param) => param instanceof InstanceInputModel,
      );
      if (!modelInput) {
        throw new Error(`Called ${propertyKey} not find model input`);
      }
      try {
        await validateOrReject(modelInput);
      } catch (e) {
        throw new Error(`${e}  CALL STACK ${e.stack}`);
      }

      return originalMethod.apply(this, args);
    };
  };
}
