export class ConverterError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConverterError';
  }
}
