/**
 * Internal dependencies
 */

import { isEmpty } from './is-empty';

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
	const htmlDocument = document.implementation.createHTMLDocument( '' );

	htmlDocument.body.innerHTML = html;

	return htmlDocument.body;
}

/**
 * Creates rich text value and selection objects from a DOM element and range.
 *
 * @param {HTMLElement} element      Element to create value object from.
 * @param {Range}       range        Range to create selection object from.
 * @param {string}      multilineTag Multiline tag if the structure is multiline.
 * @param {Object}      settings     Settings passed to `createRecord`.
 *
 * @return {Object} A rich text record.
 */
export function create( element, range, multilineTag, settings ) {
	if ( typeof element === 'string' ) {
		element = createElement( element );
	}

	if ( ! multilineTag ) {
		return createRecord( element, range, settings );
	}

	const emptyRecord = {
		value: {
			formats: [],
			text: '',
		},
		selection: {},
	};

	if ( ! element || ! element.hasChildNodes() ) {
		return emptyRecord;
	}

	const children = Array.from( element.children )
		.filter( ( { nodeName } ) => nodeName.toLowerCase() === multilineTag );
	const maxIndex = children.length - 1;

	if ( maxIndex < 0 ) {
		return emptyRecord;
	}

	return children.reduce( ( accumulator, node, index ) => {
		const { selection, value } = createRecord( node, range, settings );
		const length = accumulator.value.text.length;

		if ( range ) {
			if ( selection.start !== undefined ) {
				accumulator.selection.start = length + selection.start;
			} else if (
				node.parentNode === range.startContainer &&
				node === range.startContainer.childNodes[ range.startOffset ]
			) {
				accumulator.selection.start = length;
			}

			if ( selection.end !== undefined ) {
				accumulator.selection.end = length + selection.end;
			} else if (
				node.parentNode === range.endContainer &&
				node === range.endContainer.childNodes[ range.endOffset - 1 ]
			) {
				accumulator.selection.end = length + value.text.length;
			}
		}

		accumulator.value.formats = accumulator.value.formats.concat( value.formats );
		accumulator.value.text += value.text;

		if ( index !== maxIndex ) {
			accumulator.value.formats = accumulator.value.formats.concat( [ , , ] );
			accumulator.value.text += '\n\n';
		}

		return accumulator;
	}, emptyRecord );
}

/**
 * Creates a rich text value object from a DOM element.
 *
 * @param {HTMLElement} element      Element to create value object from.
 * @param {string}      multilineTag Multiline tag.
 * @param {Object}      settings     Settings passed to `createRecord`.
 *
 * @return {Object} A rich text value object.
 */
export function createValue( element, multilineTag, settings ) {
	return create( element, null, multilineTag, settings ).value;
}

/**
 * Creates rich text value and selection objects from a DOM element and range.
 *
 * @param {HTMLElement} element                  Element to create value object
 *                                               from.
 * @param {Range}       range                    Range to create selection object
 *                                               from.
 * @param {Object}      settings                 Settings object.
 * @param {Function}    settings.removeNodeMatch Function to declare whether the
 *                                               given node should be removed.
 * @param {Function}    settings.unwrapNodeMatch Function to declare whether the
 *                                               given node should be unwrapped.
 * @param {Function}    settings.filterString    Function to filter the given
 *                                               string.
 * @param {Function}    settings.removeAttribute Match Wether to remove an attribute
 *                                               based on the name.
 *
 * @return {Object} A rich text record.
 */
function createRecord( element, range, settings = {} ) {
	const emptyRecord = {
		value: {
			formats: [],
			text: '',
		},
		selection: {},
	};

	if ( ! element || ! element.hasChildNodes() ) {
		return emptyRecord;
	}

	const {
		removeNodeMatch = () => false,
		unwrapNodeMatch = () => false,
		filterString = ( string ) => string,
		removeAttributeMatch,
	} = settings;

	// Remove any line breaks in text nodes. They are not content, but used to
	// format the HTML. Line breaks in HTML are stored as BR elements.
	const filterStringComplete = ( string ) => filterString( string.replace( '\n', '' ) );

	return Array.from( element.childNodes ).reduce( ( accumulator, node ) => {
		if ( node.nodeType === TEXT_NODE ) {
			const nodeValue = node.nodeValue;
			const text = filterStringComplete( nodeValue );

			if ( range ) {
				const textLength = accumulator.value.text.length;

				if ( node === range.startContainer ) {
					const charactersBefore = nodeValue.slice( 0, range.startOffset );
					const lengthBefore = filterStringComplete( charactersBefore ).length;
					accumulator.selection.start = textLength + lengthBefore;
				}

				if ( node === range.endContainer ) {
					const charactersBefore = nodeValue.slice( 0, range.endOffset );
					const lengthBefore = filterStringComplete( charactersBefore ).length;
					accumulator.selection.end = textLength + lengthBefore;
				}

				if (
					node.parentNode === range.startContainer &&
					node === range.startContainer.childNodes[ range.startOffset ]
				) {
					accumulator.selection.start = textLength;
				}

				if (
					node.parentNode === range.endContainer &&
					node === range.endContainer.childNodes[ range.endOffset - 1 ]
				) {
					accumulator.selection.end = textLength + text.length;
				}
			}

			accumulator.value.text += text;
			// Create a sparse array of the same length as `text`, in which
			// formats can be added.
			accumulator.value.formats.length += text.length;
			return accumulator;
		}

		if ( node.nodeType !== ELEMENT_NODE || removeNodeMatch( node ) ) {
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
				node === range.endContainer.childNodes[ range.endOffset - 1 ]
			) {
				accumulator.selection.end = accumulator.value.text.length;
			}
		}

		if ( node.nodeName === 'BR' ) {
			if ( unwrapNodeMatch( node ) ) {
				return accumulator;
			}

			accumulator.value.text += '\n';
			accumulator.value.formats.length += 1;
			return accumulator;
		}

		let format;

		if ( ! unwrapNodeMatch( node ) ) {
			const type = node.nodeName.toLowerCase();
			const attributes = getAttributes( node, { removeAttributeMatch } );
			format = attributes ? { type, attributes } : { type };
		}

		const { value, selection } = createRecord( node, range, settings );
		const text = value.text;
		const start = accumulator.value.text.length;

		// Expand range if it ends in this node.
		if ( range ) {
			if (
				node.parentNode === range.endContainer &&
				node === range.endContainer.childNodes[ range.endOffset - 1 ]
			) {
				accumulator.selection.end = start + text.length;
			}
		}

		// Don't apply the element as formatting if it has no content.
		if ( isEmpty( value ) && format && ! format.attributes ) {
			return accumulator;
		}

		const { formats } = accumulator.value;

		if ( format && format.attributes && text.length === 0 ) {
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
			}
		}

		if ( selection.start !== undefined ) {
			accumulator.selection.start = start + selection.start;
		}

		if ( selection.end !== undefined ) {
			accumulator.selection.end = start + selection.end;
		}

		return accumulator;
	}, emptyRecord );
}

/**
 * Gets the attributes of an element in object shape.
 *
 * @param {HTMLElement} element                       Element to get attributes from.
 * @param {Function}    settings.removeAttributeMatch Function whose return value
 *                                                    determines whether or not to
 *                                                    remove an attribute based on name.
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

	return Array.from( element.attributes ).reduce( ( accumulator, { name, value } ) => {
		if ( ! removeAttributeMatch( name ) ) {
			accumulator = accumulator || {};
			accumulator[ name ] = value;
		}

		return accumulator;
	}, undefined );
}
