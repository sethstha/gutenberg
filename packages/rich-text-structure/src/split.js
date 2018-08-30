export function split( record, string ) {
	if ( typeof string !== 'string' ) {
		if ( record.value !== undefined ) {
			return splitRecordAtSelection( ...arguments );
		}

		return splitValueAtSelection( ...arguments );
	}

	const { text, formats } = record;
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

function splitRecordAtSelection(
	{ value, selection },
	start = selection.start,
	end = selection.end
) {
	const [ startValue, endValue ] = splitValueAtSelection( value, start, end );

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

function splitValueAtSelection( { text, formats }, start, end ) {
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
