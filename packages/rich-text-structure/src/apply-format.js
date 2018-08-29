export function applyFormat(
	{ formats, text, value, selection },
	format,
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
						return applyFormat( item, format, startOffset, endOffset );
					}

					if ( startRecord === index ) {
						return applyFormat( item, format, startOffset, item.text.length );
					}

					if ( endRecord === index ) {
						return applyFormat( item, format, 0, endOffset );
					}

					if ( index > startRecord && index < endRecord ) {
						return applyFormat( item, format, 0, item.text.length );
					}

					return item;
				} ),
			};
		}

		return {
			selection,
			value: applyFormat( value, format, start, end ),
		};
	}

	for ( let i = start; i < end; i++ ) {
		if ( formats[ i ] ) {
			const newFormats = formats[ i ].filter( ( { type } ) => type !== format.type );
			newFormats.push( format );
			formats[ i ] = newFormats;
		} else {
			formats[ i ] = [ format ];
		}
	}

	return { formats, text };
}
