import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';

// Predefined color palette (excluding purple per user instruction)
const COLOR_PALETTE = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet (NOT purple)
  '#ec4899', // pink
  '#64748b', // slate
  '#f43f5e', // rose
];

@Injectable()
export class LabelsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Verify user is member of organization
   */
  private async verifyMembership(userId: string, organizationId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('Forbidden: You are not a member of this organization');
    }

    return membership;
  }

  /**
   * Get random color from predefined palette
   */
  private getRandomColor(): string {
    const randomIndex = Math.floor(Math.random() * COLOR_PALETTE.length);
    return COLOR_PALETTE[randomIndex]!;
  }

  /**
   * Create a label in the organization
   */
  async create(organizationId: string, name: string, color: string | undefined, userId: string) {
    // Verify user is member of this organization
    await this.verifyMembership(userId, organizationId);

    // Use provided color or random from palette
    const labelColor = color || this.getRandomColor();

    const label = await this.prisma.label.create({
      data: {
        name,
        color: labelColor,
        organizationId,
      },
    });

    return label;
  }

  /**
   * Find all labels in an organization
   */
  async findAllByOrg(organizationId: string, userId: string) {
    // Verify user is member of this organization
    await this.verifyMembership(userId, organizationId);

    const labels = await this.prisma.label.findMany({
      where: {
        organizationId,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return labels;
  }

  /**
   * Update a label
   */
  async update(
    labelId: string,
    name: string | undefined,
    color: string | undefined,
    userId: string,
    organizationId: string,
  ) {
    // Find label
    const label = await this.prisma.label.findUnique({
      where: { id: labelId },
    });

    if (!label) {
      throw new NotFoundException('Label not found');
    }

    // Verify label belongs to this organization
    if (label.organizationId !== organizationId) {
      throw new ForbiddenException('Forbidden: Label does not belong to this organization');
    }

    // Verify user is member of this organization
    await this.verifyMembership(userId, organizationId);

    const updatedLabel = await this.prisma.label.update({
      where: { id: labelId },
      data: {
        ...(name !== undefined && { name }),
        ...(color !== undefined && { color }),
      },
    });

    return updatedLabel;
  }

  /**
   * Delete a label
   */
  async remove(labelId: string, userId: string, organizationId: string) {
    // Find label
    const label = await this.prisma.label.findUnique({
      where: { id: labelId },
    });

    if (!label) {
      throw new NotFoundException('Label not found');
    }

    // Verify label belongs to this organization
    if (label.organizationId !== organizationId) {
      throw new ForbiddenException('Forbidden: Label does not belong to this organization');
    }

    // Verify user is member of this organization
    await this.verifyMembership(userId, organizationId);

    await this.prisma.label.delete({
      where: { id: labelId },
    });

    return { success: true };
  }
}
