export function splice( { formats, text, selection, value }, start, deleteCount, textToInsert = '', formatsToInsert ) {
	if ( value !== undefined ) {
		start = start || selection.start;
		deleteCount = deleteCount || selection.end - selection.start;

		const diff = textToInsert.length - deleteCount;

		return {
			selection: {
				start: selection.start + ( selection.start >= start ? diff : 0 ),
				end: selection.end + ( selection.end >= start ? diff : 0 ),
			},
			value: splice( value, start, deleteCount, textToInsert, formatsToInsert ),
		};
	}

	if ( ! Array.isArray( formatsToInsert ) ) {
		const newFormats = formatsToInsert ? [ formatsToInsert ] : formats[ start ];
		formatsToInsert = Array( textToInsert.length ).fill( newFormats );
	}

	formats.splice( start, deleteCount, ...formatsToInsert );
	text = text.slice( 0, start ) + textToInsert + text.slice( start + deleteCount );

	return { formats, text };
}
