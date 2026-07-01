import { env } from '@questgen/env/web';

const REQUEST_ACCESS_FORM_FALLBACK = 'https://forms.gle/placeholder';

export const isBetaMode = env.VITE_BETA_MODE;

export const requestAccessFormUrl =
  env.VITE_REQUEST_ACCESS_FORM_URL ?? REQUEST_ACCESS_FORM_FALLBACK;
