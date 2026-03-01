import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateLeadDto) {
    return this.prisma.lead.create({
      data: {
        name: dto.name,
        companyName: dto.companyName,
        companyUrl: dto.companyUrl,
        // status defaults to 'pending' per schema
      },
    });
  }

  async findAll() {
    return this.prisma.lead.findMany({
      select: {
        id: true,
        name: true,
        companyName: true,
        icpScore: true,
        status: true,
        industry: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const lead = await this.prisma.lead.findUniqueOrThrow({ where: { id } });
    const aiOutputs = await this.prisma.aIOutput.findMany({
      where: { leadId: id },
      select: { step: true, content: true, createdAt: true },
    });
    return { ...lead, aiOutputs };
  }
}
