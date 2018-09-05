/**
 * External dependencies
 */

import { find } from 'lodash';

export function removeFormat(
	{ value, selection = {} },
	formatType,
	start = selection.start,
	end = selection.end
) {
	if ( value === undefined ) {
		return removeFormatFromValue( ...arguments );
	}

	if ( Array.isArray( value ) ) {
		return {
			selection,
			value: value.map( ( item, index ) => {
				const [ startRecord, startOffset ] = start;
				const [ endRecord, endOffset ] = end;

				if ( startRecord === endRecord && startRecord === index ) {
					return removeFormatFromValue( item, formatType, startOffset, endOffset );
				}

				if ( startRecord === index ) {
					return removeFormatFromValue( item, formatType, startOffset, item.text.length );
				}

				if ( endRecord === index ) {
					return removeFormatFromValue( item, formatType, 0, endOffset );
				}

				if ( index > startRecord && index < endRecord ) {
					return removeFormatFromValue( item, formatType, 0, item.text.length );
				}

				return item;
			} ),
		};
	}

	return {
		selection,
		value: removeFormatFromValue( value, formatType, start, end ),
	};
}

function filterFormats( formats, index, formatType ) {
	const newFormats = formats[ index ].filter( ( { type } ) => type !== formatType );

	if ( newFormats.length ) {
		formats[ index ] = newFormats;
	} else {
		formats[ index ] = undefined;
	}
}

export function removeFormatFromValue(
	{ formats, text },
	formatType,
	start,
	end
) {
	// If the selection is collapsed, expand start and end to the edges of the
	// format.
	if ( start === end ) {
		const format = find( formats[ start ], { type: formatType } );

		while ( find( formats[ start ], format ) ) {
			filterFormats( formats, start, formatType );
			start--;
		}

		end++;

		while ( find( formats[ end ], format ) ) {
			filterFormats( formats, end, formatType );
			end++;
		}
	} else {
		for ( let i = start; i < end; i++ ) {
			if ( formats[ i ] ) {
				filterFormats( formats, i, formatType );
			}
		}
	}

	return { formats, text };
}
