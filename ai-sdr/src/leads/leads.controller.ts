import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SkipThrottle, Throttle, seconds } from '@nestjs/throttler';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';

@Controller('leads')
export class LeadsController {
  private readonly logger = new Logger(LeadsController.name);

  constructor(private readonly leadsService: LeadsService) {}

  @Throttle({ default: { limit: 5, ttl: seconds(60) } })
  @Post()
  async create(@Body() dto: CreateLeadDto): Promise<{ id: string }> {
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
}
