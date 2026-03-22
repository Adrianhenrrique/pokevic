import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealthStatus() {
    return {
      status: 'ok',
      message: 'Cobblemon Backend is running.',
      timestamp: new Date().toISOString(),
    };
  }
}
