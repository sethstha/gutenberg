export function isEmpty( { value } ) {
	if ( value === undefined ) {
		return isEmptyValue( ...arguments );
	}

	return isEmptyValue( value );
}

function isEmptyValue( { text, formats } ) {
	return text.length === 0 && formats.length === 0;
}
