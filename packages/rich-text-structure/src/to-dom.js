/**
 * Browser dependencies
 */

const { TEXT_NODE, ELEMENT_NODE } = window.Node;

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
