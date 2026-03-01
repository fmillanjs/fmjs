import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Logger,
  NotFoundException,
  Sse,
  Res,
} from '@nestjs/common';
import { MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import { timeout, finalize } from 'rxjs/operators';
import { SkipThrottle, Throttle, seconds } from '@nestjs/throttler';
import { Response } from 'express';
import { LeadsService } from './leads.service';
import { PipelineService, StepEvent } from '../pipeline/pipeline.service';
import { CreateLeadDto } from './dto/create-lead.dto';

@Controller('leads')
export class LeadsController {
  private readonly logger = new Logger(LeadsController.name);

  constructor(
    private readonly leadsService: LeadsService,
    private readonly pipeline: PipelineService,
  ) {}

  @Throttle({ default: { limit: 5, ttl: seconds(60) } })
  @Post()
  async create(@Body() dto: CreateLeadDto): Promise<{ id: string }> {
    // POST creates Lead only — SSE endpoint triggers pipeline (avoids double-run race)
    const lead = await this.leadsService.create(dto);
    return { id: lead.id };
  }

  @SkipThrottle()
  @Get()
  findAll() {
    return this.leadsService.findAll();
  }

  @SkipThrottle()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      return await this.leadsService.findOne(id);
    } catch {
      throw new NotFoundException(`Lead ${id} not found`);
    }
  }

  @SkipThrottle()
  @Sse(':id/stream')
  stream(
    @Param('id') id: string,
    @Res() res: Response,
  ): Observable<MessageEvent> {
    // Required for Nginx/Coolify SSE buffering (STATE.md decision)
    res.setHeader('X-Accel-Buffering', 'no');

    let closed = false;
    res.on('close', () => {
      closed = true;
      this.logger.log(`[${id}] SSE client disconnected`);
    });

    return new Observable<MessageEvent>((subscriber) => {
      const onStep = (event: StepEvent) => {
        // Guard: stop emitting if client disconnected or subscriber already closed
        if (closed || subscriber.closed) return;

        if (event.type === 'personalize-token') {
          subscriber.next({ data: { type: 'token', token: event.token } });
        } else {
          subscriber.next({ data: { type: event.type } });
        }

        // Complete the observable when the final pipeline step signals completion
        if (event.type === 'personalize-complete') {
          subscriber.complete();
        }
      };

      // SSE endpoint is the pipeline trigger — processWithStream starts the pipeline
      this.pipeline
        .processWithStream(id, onStep)
        .then(() => {
          if (!subscriber.closed) subscriber.complete();
        })
        .catch((err: Error) => {
          this.logger.error(`[${id}] SSE pipeline error: ${err.message}`);
          if (!subscriber.closed) subscriber.error(err);
        });
    }).pipe(
      // Safety net: close observable after 30s if pipeline hangs (Claude API timeout)
      timeout(30_000),
      finalize(() => {
        // Runs on complete, error, or timeout — ensure closed flag is set
        closed = true;
      }),
    );
  }
}
