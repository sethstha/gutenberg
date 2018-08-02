/**
 * External dependencies
 */
import { omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';
import { createBlock, getPhrasingContentSchema } from '@wordpress/blocks';
import {
	BlockControls,
	AlignmentToolbar,
	RichText,
} from '@wordpress/editor';

const blockAttributes = {
	value: {
		type: 'array',
		source: 'rich-text',
		selector: 'blockquote',
		multiline: 'p',
	},
	citation: {
		type: 'object',
		source: 'rich-text',
		selector: 'cite',
	},
	align: {
		type: 'string',
	},
};

export const name = 'core/quote';

export const settings = {
	title: __( 'Quote' ),
	description: __( 'Maybe someone else said it better -- add some quoted text.' ),
	icon: <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="none" d="M0 0h24v24H0V0z" /><g><path d="M19 18h-6l2-4h-2V6h8v7l-2 5zm-2-2l2-3V8h-4v4h4l-2 4zm-8 2H3l2-4H3V6h8v7l-2 5zm-2-2l2-3V8H5v4h4l-2 4z" /></g></svg>,
	category: 'common',
	keywords: [ __( 'blockquote' ) ],

	attributes: blockAttributes,

	styles: [
		{ name: 'default', label: __( 'Regular' ), isDefault: true },
		{ name: 'large', label: __( 'Large' ) },
	],

	transforms: {
		from: [
			{
				type: 'block',
				isMultiBlock: true,
				blocks: [ 'core/paragraph' ],
				transform: ( attributes ) => {
					return createBlock( 'core/quote', {
						value: attributes.map( ( { content } ) => content ),
					} );
				},
			},
			{
				type: 'block',
				blocks: [ 'core/heading' ],
				transform: ( { content } ) => {
					return createBlock( 'core/quote', {
						value: [ content ],
					} );
				},
			},
			{
				type: 'pattern',
				regExp: /^>\s/,
				transform: ( { content } ) => {
					return createBlock( 'core/quote', {
						value: [ content ],
					} );
				},
			},
			{
				type: 'raw',
				selector: 'blockquote',
				schema: {
					blockquote: {
						children: {
							p: {
								children: getPhrasingContentSchema(),
							},
						},
					},
				},
			},
		],
		to: [
			{
				type: 'block',
				blocks: [ 'core/paragraph' ],
				transform: ( { value, citation } ) => {
					if ( ! RichText.isEmpty( citation ) ) {
						value.push( citation );
					}

					return value.map( ( content ) => createBlock( 'core/paragraph', { content } ) );
				},
			},
			{
				type: 'block',
				blocks: [ 'core/heading' ],
				transform: ( { value, citation, ...attrs } ) => {
					// if no text content exist just transform the quote into an heading block
					// using citation as the content, it may be empty creating an empty heading block.
					if ( RichText.isEmpty( value ) ) {
						return createBlock( 'core/heading', {
							content: citation,
						} );
					}

					return [
						createBlock( 'core/heading', {
							content: value[ 0 ],
						} ),
						createBlock( 'core/quote', {
							...attrs,
							citation,
							value: value.slice( 1 ),
						} ),
					];
				},
			},
		],
	},

	edit( { attributes, setAttributes, isSelected, mergeBlocks, onReplace, className } ) {
		const { align, value, citation } = attributes;

		return (
			<Fragment>
				<BlockControls>
					<AlignmentToolbar
						value={ align }
						onChange={ ( nextAlign ) => {
							setAttributes( { align: nextAlign } );
						} }
					/>
				</BlockControls>
				<blockquote className={ className } style={ { textAlign: align } }>
					<RichText
						multiline="p"
						value={ value }
						onChange={
							( nextValue ) => setAttributes( {
								value: nextValue,
							} )
						}
						onMerge={ mergeBlocks }
						onRemove={ ( forward ) => {
							const hasEmptyCitation = ! citation || citation.length === 0;
							if ( ! forward && hasEmptyCitation ) {
								onReplace( [] );
							}
						} }
						/* translators: the text of the quotation */
						placeholder={ __( 'Write quote…' ) }
					/>
					{ ( ! RichText.isEmpty( citation ) || isSelected ) && (
						<RichText
							tagName="cite"
							value={ citation }
							onChange={
								( nextCitation ) => setAttributes( {
									citation: nextCitation,
								} )
							}
							/* translators: the individual or entity quoted */
							placeholder={ __( 'Write citation…' ) }
						/>
					) }
				</blockquote>
			</Fragment>
		);
	},

	save( { attributes } ) {
		const { align, value, citation } = attributes;

		return (
			<blockquote style={ { textAlign: align ? align : null } }>
				<RichText.Content multiline="p" value={ value } />
				{ ! RichText.isEmpty( citation ) && <RichText.Content tagName="cite" value={ citation } /> }
			</blockquote>
		);
	},

	deprecated: [
		{
			attributes: {
				...blockAttributes,
				style: {
					type: 'number',
					default: 1,
				},
			},

			migrate( attributes ) {
				if ( attributes.style === 2 ) {
					return {
						...omit( attributes, [ 'style' ] ),
						className: attributes.className ? attributes.className + ' is-style-large' : 'is-style-large',
					};
				}

				return attributes;
			},

			save( { attributes } ) {
				const { align, value, citation, style } = attributes;

				return (
					<blockquote
						className={ style === 2 ? 'is-large' : '' }
						style={ { textAlign: align ? align : null } }
					>
						<RichText.Content value={ value } />
						{ ! RichText.isEmpty( citation ) && <RichText.Content tagName="cite" value={ citation } /> }
					</blockquote>
				);
			},
		},
		{
			attributes: {
				...blockAttributes,
				citation: {
					type: 'array',
					source: 'children',
					selector: 'footer',
				},
				style: {
					type: 'number',
					default: 1,
				},
			},

			save( { attributes } ) {
				const { align, value, citation, style } = attributes;

				return (
					<blockquote
						className={ `blocks-quote-style-${ style }` }
						style={ { textAlign: align ? align : null } }
					>
						<RichText.Content value={ value } />
						{ ! RichText.isEmpty( citation ) && <RichText.Content tagName="footer" value={ citation } /> }
					</blockquote>
				);
			},
		},
	],
};
