export function isSelectionEqual(
	{ start: start1, end: end1 },
	{ start: start2, end: end2 }
) {
	return start1 === start2 && end1 === end2;
}
