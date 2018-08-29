/**
 * Internal dependencies
 */

import { isCollapsed } from './is-collapsed';

export function getTextContent( { text, value, selection } ) {
	if ( value !== undefined ) {
		if ( Array.isArray( value ) ) {
			if ( isCollapsed( { selection } ) ) {
				const [ index ] = selection.start;
				return value[ index ].text;
			}

			return '';
		}

		return value.text;
	}

	return text;
}
