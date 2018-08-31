export function isSelectionEqual(
	{ start: start1, end: end1 },
	{ start: start2, end: end2 }
) {
	// Comparing multiline selection.
	if ( Array.isArray( start1 ) ) {
		return (
			start1[ 0 ] === start2[ 0 ] &&
			start1[ 1 ] === start2[ 1 ] &&
			end1[ 0 ] === end2[ 0 ] &&
			end1[ 1 ] === end2[ 1 ]
		);
	}

	return start1 === start2 && end1 === end2;
}
