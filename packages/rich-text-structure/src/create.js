/**
 * Browser dependencies
 */

const { TEXT_NODE, ELEMENT_NODE } = window.Node;

/**
 * Parse the given HTML into a body element.
 *
 * @param {string} html The HTML to parse.
 *
 * @return {HTMLBodyElement} Body element with parsed HTML.
 */
function createElement( html ) {
	const document = document.implementation.createHTMLDocument( '' );

	document.body.innerHTML = html;

	return document.body;
}

/**
 * Creates rich text value and selection objects from a DOM element and range.
 *
 * @param {HTMLElement} element   Element to create value object from.
 * @param {Range}       range     Range to create selection object from.
 * @param {string}      multiline Multiline tag if the structure is multiline.
 * @param {Object}      settings  Settings passed to `createRecord`.
 *
 * @return {Object} A rich text record.
 */
export function create( element, range, multiline, settings ) {
	if ( typeof element === 'string' ) {
		element = createElement( element );
	}

	if ( ! multiline ) {
		return createRecord( element, range, settings );
	}

	if ( ! element || ! element.hasChildNodes() ) {
		return {
			value: [],
			selection: {},
		};
	}

	return Array.from( element.childNodes ).reduce( ( acc, child, index ) => {
		if ( child.nodeName.toLowerCase() === multiline ) {
			const { selection, value } = createRecord( child, range, settings );

			if ( range ) {
				if ( selection.start !== undefined ) {
					acc.selection.start = [ index ].concat( selection.start );
				} else if ( child === range.startContainer ) {
					acc.selection.start = [ index ];
				}

				if ( selection.end !== undefined ) {
					acc.selection.end = [ index ].concat( selection.end );
				} else if ( child === range.endContainer ) {
					acc.selection.end = [ index ];
				}
			}

			acc.value.push( value );
		}

		return acc;
	}, {
		value: [],
		selection: {},
	} );
}

/**
 * Creates a rich text value object from a DOM element.
 *
 * @param {HTMLElement} element   Element to create value object from.
 * @param {string}      multiline Multiline tag.
 * @param {Object}      settings  Settings passed to `createRecord`.
 *
 * @return {Object} A rich text value object.
 */
export function createValue( element, multiline, settings ) {
	return create( element, null, multiline, settings ).value;
}

/**
 * Creates rich text value and selection objects from a DOM element and range.
 *
 * @param {HTMLElement} element                 Element to create value object
 *                                              from.
 * @param {Range}       range                   Range to create selection object
 *                                              from.
 * @param {Object}    $3                      Settings.
 * @param {Function}    $3.removeNodeMatch      Function to declare whether the
 *                                              given node should be removed.
 * @param {Function}    $3.unwrapNodeMatch      Function to declare whether the
 *                                              given node should be unwrapped.
 * @param {Function}    $3.filterString         Function to filter the given
 *                                              string.
 * @param {Function}    $3.removeAttributeMatch Wether to remove an attribute
 *                                              based on the name.
 *
 * @return {Object} A rich text record.
 */
function createRecord( element, range, $3 = {} ) {
	if ( ! element ) {
		return {
			value: {
				formats: [],
				text: '',
			},
			selection: {},
		};
	}

	const {
		removeNodeMatch = () => false,
		unwrapNodeMatch = () => false,
		filterString = ( string ) => string,
		removeAttributeMatch,
	} = $3;

	const filterStringComplete = ( string ) => filterString( string.replace( '\n', '' ) );

	if (
		element.nodeName === 'BR' &&
		! removeNodeMatch( element ) &&
		! unwrapNodeMatch( element )
	) {
		return {
			value: {
				formats: [ undefined ],
				text: '\n',
			},
			selection: {},
		};
	}

	if ( ! element.hasChildNodes() ) {
		return {
			value: {
				formats: [],
				text: '',
			},
			selection: {},
		};
	}

	return Array.from( element.childNodes ).reduce( ( accumulator, node ) => {
		const { formats } = accumulator.value;

		if ( node.nodeType === TEXT_NODE ) {
			if ( range ) {
				if ( node === range.startContainer ) {
					accumulator.selection.start = accumulator.value.text.length + filterStringComplete( node.nodeValue.slice( 0, range.startOffset ) ).length;
				}

				if ( node === range.endContainer ) {
					accumulator.selection.end = accumulator.value.text.length + filterStringComplete( node.nodeValue.slice( 0, range.endOffset ) ).length;
				}
			}

			const text = filterStringComplete( node.nodeValue, accumulator.selection );
			accumulator.value.text += text;
			formats.push( ...Array( text.length ) );
		} else if ( node.nodeType === ELEMENT_NODE ) {
			if ( removeNodeMatch( node ) ) {
				return accumulator;
			}

			if ( range ) {
				if (
					node.parentNode === range.startContainer &&
					node === range.startContainer.childNodes[ range.startOffset ]
				) {
					accumulator.selection.start = accumulator.value.text.length;
				}

				if (
					node.parentNode === range.endContainer &&
					node === range.endContainer.childNodes[ range.endOffset ]
				) {
					accumulator.selection.end = accumulator.value.text.length;
				}
			}

			let format;

			if ( ! unwrapNodeMatch( node ) && node.nodeName !== 'BR' ) {
				const type = node.nodeName.toLowerCase();
				const attributes = getAttributes( node, { removeAttributeMatch } );

				format = attributes ? { type, attributes } : { type };
			}

			const { value, selection } = createRecord( node, range, $3 );
			const text = value.text;
			const start = accumulator.value.text.length;

			if ( format && text.length === 0 ) {
				format.object = true;

				if ( formats[ start ] ) {
					formats[ start ].unshift( format );
				} else {
					formats[ start ] = [ format ];
				}
			} else {
				accumulator.value.text += text;

				let i = value.formats.length;

				while ( i-- ) {
					const index = start + i;

					if ( format ) {
						if ( formats[ index ] ) {
							formats[ index ].push( format );
						} else {
							formats[ index ] = [ format ];
						}
					}

					if ( value.formats[ i ] ) {
						if ( formats[ index ] ) {
							formats[ index ].push( ...value.formats[ i ] );
						} else {
							formats[ index ] = value.formats[ i ];
						}
					}

					if ( ! formats[ index ] ) {
						formats[ index ] = undefined;
					}
				}
			}

			if ( selection.start !== undefined ) {
				accumulator.selection.start = start + selection.start;
			}

			if ( selection.end !== undefined ) {
				accumulator.selection.end = start + selection.end;
			}
		}

		return accumulator;
	}, {
		value: {
			formats: [],
			text: '',
		},
		selection: {},
	} );
}

/**
 * Gets the attributes of an element in object shape.
 *
 * @param {HTMLElement} element                 Element to get attributes from.
 * @param {Function}    $2.removeAttributeMatch Wether to remove an attribute
 *                                              based on the name.
 *
 * @return {?Object} Attribute object or `undefined` if the element has no
 *                   attributes.
 */
function getAttributes( element, {
	removeAttributeMatch = () => false,
} ) {
	if ( ! element.hasAttributes() ) {
		return;
	}

	return Array.from( element.attributes ).reduce( ( acc, { name, value } ) => {
		if ( ! removeAttributeMatch( name ) ) {
			acc = acc || {};
			acc[ name ] = value;
		}

		return acc;
	}, undefined );
}
