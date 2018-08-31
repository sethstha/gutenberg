/**
 * Creates an HTML string from a rich text record.
 *
 * @param {Object} record    Rich text record.
 * @param {string} multiline Multiline tag.
 *
 * @return {string} HTML string.
 */
export function toString( { value }, multiline ) {
	if ( value === undefined ) {
		return valueToString( ...arguments );
	}

	return valueToString( value, multiline );
}

function getLastChild( { children } ) {
	return children && children[ children.length - 1 ];
}

function append( parent, object ) {
	object.parent = parent;
	parent.children = parent.children || [];
	parent.children.push( object );
	return object;
}

function escapeHtml( text ) {
	const map = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#039;',
	};

	return text.replace( /[&<>"']/g, ( character ) => map[ character ] );
}

function createElementHTML( { type, attributes, object, children } ) {
	let attributeString = '';

	for ( const key in attributes ) {
		attributeString += ` ${ key }="${ attributes[ key ] }"`;
	}

	if ( object ) {
		return `<${ type }${ attributeString }>`;
	}

	return `<${ type }${ attributeString }>${ createChildrenHTML( children ) }</${ type }>`;
}

function createChildrenHTML( children = [] ) {
	return children.map( ( child ) => {
		return child.text === undefined ? createElementHTML( child ) : escapeHtml( child.text );
	} ).join( '' );
}

export function valueToString( value, multiline ) {
	if ( multiline ) {
		return value.map( ( line ) =>
			`<${ multiline }>${ valueToString( line ) }</${ multiline }>`
		).join( '' );
	}

	const { formats, text } = value;
	const tree = {};

	append( tree, { text: '' } );

	for ( let i = 0, max = text.length + 1; i < max; i++ ) {
		const character = text.charAt( i );
		const characterFormats = formats[ i ];

		let pointer = getLastChild( tree );

		if ( characterFormats ) {
			characterFormats.forEach( ( { type, attributes, object } ) => {
				if ( pointer && type === pointer.type ) {
					pointer = getLastChild( pointer );
					return;
				}

				const newNode = { type, attributes, object };
				append( pointer.parent, newNode );
				pointer = append( object ? pointer.parent : newNode, { text: '' } );
			} );
		}

		if ( character ) {
			if ( character === '\n' ) {
				pointer = append( pointer.parent, { type: 'br', object: true } );
			} else if ( pointer.text === undefined ) {
				pointer = append( pointer.parent, { text: character } );
			} else {
				pointer.text += character;
			}
		}
	}

	return createChildrenHTML( tree.children );
}
