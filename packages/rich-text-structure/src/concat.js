export function concat( record, ...records ) {
	if ( Array.isArray( record ) ) {
		return record.concat( ...records );
	}

	return records.reduce( ( accu, { formats, text } ) => {
		accu.text += text;
		accu.formats.push( ...formats );
		return accu;
	}, { ...record } );
}
