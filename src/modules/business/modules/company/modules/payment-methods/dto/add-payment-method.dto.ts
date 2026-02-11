import { IsBoolean, IsNumber, IsOptional, IsString, Matches, Max, Min } from 'class-validator';

/**
 * AddPaymentMethodDto
 *
 * - payment_method_id: preferred (created client-side via Stripe.js)
 * - token: use only for Apple/Google Pay tokens (fallback)
 * - card_number / cvc / exp_month / exp_year / cardholder_name: server-side card creation (PCI scope!!)
 * - make_primary: mark as primary
 */
export class AddPaymentMethodDto {
  @IsOptional()
  @IsString()
  payment_method_id?: string;

  @IsOptional()
  @IsString()
  token?: string;

  // Raw card fields (server-side creation). Use only if payment_method_id/token are not provided.
  @IsOptional()
  @Matches(/^\d{12,19}$/, { message: 'card_number must be 12-19 digits' })
  card_number?: string;

  @IsOptional()
  @Matches(/^\d{3,4}$/, { message: 'cvc must be 3 or 4 digits' })
  cvc?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  exp_month?: number;

  @IsOptional()
  @IsNumber()
  @Min(2022)
  exp_year?: number;

  @IsOptional()
  @IsString()
  cardholder_name?: string;

  @IsOptional()
  @IsBoolean()
  make_primary?: boolean;
}
