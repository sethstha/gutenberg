export function split( { text, formats, selection, value }, start, end ) {
	if ( value !== undefined ) {
		start = start || selection.start;
		end = end || selection.end;

		const [ startValue, endValue ] = split( value, start, end );

		return [
			{
				selection: {},
				value: startValue,
			},
			{
				selection: {
					start: 0,
					end: 0,
				},
				value: endValue,
			},
		];
	}

	return [
		{
			formats: formats.slice( 0, start ),
			text: text.slice( 0, start ),
		},
		{
			formats: formats.slice( end ),
			text: text.slice( end ),
		},
	];
}

export function splitSearch( { text, formats }, string ) {
	let nextStart = 0;

	return text.split( string ).map( ( substring ) => {
		const start = nextStart;

		nextStart += string.length + substring.length;

		return {
			formats: formats.slice( start, start + substring.length ),
			text: substring,
		};
	} );
}
