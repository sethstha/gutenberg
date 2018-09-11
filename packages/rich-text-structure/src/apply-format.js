export function applyFormat(
	{ value, selection = {} },
	format,
	start = selection.start,
	end = selection.end
) {
	if ( value === undefined ) {
		return applyFormatToValue( ...arguments );
	}

	return {
		selection,
		value: applyFormatToValue( value, format, start, end ),
	};
}

function applyFormatToValue(
	{ formats, text },
	format,
	start,
	end
) {
	for ( let i = start; i < end; i++ ) {
		if ( formats[ i ] ) {
			const newFormats = formats[ i ].filter( ( { type } ) => type !== format.type );
			newFormats.push( format );
			formats[ i ] = newFormats;
		} else {
			formats[ i ] = [ format ];
		}
	}

	return { formats, text };
}
