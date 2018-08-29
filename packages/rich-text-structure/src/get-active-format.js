/**
 * External dependencies
 */

import { find } from 'lodash';

export function getActiveFormat( { value, selection }, formatType ) {
	if ( ! selection || ! selection.start ) {
		return false;
	}

	if ( Array.isArray( value ) ) {
		return getActiveFormat( {
			value: value[ selection.start[ 0 ] ],
			selection: {
				start: selection.start[ 1 ],
				end: selection.end[ 1 ],
			},
		}, formatType );
	}

	const formats = value.formats[ selection.start ];

	return find( formats, { type: formatType } );
}
