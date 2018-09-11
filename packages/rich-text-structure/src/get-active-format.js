/**
 * External dependencies
 */

import { find } from 'lodash';

export function getActiveFormat( { value, selection }, formatType ) {
	if ( ! selection || selection.start === undefined ) {
		return;
	}

	const formats = value.formats[ selection.start ];

	return find( formats, { type: formatType } );
}
