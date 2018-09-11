export function join( [ record, ...records ], separator ) {
	if ( ! record ) {
		return {
			formats: [],
			text: '',
		};
	}

	return records.reduce( ( accumlator, { formats, text } ) => {
		if ( typeof separator === 'string' ) {
			separator = {
				formats: Array( separator.length ),
				text: separator,
			};
		}

		accumlator.text += separator.text + text;
		accumlator.formats = accumlator.formats.concat( separator.formats, formats );
		return accumlator;
	}, { ...record } );
}
