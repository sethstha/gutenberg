export function removeFormat(
	{ formats, text, value, selection },
	formatType,
	start = selection.start,
	end = selection.end
) {
	if ( value !== undefined ) {
		if ( Array.isArray( value ) ) {
			return {
				selection,
				value: value.map( ( item, index ) => {
					const [ startRecord, startOffset ] = start;
					const [ endRecord, endOffset ] = end;

					if ( startRecord === endRecord && startRecord === index ) {
						return removeFormat( item, formatType, startOffset, endOffset );
					}

					if ( startRecord === index ) {
						return removeFormat( item, formatType, startOffset, item.text.length );
					}

					if ( endRecord === index ) {
						return removeFormat( item, formatType, 0, endOffset );
					}

					if ( index > startRecord && index < endRecord ) {
						return removeFormat( item, formatType, 0, item.text.length );
					}

					return item;
				} ),
			};
		}

		return {
			selection,
			value: removeFormat( value, formatType, start, end ),
		};
	}

	for ( let i = start; i < end; i++ ) {
		if ( formats[ i ] ) {
			const newFormats = formats[ i ].filter( ( { type } ) => type !== formatType );
			formats[ i ] = newFormats.length ? newFormats : undefined;
		}
	}

	return { formats, text };
}
