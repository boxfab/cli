import * as sdk from 'boxfab'

export function sortTemplatesAliases<
  E extends sdk.components['schemas']['Template']['aliases'],
>(aliases: E) {
  aliases?.sort()
}
