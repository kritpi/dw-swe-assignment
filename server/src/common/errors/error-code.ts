export enum ErrorCode {
  AlreadyReserved = 'ALREADY_RESERVED',
  AuthenticationRequired = 'AUTHENTICATION_REQUIRED',
  ConcertNotFound = 'CONCERT_NOT_FOUND',
  ConcertSoldOut = 'CONCERT_SOLD_OUT',
  DuplicateEmail = 'DUPLICATE_EMAIL',
  Forbidden = 'FORBIDDEN',
  InvalidCredentials = 'INVALID_CREDENTIALS',
  NoActiveReservation = 'NO_ACTIVE_RESERVATION',
  NotFound = 'NOT_FOUND',
  ValidationFailed = 'VALIDATION_FAILED',
  InternalError = 'INTERNAL_ERROR',
}
