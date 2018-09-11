export function slice(
	{ value, selection },
	start = selection.start,
	end = selection.end
) {
	if ( value === undefined ) {
		return sliceValue( ...arguments );
	}

	if ( start === undefined || end === undefined ) {
		return { value, selection };
	}

	return {
		selection: {},
		value: sliceValue( value, start, end ),
	};
}

function sliceValue( { formats, text }, start, end ) {
	return {
		formats: formats.slice( start, end ),
		text: text.slice( start, end ),
	};
}
