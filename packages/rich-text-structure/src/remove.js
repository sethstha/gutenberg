/**
 * Internal dependencies
 */

import { insert } from './insert';
import { create, createValue } from './create';

export function remove( record, start, end ) {
	const toInsert = record.value === undefined ? createValue() : create();
	return insert( record, toInsert, start, end );
}
