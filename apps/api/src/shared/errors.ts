export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message)
    this.name = 'HttpError'
  }

  static notFound(msg: string) { return new HttpError(404, msg) }
  static badRequest(msg: string) { return new HttpError(400, msg) }
  static conflict(msg: string) { return new HttpError(409, msg) }
  static unprocessable(msg: string) { return new HttpError(422, msg) }
}
