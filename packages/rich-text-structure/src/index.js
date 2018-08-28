/**
 * External dependencies
 */

import { find } from 'lodash';

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
	const doc = document.implementation.createHTMLDocument( '' );

	doc.body.innerHTML = html;

	return doc.body;
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
export function createWithSelection( element, range, multiline, settings ) {
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
export function create( element, multiline, settings ) {
	return createWithSelection( element, null, multiline, settings ).value;
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
 * Applies the given element tree and selection to the live DOM (very basic diff
 * for now).
 *
 * @param {Object}      value     Object with the element tree and selection
 *                                paths to apply.
 * @param {HTMLElement} current   The live root node to apply the element tree
 *                                to.
 * @param {string}     multiline Multiline tag.
 */
export function apply( value, current, multiline ) {
	const { body: future, selection } = toDOM( value, multiline );
	let i = 0;

	while ( future.firstChild ) {
		const currentChild = current.childNodes[ i ];
		const futureNodeType = future.firstChild.nodeType;

		if ( ! currentChild ) {
			current.appendChild( future.firstChild );
		} else if (
			futureNodeType !== currentChild.nodeType ||
			futureNodeType !== TEXT_NODE ||
			future.firstChild.nodeValue !== currentChild.nodeValue
		) {
			current.replaceChild( future.firstChild, currentChild );
		} else {
			future.removeChild( future.firstChild );
		}

		i++;
	}

	while ( current.childNodes[ i ] ) {
		current.removeChild( current.childNodes[ i ] );
	}

	if ( ! selection.startPath.length ) {
		return;
	}

	const { node: startContainer, offset: startOffset } = getNodeByPath( current, selection.startPath );
	const { node: endContainer, offset: endOffset } = getNodeByPath( current, selection.endPath );

	const sel = window.getSelection();
	const range = current.ownerDocument.createRange();
	const collapsed = startContainer === endContainer && startOffset === endOffset;

	if (
		collapsed &&
		startOffset === 0 &&
		startContainer.previousSibling &&
		startContainer.previousSibling.nodeType === ELEMENT_NODE &&
		startContainer.previousSibling.nodeName !== 'BR'
	) {
		startContainer.insertData( 0, '\uFEFF' );
		range.setStart( startContainer, 1 );
		range.setEnd( endContainer, 1 );
	} else if (
		collapsed &&
		startOffset === 0 &&
		startContainer === TEXT_NODE &&
		startContainer.nodeValue.length === 0
	) {
		startContainer.insertData( 0, '\uFEFF' );
		range.setStart( startContainer, 1 );
		range.setEnd( endContainer, 1 );
	} else {
		range.setStart( startContainer, startOffset );
		range.setEnd( endContainer, endOffset );
	}

	sel.removeAllRanges();
	sel.addRange( range );
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

/**
 * Creates a path as an array of indices from the given root node to the given
 * node.
 *
 * @param {Node}        node     Node to find the path of.
 * @param {HTMLElement} rootNode Root node to find the path from.
 * @param {Array}       path     Initial path to build on.
 *
 * @return {Array} The path from the root node to the node.
 */
function createPathToNode( node, rootNode, path ) {
	const parentNode = node.parentNode;
	let i = 0;

	while ( ( node = node.previousSibling ) ) {
		i++;
	}

	path = [ i, ...path ];

	if ( parentNode !== rootNode ) {
		path = createPathToNode( parentNode, rootNode, path );
	}

	return path;
}

/**
 * Gets a node given a path (array of indices) from the given node.
 *
 * @param {HTMLElement} node Root node to find the wanted node in.
 * @param {Array}       path Path (indices) to the wanted node.
 *
 * @return {Object} Object with the found node and the remaining offset if any.
 */
function getNodeByPath( node, path ) {
	path = [ ...path ];

	while ( node && path.length > 1 ) {
		node = node.childNodes[ path.shift() ];
	}

	return {
		node,
		offset: path[ 0 ],
	};
}

/**
 * Creates an element tree and selection paths from a rich text record.
 *
 * @param {Object}  record    The record to create from.
 * @param {string}  multiline Multiline tag.
 * @param {?string} _tag      Internal use only.
 *
 * @return {Object} Object with the element tree and selection paths.
 */
export function toDOM( { value, selection = {} }, multiline, _tag ) {
	const doc = document.implementation.createHTMLDocument( '' );
	let { body } = doc;
	let startPath = [];
	let endPath = [];

	if ( multiline ) {
		value.forEach( ( piece, index ) => {
			const start = selection.start && selection.start[ 0 ] === index ? selection.start[ 1 ] : undefined;
			const end = selection.end && selection.end[ 0 ] === index ? selection.end[ 1 ] : undefined;
			const dom = toDOM( {
				value: piece,
				selection: {
					start,
					end,
				},
			}, false, multiline );

			body.appendChild( dom.body );

			if ( dom.selection.startPath.length ) {
				startPath = [ index, ...dom.selection.startPath ];
			}

			if ( dom.selection.endPath.length ) {
				endPath = [ index, ...dom.selection.endPath ];
			}
		} );

		return {
			body,
			selection: { startPath, endPath },
		};
	}

	const { formats, text } = value;
	const { start, end } = selection;

	if ( _tag ) {
		body = body.appendChild( doc.createElement( _tag ) );
	}

	for ( let i = 0, max = text.length; i < max; i++ ) {
		const character = text.charAt( i );
		const nextFormats = formats[ i ] || [];
		let pointer = body.lastChild || body.appendChild( doc.createTextNode( '' ) );

		if ( nextFormats ) {
			nextFormats.forEach( ( { type, attributes, object } ) => {
				if ( pointer && type === pointer.nodeName.toLowerCase() ) {
					pointer = pointer.lastChild;
					return;
				}

				const newNode = doc.createElement( type );
				const parentNode = pointer.parentNode;

				for ( const key in attributes ) {
					newNode.setAttribute( key, attributes[ key ] );
				}

				parentNode.appendChild( newNode );
				pointer = ( object ? parentNode : newNode ).appendChild( doc.createTextNode( '' ) );
			} );
		}

		if ( character === '\n' ) {
			pointer = pointer.parentNode.appendChild( doc.createElement( 'br' ) );
		} else if ( pointer.nodeType === TEXT_NODE ) {
			pointer.appendData( character );
		} else {
			pointer = pointer.parentNode.appendChild( doc.createTextNode( character ) );
		}

		if ( start === i ) {
			const initialPath = pointer.nodeValue ? [ pointer.nodeValue.length - 1 ] : [];
			startPath = createPathToNode( pointer, body, initialPath );
		}

		if ( end === i ) {
			const initialPath = pointer.nodeValue ? [ pointer.nodeValue.length - 1 ] : [];
			endPath = createPathToNode( pointer, body, initialPath );
		}
	}

	const last = text.length;

	if ( formats[ last ] ) {
		formats[ last ].reduce( ( element, { type, attributes } ) => {
			const newNode = doc.createElement( type );

			for ( const key in attributes ) {
				newNode.setAttribute( key, attributes[ key ] );
			}

			return element.appendChild( newNode );
		}, body );
	}

	if ( start === last || end === last ) {
		let pointer = body.lastChild;

		if ( pointer.nodeType !== TEXT_NODE ) {
			pointer = pointer.parentNode.appendChild( doc.createTextNode( '' ) );
		}

		if ( start === last ) {
			startPath = createPathToNode( pointer, body, [ 0 ] );
		}

		if ( end === last ) {
			endPath = createPathToNode( pointer, body, [ 0 ] );
		}
	}

	return {
		body,
		selection: { startPath, endPath },
	};
}

/**
 * Creates an HTML string from a rich text record.
 *
 * @param {Object} record    Rich text record.
 * @param {string} multiline Multiline tag.
 *
 * @return {string} HTML string.
 */
export function toString( record, multiline ) {
	return toDOM( { value: record }, multiline ).body.innerHTML;
}

export function concat( record, ...records ) {
	if ( Array.isArray( record ) ) {
		return record.concat( ...records );
	}

	return records.reduce( ( accu, { formats, text } ) => {
		accu.text += text;
		accu.formats.push( ...formats );
		return accu;
	}, { ...record } );
}

export function isEmpty( record ) {
	if ( Array.isArray( record ) ) {
		return record.length === 0 || ( record.length === 1 && isEmpty( record[ 0 ] ) );
	}

	const { text, formats } = record;

	return text.length === 0 && formats.length === 0;
}

export function splice( { formats, text, selection, value }, start, deleteCount, textToInsert = '', formatsToInsert ) {
	if ( value !== undefined ) {
		start = start || selection.start;
		deleteCount = deleteCount || selection.end - selection.start;

		const diff = textToInsert.length - deleteCount;

		return {
			selection: {
				start: selection.start + ( selection.start >= start ? diff : 0 ),
				end: selection.end + ( selection.end >= start ? diff : 0 ),
			},
			value: splice( value, start, deleteCount, textToInsert, formatsToInsert ),
		};
	}

	if ( ! Array.isArray( formatsToInsert ) ) {
		const newFormats = formatsToInsert ? [ formatsToInsert ] : formats[ start ];
		formatsToInsert = Array( textToInsert.length ).fill( newFormats );
	}

	formats.splice( start, deleteCount, ...formatsToInsert );
	text = text.slice( 0, start ) + textToInsert + text.slice( start + deleteCount );

	return { formats, text };
}

export function getTextContent( { text, value, selection } ) {
	if ( value !== undefined ) {
		if ( Array.isArray( value ) ) {
			if ( isCollapsed( { selection } ) ) {
				const [ index ] = selection.start;
				return value[ index ].text;
			}

			return '';
		}

		return value.text;
	}

	return text;
}

export function applyFormat( { formats, text, value, selection }, format, start, end ) {
	if ( value !== undefined ) {
		start = start || selection.start;
		end = end || selection.end;

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

export function removeFormat( { formats, text, value, selection }, formatType, start, end ) {
	if ( value !== undefined ) {
		start = start || selection.start;
		end = end || selection.end;

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

export function getActiveFormat( { value, selection }, formatType ) {
	if ( ! selection || ! selection.start ) {
		return false;
	}

	if ( Array.isArray( value ) ) {
		return getActiveFormat( {
			value: value[ selection.start[ 0 ] ],
			selection: {
				start: selection.start[ 1 ],
				end: selection.end[ 1 ],
			},
		}, formatType );
	}

	const formats = value.formats[ selection.start ];

	return find( formats, { type: formatType } );
}

export function split( { text, formats, selection, value }, start, end ) {
	if ( value !== undefined ) {
		start = start || selection.start;
		end = end || selection.end;

		const [ startValue, endValue ] = split( value, start, end );

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
