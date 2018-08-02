/**
 * WordPress dependencies
 */
import { richTextStructure } from '@wordpress/blocks';

const settings = {
	removeNodeMatch: ( node ) => node.getAttribute( 'data-mce-bogus' ) === 'all',
	unwrapNodeMatch: ( node ) => !! node.getAttribute( 'data-mce-bogus' ),
	removeAttributeMatch: ( attribute ) => attribute.indexOf( 'data-mce-' ) === 0,
	filterString: ( string ) => string.replace( '\uFEFF', '' ),
};

/**
 * Transforms a value in a given format into string.
 *
 * @param {Object|Array|string?} value     RichText value.
 * @param {string?}              multiline Multitine tag.
 * @param {string?}              format    Output format (string or element).
 *
 * @return {string} HTML output as string.
 */
export function valueToString( value, multiline, format ) {
	switch ( format ) {
		case 'string':
			return value || '';
		default:
			return richTextStructure.toString( value, multiline );
	}
}

/**
 * Transforms an array of DOM Elements to the given format.
 *
 * @param {Array}   value     DOM element or fragment.
 * @param {string?} multiline Multitine tag.
 * @param {string?} format    Output format (string or element).
 *
 * @return {*} Output.
 */
export function domToFormat( value, multiline, format ) {
	value = richTextStructure.create( value, multiline, settings );

	switch ( format ) {
		case 'string':
			return valueToString( value, 'element', multiline );
		default:
			return value;
	}
}
