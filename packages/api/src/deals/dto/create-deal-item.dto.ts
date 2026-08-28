import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { DealItemType } from '@repo/firebase';

export class CreateDealItemDto {
  @IsEnum(DealItemType)
  itemType: DealItemType;

  @IsOptional()
  @IsUUID()
  plotId?: string;

  @IsOptional()
  @IsUUID()
  propertyId?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  agreedPrice!: number;

  @IsOptional()
  @IsDateString()
  reservedUntil?: string;

  @IsOptional()
  @IsBoolean()
  resale?: boolean = false;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class AddDealItemDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDealItemDto)
  items?: CreateDealItemDto[];
}

export class UpdateDealItemDto extends PartialType(CreateDealItemDto) {
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  agreedPrice?: number;
}
