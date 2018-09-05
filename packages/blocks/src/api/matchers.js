/**
 * WordPress dependencies
 */
import { createValue } from '@wordpress/rich-text-structure';

/**
 * External dependencies
 */
export { attr, prop, html, text, query } from 'hpq';

const matcher = ( selector, multiline ) => {
	return ( domNode ) => {
		let match = domNode;

		if ( selector ) {
			match = domNode.querySelector( selector );
		}

		return createValue( match, multiline );
	};
};

export const children = ( selector, multiline ) => matcher( selector, multiline );
export const node = ( selector ) => matcher( selector );
