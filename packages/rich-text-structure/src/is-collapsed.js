/**
 * Check wether or not the selection of a rich text record is collapsed.
 *
 * @param {Object} record The rich text record to check.
 *
 * @return {boolean} True if the selection is collapsed, false if not.
 */
export function isCollapsed( { selection } ) {
	const { start, end } = selection;

	if ( ! start ) {
		return;
	}

	if ( typeof start === 'number' ) {
		return start === end;
	}

	const [ startRecord, startOffset ] = start;
	const [ endRecord, endOffset ] = end;

	return startRecord === endRecord && startOffset === endOffset;
}
