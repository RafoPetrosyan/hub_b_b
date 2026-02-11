import { ApiProperty } from '@nestjs/swagger';

export class AdminPaymentMethodDto {
  @ApiProperty({
    description: 'Payment method id',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Payment method name',
    example: 'Credit Card',
  })
  name: string;

  @ApiProperty({
    description: 'Payment method description',
    example: 'Accept credit and debit cards',
    required: false,
  })
  description?: string | null;

  @ApiProperty({
    description: 'Default enabled state',
    example: true,
  })
  default_state: boolean;
}
