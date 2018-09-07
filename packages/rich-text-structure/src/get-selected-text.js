/**
 * Internal dependencies
 */

export function getSelectedText( { value, selection } ) {
	if ( Array.isArray( value ) ) {
		return '';
	}

	return value.text.slice( selection.start, selection.end );
}
