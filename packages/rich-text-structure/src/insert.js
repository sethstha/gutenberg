export function insert(
	{ value, selection = {} },
	recordToInsert,
	start = selection.start,
	end = selection.end
) {
	if ( value === undefined ) {
		return insertValue( ...arguments );
	}

	const index = start + recordToInsert.value.text.length;

	return {
		selection: {
			start: index,
			end: index,
		},
		value: insertValue( value, recordToInsert.value, start, end ),
	};
}

function insertValue(
	{ formats, text },
	valueToInsert,
	start,
	end
) {
	formats.splice( start, end - start, ...valueToInsert.formats );

	return {
		formats,
		text: text.slice( 0, start ) + valueToInsert.text + text.slice( end ),
	};
}
