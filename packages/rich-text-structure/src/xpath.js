function append( parent, object ) {
	object.parent = parent;
	parent.children = parent.children || [];
	parent.children.push( object );
	return object;
}

function getLastChild( { children } ) {
	return children && children[ children.length - 1 ];
}

const matchNodePath = /([a-z0-9()]+)\[(\d)+]/;

function isTextNode( child ) {
	return child.hasOwnProperty( 'text' );
}

function isNodeType( type, child ) {
	return child.hasOwnProperty( 'type' ) && type === child.type;
}

function findNodeWithIndex( type, index, children ) {
	let count = 0;
	let foundNode = false;

	children.forEach( ( child ) => {
		if (
			( type === 'text()' && isTextNode( child ) ) ||
			isNodeType( type, child )
		) {
			if ( count === index ) {
				foundNode = child;
			}

			count++;
		}
	} );

	return foundNode;
}

/**
 * Matches an XPath to a certain value.
 *
 * Has certain assumptions about the XPath:
 *
 * * The XPath is continuous: So all nodes until the deepest node are included.
 * * The XPath starts from the root element of the RichText.
 * * The leaf node should always be a text() node.
 *
 * @param {Object} value Rich text value.
 * @param {string} xpath XPath to match.
 *
 * @return {number} The position of the matched 'element'.
 */
export function matchXPath( value, xpath ) {
	const { formats, text } = value;

	const formatsLength = formats.length + 1;
	const tree = {};

	append( tree, { text: '', pos: 0 } );

	for ( let i = 0; i < formatsLength; i++ ) {
		const character = text.charAt( i );
		const characterFormats = formats[ i ];

		let pointer = getLastChild( tree );

		if ( characterFormats ) {
			characterFormats.forEach( ( { type, attributes, object } ) => {
				if ( pointer && type === pointer.type ) {
					pointer = getLastChild( pointer );
					return;
				}

				const newNode = { type, attributes, object, pos: i };
				append( pointer.parent, newNode );
				pointer = append( object ? pointer.parent : newNode, { text: '', pos: i } );
			} );
		}

		if ( character ) {
			if ( character === '\n' ) {
				pointer = append( pointer.parent, { type: 'br', object: true, pos: i } );
			} else if ( pointer.text === undefined ) {
				pointer = append( pointer.parent, { text: character, pos: i } );
			} else {
				pointer.text += character;
			}
		}
	}

	const pathParts = xpath.split( '/' );
	let pointer = tree;

	pathParts.forEach( ( pathPart ) => {
		const matches = matchNodePath.exec( pathPart );

		// XPaths start counting at 1.
		const nodeType = matches[ 1 ];
		const nodeIndex = parseInt( matches[ 2 ], 10 ) - 1;

		const { children } = pointer;

		pointer = findNodeWithIndex( nodeType, nodeIndex, children );
	} );

	// The leaf node must be a text node.
	return isTextNode( pointer ) ? pointer.pos : false;
}
