import { Response } from 'supertest';
import { ApiExtensionError } from '../../src/core/exceptions/domain-exception';

export type ResponseBodySuperTest<T=null> = Promise<Response & { body: T }>;

export type ApiErrorResultType = {
  errorsMessages: ApiExtensionError[];
};
