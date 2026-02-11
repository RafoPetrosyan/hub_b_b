import { SetMetadata } from '@nestjs/common';

export const ADDON_REQUIRED_KEY = 'required_addon';

export const RequireAddOn = (slugOrId: string) =>
  SetMetadata(ADDON_REQUIRED_KEY, slugOrId);
