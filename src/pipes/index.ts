import { SharpInstance } from 'sharp';
import { pipe } from 'ramda';
import { InputQueryParams } from '../QueryParams';
import { manipulate } from './manipulation';
import { convert } from './conversion';

export type SupportedInputMime =
  | 'image/jpeg'
  | 'image/gif'
  | 'image/png'
  | 'image/svg+xml';

export type SupportedOutputMime =
  | 'image/jpeg'
  | 'image/webp'
  | 'image/png'
  | 'image/svg+xml';

export type PipeOutput = {
  transformer: SharpInstance;
  mime: SupportedOutputMime;
};

export function isSupportedInputMime(
  mime: string | null
): mime is SupportedInputMime {
  return ['image/jpeg', 'image/gif', 'image/png', 'image/svg+xml'].some(
    x => x === mime
  );
}

export function isBase64Supported(
  mime: string | null
): mime is SupportedOutputMime {
  return ['image/jpeg', 'image/webp', 'image/png'].some(x => x === mime);
}

export const createPipe = (
  queryParams: InputQueryParams,
  inputMime: SupportedInputMime,
  inputTransformer: SharpInstance
): PipeOutput =>
  pipe(
    manipulate(queryParams),
    convert(queryParams, inputMime)
  )(inputTransformer);
