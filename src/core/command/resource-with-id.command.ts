export abstract class ResourceWithIdCommand<T=null> {
  constructor(
    public id: string,
    public inputModel: T,
  ) {}
}
