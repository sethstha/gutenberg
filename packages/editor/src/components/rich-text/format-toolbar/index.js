/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Toolbar } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { FORMATTING_CONTROLS } from '../formatting-controls';
import LinkContainer from './link-container';
import ToolbarContainer from './toolbar-container';

const FormatToolbar = ( props ) => {
	const link = props.getActiveFormat( 'a' );
	const removeLink = () => props.removeFormat( 'a' );
	const addLink = () => props.applyFormat( {
		type: 'a',
		attributes: {
			href: '',
		},
	} );

	const toolbarControls = FORMATTING_CONTROLS
		.filter( ( control ) => props.enabledControls.indexOf( control.format ) !== -1 )
		.map( ( control ) => {
			if ( control.format === 'link' ) {
				return {
					...control,
					icon: link ? 'editor-unlink' : 'admin-links', // TODO: Need proper unlink icon
					title: link ? __( 'Unlink' ) : __( 'Link' ),
					onClick: link ? removeLink : addLink,
					isActive: !! link,
				};
			}

			return {
				...control,
				onClick: () => props.toggleFormat( { type: control.selector } ),
				isActive: !! props.getActiveFormat( control.selector ),
			};
		} );

	return (
		<ToolbarContainer>
			<Toolbar controls={ toolbarControls } />
			{ link && <LinkContainer
				link={ link }
				selection={ props.selection }
				applyFormat={ props.applyFormat }
				removeFormat={ props.removeFormat }
				getActiveFormat={ props.getActiveFormat }
				toggleFormat={ props.toggleFormat }
			/> }
		</ToolbarContainer>
	);
};

export default FormatToolbar;
