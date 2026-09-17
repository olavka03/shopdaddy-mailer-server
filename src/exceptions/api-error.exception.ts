type ErrorObj = Record<string, unknown>;

export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public errors: ErrorObj = {},
  ) {
    super(message);

    this.status = status;
    this.errors = errors;
  }

  static BadRequest(message: string, errors: ErrorObj = {}) {
    return new ApiError(400, message, errors);
  }

  static Unauthorized() {
    return new ApiError(401, 'Unauthorized');
  }

  static Forbidden() {
    return new ApiError(403, 'Forbidden');
  }

  static NotFound() {
    return new ApiError(404, 'Not found');
  }

  static UnprocessableEntity(message: string, errors: ErrorObj = {}) {
    return new ApiError(422, message, errors);
  }

  static BadGateway(message: string, errors: ErrorObj = {}) {
    return new ApiError(502, message, errors);
  }

  static Internal(message = 'Internal error', errors: ErrorObj = {}) {
    return new ApiError(500, message, errors);
  }
}
