export function getTextContent( { text, value } ) {
	if ( value === undefined ) {
		return text;
	}

	return value.text;
}
