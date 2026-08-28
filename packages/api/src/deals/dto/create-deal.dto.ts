import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DealStatus, DealType } from '@repo/firebase';
import { CreateDealItemDto } from './create-deal-item.dto';

export type OfferExpiry = '3d' | '1w' | '2w' | '1m' | '3m';

export class CreateDealBuyerDto {
  @IsUUID()
  @IsNotEmpty()
  userId!: string;

  /**
   * Exactly one buyer per deal must be primary.
   * The primary buyer:
   *   - Becomes Plot.ownerId / Property.ownerId on deal completion
   *   - Is the legal title holder on generated documents
   *   - Appears as newOwnerId in PlotHistory
   * Co-buyers are tracked via PlotAllocation but do not hold Plot.ownerId
   */
  @IsBoolean()
  isPrimary!: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateDealDto {
  @IsEnum(DealType)
  dealType!: DealType;

  @IsOptional()
  @IsString()
  title?: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'At least one buyer is required' })
  @ValidateNested({ each: true })
  @Type(() => CreateDealBuyerDto)
  buyers!: CreateDealBuyerDto[];

  @IsOptional()
  @IsUUID()
  sellerId?: string;

  @IsOptional()
  @IsUUID()
  agentId?: string;

  @IsOptional()
  @IsUUID()
  leadId?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  commissionRate?: number;

  @IsOptional()
  @IsString()
  termsConditions?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsDateString()
  offerDate?: string;

  @IsOptional()
  offerExpiryDate?: OfferExpiry;

  @IsOptional()
  @IsDateString()
  contractDate?: string;

  @IsOptional()
  @IsDateString()
  expectedCloseDate?: string;

  @IsOptional()
  @IsIn([DealStatus.ENQUIRY, DealStatus.NEGOTIATION, DealStatus.OFFER_ISSUED], {
    message:
      'initialStatus must be one of: ENQUIRY, NEGOTIATION, OFFER_ISSUED. ' +
      'Deals cannot be created as CONTRACTED, COMPLETED, CANCELLED, or LOST.',
  })
  stage?: DealStatus = DealStatus.ENQUIRY;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDealItemDto)
  items?: CreateDealItemDto[];
}
