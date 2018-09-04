export function concat( record, ...records ) {
	if ( Array.isArray( record ) ) {
		return record.concat( ...records );
	}

	return records.reduce( ( accumlator, { formats, text } ) => {
		accumlator.text += text;
		accumlator.formats.push( ...formats );
		return accumlator;
	}, { ...record } );
}
