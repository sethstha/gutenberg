export function concat( record, ...records ) {
	return records.reduce( ( accumlator, { formats, text } ) => {
		accumlator.text += text;
		accumlator.formats.push( ...formats );
		return accumlator;
	}, { ...record } );
}
