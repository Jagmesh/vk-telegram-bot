import { Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.TRANSIENT })
export class LogService {
  private scope: string;
  setScope(scope: string): this {
    this.scope = scope;
    return this;
  }

  write(message: string) {
    console.log(`[${this.getLocalDate()}]: \x1b[32m[LOG]\x1b[0m\x1b[35m[${this.scope}]\x1b[0m ${message}`);
  }

  error(message: string) {
    console.log(`[${this.getLocalDate()}]: \x1b[31m[ERROR]\x1b[0m\x1b[35m[${this.scope}]\x1b[0m ${message}`);
  }

  private getLocalDate() {
    const date = new Date();
    date.setHours(date.getHours() + 3);
    return date.toJSON().slice(0, -5).replace(/T/, ' ');
  }
}
