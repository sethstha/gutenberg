export function replace(
	{ value },
	pattern,
	replacement,
) {
	if ( value === undefined ) {
		return replaceValue( ...arguments );
	}

	return {
		selection: {},
		value: replaceValue( value, pattern, replacement ),
	};
}

function replaceValue(
	{ formats, text },
	pattern,
	replacement,
) {
	text = text.replace( pattern, ( match, ...rest ) => {
		const offset = rest[ rest.length - 2 ];
		let newText = replacement;
		let newFormats;

		if ( typeof newText === 'function' ) {
			newText = replacement( match, ...rest );
		}

		if ( typeof newText === 'object' ) {
			newFormats = newText.formats;
			newText = newText.text;
		} else {
			newFormats = Array( newText.length ).fill( formats[ offset ] );
		}

		formats.splice( offset, match.length, ...newFormats );

		return newText;
	} );

	return {
		formats,
		text,
	};
}
