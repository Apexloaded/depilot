import { BadRequestException, Injectable } from '@nestjs/common';
import type { CreateDealDto, UpdateDealDto } from '@repo/api';
import { ALLOWED_INITIAL_STATUSES } from './deal.constant';
import {
  CreateDealInput,
  DealStatus,
  dealStore,
  userStore,
} from '@repo/firebase';

@Injectable()
export class DealService {
  async create(dto: CreateDealDto) {
    const initialStatus = dto.stage;

    if (!ALLOWED_INITIAL_STATUSES.has(initialStatus)) {
      throw new BadRequestException(
        `Cannot create a deal with initial status "${initialStatus}". ` +
        `Allowed: ${[...ALLOWED_INITIAL_STATUSES].join(', ')}`,
      );
    }

    this.validateBuyersInput(dto.buyers);

    // ── Guard: OFFER_ISSUED requires at least one item ──────────────────────
    if (
      initialStatus === DealStatus.OFFER_ISSUED &&
      (!dto.items || dto.items.length === 0)
    ) {
      throw new BadRequestException(
        `A deal created as OFFER_ISSUED must include at least one plot or property.`,
      );
    }

    if (
      initialStatus !== DealStatus.OFFER_ISSUED &&
      dto.items &&
      dto.items.length > 0
    ) {
      throw new BadRequestException(
        `A deal created with deal items must have it's deal stage as Offer Issued. Select Offer Issued in deal stage to proceed.`,
      );
    }

    // Validate parties exist
    const allUserIds = [
      ...dto.buyers.map((b) => b.userId),
      dto.agentId,
      dto.sellerId,
    ].filter(Boolean) as string[];

    const users = await userStore.findManyById(allUserIds);
    const foundIds = new Set(users.map((u) => u.id));

    for (const b of dto.buyers) {
      if (!foundIds.has(b.userId)) {
        throw new BadRequestException(
          `Buyer user ${b.userId} not found or is inactive`,
        );
      }
    }
    if (dto.agentId && !foundIds.has(dto.agentId)) {
      throw new BadRequestException(
        `Agent ${dto.agentId} not found or is inactive`,
      );
    }

    const dealInput: CreateDealInput = {
      deal: {
        title: dto.title,
        dealType: dto.dealType,
        status: dto.stage,
        sellerId: dto.sellerId,
        agentId: dto.agentId,
        buyerIds: dto.buyers.map((b) => b.userId),
        primaryBuyer: dto.buyers.find((b) => b.isPrimary),
      },
      items: dto.items?.map((item) => {
        return {
          itemType: item.itemType,
          plotId: item.plotId,
          propertyId: item.propertyId,
          agreedPrice: item.agreedPrice,
        };
      }),
    };

    // Create a new deal
    return await dealStore.create(dealInput);
  }

  findAll() {
    return `This action returns all deal`;
  }

  findOne(id: number) {
    return `This action returns a #${id} deal`;
  }

  update(id: number, updateDealDto: UpdateDealDto) {
    return `This action updates a #${id} deal`;
  }

  remove(id: number) {
    return `This action removes a #${id} deal`;
  }

  private validateBuyersInput(
    buyers: Array<{ userId: string; isPrimary: boolean }>,
  ): void {
    if (!buyers || buyers.length === 0) {
      throw new BadRequestException('At least one buyer is required');
    }

    const primaryCount = buyers.filter((b) => b.isPrimary).length;

    if (primaryCount === 0) {
      throw new BadRequestException(
        'Exactly one buyer must be marked as primary (isPrimary: true)',
      );
    }

    if (primaryCount > 1) {
      throw new BadRequestException(
        `Only one buyer can be primary. You marked ${primaryCount} buyers as primary.`,
      );
    }

    // Check for duplicate userIds within the submitted list
    const userIds = buyers.map((b) => b.userId);
    const uniqueIds = new Set(userIds);
    if (uniqueIds.size !== userIds.length) {
      throw new BadRequestException(
        'Duplicate buyers detected. Each buyer can only appear once in a deal.',
      );
    }
  }
}
