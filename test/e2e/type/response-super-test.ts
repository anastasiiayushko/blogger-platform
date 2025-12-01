import { ApiExtensionError } from '../../../src/core/exceptions/domain-exception';
import type { Response as STResponse } from 'supertest';

export type TypedResponse<T> = Omit<STResponse, 'body'> & { body: T };

export type ResponseBodySuperTest<T = null> = Promise<TypedResponse<T>>;

export const toTypedResponseSupperTest = <T>(r: STResponse) =>
  r as unknown as TypedResponse<T>;

export type ApiErrorResultType = {
  errorsMessages: ApiExtensionError[];
};
