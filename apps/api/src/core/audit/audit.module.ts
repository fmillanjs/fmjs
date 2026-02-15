import { Module, Global } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuditService } from './audit.service';
import { AuditListener } from './audit.listener';

@Global()
@Module({
  imports: [
    EventEmitterModule.forRoot({
      // Use wildcards for event matching
      wildcard: false,
      // Set this to `true` to use wildcards
      delimiter: '.',
      // Set this to true if you want to emit the newListener event
      newListener: false,
      // Set this to true if you want to emit the removeListener event
      removeListener: false,
      // Set this to the maximum number of listeners that can be assigned to an event
      maxListeners: 10,
      // Show event name in memory leak message when more than maximum amount of listeners is assigned
      verboseMemoryLeak: false,
      // Disable throwing uncaughtException if an error event is emitted and it has no listeners
      ignoreErrors: false,
    }),
  ],
  providers: [AuditService, AuditListener],
  exports: [AuditService],
})
export class AuditModule {}
