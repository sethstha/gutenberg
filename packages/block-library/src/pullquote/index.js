/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	RichText,
} from '@wordpress/editor';

const blockAttributes = {
	value: {
		source: 'children',
		selector: 'blockquote',
		multiline: 'p',
	},
	citation: {
		source: 'children',
		selector: 'cite',
	},
};

export const name = 'core/pullquote';

export const settings = {

	title: __( 'Pullquote' ),

	description: __( 'Highlight a quote from your post or page by displaying it as a graphic element.' ),

	icon: <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M0,0h24v24H0V0z" fill="none" /><polygon points="21 18 2 18 2 20 21 20" /><path d="m19 10v4h-15v-4h15m1-2h-17c-0.55 0-1 0.45-1 1v6c0 0.55 0.45 1 1 1h17c0.55 0 1-0.45 1-1v-6c0-0.55-0.45-1-1-1z" /><polygon points="21 4 2 4 2 6 21 6" /></svg>,

	category: 'formatting',

	attributes: blockAttributes,

	supports: {
		align: true,
	},

	edit( { attributes, setAttributes, isSelected, className } ) {
		const { value, citation } = attributes;

		return (
			<figure className={ className }>
				<blockquote>
					<RichText
						multiline="p"
						value={ value }
						onChange={
							( nextValue ) => setAttributes( {
								value: nextValue,
							} )
						}
						/* translators: the text of the quotation */
						placeholder={ __( 'Write quote…' ) }
						wrapperClassName="block-library-pullquote__content"
					/>
					{ ( ! RichText.isEmpty( citation ) || isSelected ) && (
						<RichText
							value={ citation }
							/* translators: the individual or entity quoted */
							placeholder={ __( 'Write citation…' ) }
							onChange={
								( nextCitation ) => setAttributes( {
									citation: nextCitation,
								} )
							}
							className="wp-block-pullquote__citation"
						/>
					) }
				</blockquote>
			</figure>
		);
	},

	save( { attributes } ) {
		const { value, citation } = attributes;

		return (
			<figure>
				<blockquote>
					<RichText.Content value={ value } multiline="p" />
					{ ! RichText.isEmpty( citation ) && <RichText.Content tagName="cite" value={ citation } /> }
				</blockquote>
			</figure>
		);
	},

	deprecated: [ {
		attributes: {
			...blockAttributes,
		},
		save( { attributes } ) {
			const { value, citation } = attributes;
			return (
				<blockquote>
					<RichText.Content value={ value } multiline="p" />
					{ ! RichText.isEmpty( citation ) && <RichText.Content tagName="cite" value={ citation } /> }
				</blockquote>
			);
		},
	}, {
		attributes: {
			...blockAttributes,
			citation: {
				source: 'children',
				selector: 'footer',
			},
			align: {
				type: 'string',
				default: 'none',
			},
		},

		save( { attributes } ) {
			const { value, citation, align } = attributes;

			return (
				<blockquote className={ `align${ align }` }>
					<RichText.Content value={ value } />
					{ ! RichText.isEmpty( citation ) && <RichText.Content tagName="footer" value={ citation } /> }
				</blockquote>
			);
		},
	} ],
};
