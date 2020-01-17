
export default class HandlerNotFoundError extends Error {
  public params: any[]

  /* istanbul ignore next */
  constructor (handlerName: string, params: any[]) {
    super(`${handlerName} cannot find a suitable handler for: ${params.map(e => e.toString()).join(', ')}`)
    this.params = params
  }
}
