/**
 * External dependencies
 */
import { filter, groupBy } from 'lodash';

/**
 * WordPress dependencies
 */
import { getBlockTransforms, findTransform, richTextStructure } from '@wordpress/blocks';

export default function() {
	const { onReplace, multiline } = this.props;
	const { splice, applyFormat, getTextContent } = richTextStructure;

	const {
		// enter: enterPatterns,
		undefined: patterns,
	} = groupBy( filter( getBlockTransforms( 'from' ), { type: 'pattern' } ), 'trigger' );

	return [
		( record ) => {
			if ( ! onReplace ) {
				return record;
			}

			const text = getTextContent( record );
			const transformation = findTransform( patterns, ( item ) => {
				return item.regExp.test( text );
			} );

			if ( ! transformation ) {
				return record;
			}

			const result = text.match( transformation.regExp );

			const block = transformation.transform( {
				content: splice( record.value, 0, result[ 0 ].length ),
				match: result,
			} );

			onReplace( [ block ] );

			return record;
		},
		// To do: only on enter.
		// ( record ) => {
		// 	if ( ! onReplace ) {
		// 		return record;
		// 	}

		// 	const transformation = findTransform( enterPatterns, ( item ) => {
		// 		return item.regExp.test( record.text );
		// 	} );

		// 	if ( ! transformation ) {
		// 		return record;
		// 	}

		// 	const block = transformation.transform( { content: record.text } );

		// 	onReplace( [ block ] );
		// },
		( record ) => {
			if ( multiline ) {
				return record;
			}

			const text = getTextContent( record );

			if ( text.indexOf( '`' ) === -1 ) {
				return record;
			}

			const match = text.match( /`([^`]+)`/ );

			if ( ! match ) {
				return record;
			}

			const start = match.index;
			const end = start + match[ 1 ].length;

			record = splice( record, match.index + match[ 0 ].length - 1, 1 );
			record = splice( record, start, 1 );
			record = applyFormat( record, { type: 'code' }, start, end );

			return record;
		},
	];
}
