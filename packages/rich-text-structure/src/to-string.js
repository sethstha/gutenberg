/**
 * Internal dependencies
 */

import { toDOM } from './to-dom';

/**
 * Creates an HTML string from a rich text record.
 *
 * @param {Object} record    Rich text record.
 * @param {string} multiline Multiline tag.
 *
 * @return {string} HTML string.
 */
export function toString( record, multiline ) {
	return toDOM( { value: record }, multiline ).body.innerHTML;
}
