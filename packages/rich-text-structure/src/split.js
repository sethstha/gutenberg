export function split( { selection, value }, string ) {
	if ( typeof string !== 'string' ) {
		if ( value === undefined ) {
			return splitValueAtSelection( ...arguments );
		}

		return splitRecordAtSelection( ...arguments );
	}

	if ( value === undefined ) {
		return splitValue( ...arguments );
	}

	let nextStart = 0;

	return splitValue( value, string ).map( ( piece ) => {
		const splitSelection = {};
		const start = nextStart;

		nextStart += piece.text.length + string.length;

		if ( selection.start > start && selection.start < nextStart ) {
			splitSelection.start = selection.start - start;
		} else if ( selection.start < start && selection.end > start ) {
			splitSelection.start = 0;
		}

		if ( selection.end > start && selection.end < nextStart ) {
			splitSelection.end = selection.end - start;
		} else if ( selection.start < nextStart && selection.end > nextStart ) {
			splitSelection.end = piece.text.length;
		}

		return {
			selection: splitSelection,
			value: piece,
		};
	} );
}

function splitValue( { text, formats }, string ) {
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
