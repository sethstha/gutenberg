export function splice(
	{ value, selection = {} },
	start = selection.start,
	deleteCount = selection.end - selection.start,
	textToInsert = '',
	formatsToInsert
) {
	if ( value === undefined ) {
		return spliceValue( ...arguments );
	}

	const diff = textToInsert.length - deleteCount;

	return {
		selection: {
			start: selection.start + ( selection.start >= start ? diff : 0 ),
			end: selection.end + ( selection.end >= start ? diff : 0 ),
		},
		value: spliceValue( value, start, deleteCount, textToInsert, formatsToInsert ),
	};
}

export function spliceValue(
	{ formats, text },
	start,
	deleteCount,
	textToInsert = '',
	formatsToInsert
) {
	if ( ! Array.isArray( formatsToInsert ) ) {
		const newFormats = formatsToInsert ? [ formatsToInsert ] : formats[ start ];
		formatsToInsert = Array( textToInsert.length ).fill( newFormats );
	}

	formats.splice( start, deleteCount, ...formatsToInsert );
	text = text.slice( 0, start ) + textToInsert + text.slice( start + deleteCount );

	return { formats, text };
}
