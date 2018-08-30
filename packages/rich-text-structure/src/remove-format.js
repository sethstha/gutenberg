export function removeFormat(
	{ value, selection = {} },
	formatType,
	start = selection.start,
	end = selection.end
) {
	if ( value === undefined ) {
		return removeFormatFromValue( ...arguments );
	}

	if ( Array.isArray( value ) ) {
		return {
			selection,
			value: value.map( ( item, index ) => {
				const [ startRecord, startOffset ] = start;
				const [ endRecord, endOffset ] = end;

				if ( startRecord === endRecord && startRecord === index ) {
					return removeFormatFromValue( item, formatType, startOffset, endOffset );
				}

				if ( startRecord === index ) {
					return removeFormatFromValue( item, formatType, startOffset, item.text.length );
				}

				if ( endRecord === index ) {
					return removeFormatFromValue( item, formatType, 0, endOffset );
				}

				if ( index > startRecord && index < endRecord ) {
					return removeFormatFromValue( item, formatType, 0, item.text.length );
				}

				return item;
			} ),
		};
	}

	return {
		selection,
		value: removeFormatFromValue( value, formatType, start, end ),
	};
}

export function removeFormatFromValue(
	{ formats, text },
	formatType,
	start,
	end
) {
	for ( let i = start; i < end; i++ ) {
		if ( formats[ i ] ) {
			const newFormats = formats[ i ].filter( ( { type } ) => type !== formatType );
			formats[ i ] = newFormats.length ? newFormats : undefined;
		}
	}

	return { formats, text };
}
