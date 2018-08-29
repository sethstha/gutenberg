export function isEmpty( record ) {
	if ( Array.isArray( record ) ) {
		return record.length === 0 || ( record.length === 1 && isEmpty( record[ 0 ] ) );
	}

	const { text, formats } = record;

	return text.length === 0 && formats.length === 0;
}
