export default class AppError extends Error {
  constructor(message='Error', status=500, publicMessage=null) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.publicMessage = publicMessage || message;
  }
}
