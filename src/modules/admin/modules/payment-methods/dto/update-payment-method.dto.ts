import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdatePaymentMethodDto {
  @ApiPropertyOptional({
    description: 'Payment method name',
    example: 'Credit Card',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({
    description: 'Payment method description',
    example: 'Accept credit and debit cards',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @ApiPropertyOptional({
    description: 'Default enabled state',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  default_state?: boolean;
}
