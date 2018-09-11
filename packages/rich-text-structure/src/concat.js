export function concat( record, ...records ) {
	return records.reduce( ( accumlator, { formats, text } ) => {
		accumlator.text += text;
		accumlator.formats = accumlator.formats.concat( formats );
		return accumlator;
	}, { ...record } );
}
