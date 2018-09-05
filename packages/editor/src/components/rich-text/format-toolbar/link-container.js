/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import {
	ExternalLink,
	Fill,
	IconButton,
	Popover,
	ToggleControl,
	withSpokenMessages,
} from '@wordpress/components';
import { ESCAPE, LEFT, RIGHT, UP, DOWN, BACKSPACE, ENTER } from '@wordpress/keycodes';
import { prependHTTP } from '@wordpress/url';

/**
 * Internal dependencies
 */
import PositionedAtSelection from './positioned-at-selection';
import URLInput from '../../url-input';
import { filterURLForDisplay } from '../../../utils/url';

const stopKeyPropagation = ( event ) => event.stopPropagation();

class LinkContainer extends Component {
	constructor( { link, selection } ) {
		super( ...arguments );

		this.editLink = this.editLink.bind( this );
		this.submitLink = this.submitLink.bind( this );
		this.onKeyDown = this.onKeyDown.bind( this );
		this.onChangeInputValue = this.onChangeInputValue.bind( this );
		this.toggleLinkSettingsVisibility = this.toggleLinkSettingsVisibility.bind( this );
		this.setLinkTarget = this.setLinkTarget.bind( this );

		this.state = {
			inputValue: link && link.attributes && link.attributes.href ? null : '',
			opensInNewWindow: null,
			lastSelection: selection,
			selectionKey: 0,
		};
	}

	static getDerivedStateFromProps( { link, selection }, state ) {
		if ( selection === state.lastSelection ) {
			return null;
		}

		return {
			inputValue: link && link.attributes && link.attributes.href ? null : '',
			opensInNewWindow: null,
			lastSelection: selection,
			selectionKey: state.selectionKey + 1,
		};
	}

	onKeyDown( event ) {
		if ( event.keyCode === ESCAPE ) {
			event.stopPropagation();
			this.props.removeFormat( 'a' );
			this.setState( {
				inputValue: null,
				opensInNewWindow: null,
			} );
		}

		if ( [ LEFT, DOWN, RIGHT, UP, BACKSPACE, ENTER ].includes( event.keyCode ) ) {
			// Stop the key event from propagating up to maybeStartTyping in BlockListBlock.
			event.stopPropagation();
		}
	}

	onChangeInputValue( inputValue ) {
		this.setState( { inputValue } );
	}

	toggleLinkSettingsVisibility() {
		this.setState( ( state ) => ( { settingsVisible: ! state.settingsVisible } ) );
	}

	setLinkTarget( opensInNewWindow ) {
		// Apply now if URL is not being edited.
		if ( this.state.opensInNewWindow === null ) {
			const { link } = this.props;

			if ( opensInNewWindow ) {
				link.attributes.target = '_blank';
				link.attributes.rel = 'noreferrer noopener';
			} else {
				delete link.attributes.target;
				delete link.attributes.rel;
			}

			this.props.applyFormat( link );
		} else {
			this.setState( { opensInNewWindow } );
		}
	}

	editLink( event ) {
		const { link } = this.props;

		this.setState( {
			inputValue: link.attributes.href,
			opensInNewWindow: link.attributes.target === '_blank',
		} );

		event.preventDefault();
	}

	submitLink( event ) {
		const { link } = this.props;
		const { inputValue, opensInNewWindow } = this.state;
		const href = prependHTTP( inputValue );
		const format = {
			type: 'a',
			attributes: {
				href,
			},
		};

		if ( opensInNewWindow ) {
			format.attributes.target = '_blank';
			format.attributes.rel = 'noreferrer noopener';
		}

		this.props.applyFormat( format );

		this.setState( {
			inputValue: null,
			opensInNewWindow: null,
		} );

		if ( ! link ) {
			this.props.speak( __( 'Link added.' ), 'assertive' );
		}

		event.preventDefault();
	}

	render() {
		const { link } = this.props;

		if ( ! link ) {
			return null;
		}

		const { inputValue, settingsVisible, opensInNewWindow, selectionKey } = this.state;
		const linkSettings = settingsVisible && (
			<div className="editor-format-toolbar__link-modal-line editor-format-toolbar__link-settings">
				<ToggleControl
					label={ __( 'Open in New Window' ) }
					checked={ opensInNewWindow === null ? link.attributes.target === '_blank' : opensInNewWindow }
					onChange={ this.setLinkTarget } />
			</div>
		);

		return (
			<Fill name="RichText.Siblings">
				<PositionedAtSelection
					className="editor-format-toolbar__link-container"
					key={ selectionKey /* Used to force rerender on selection change */ }
				>
					<Popover
						position="bottom center"
						focusOnMount={ inputValue === null ? false : 'firstElement' }
					>
						{ inputValue !== null && (
							// Disable reason: KeyPress must be suppressed so the block doesn't hide the toolbar
							/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
							<form
								className="editor-format-toolbar__link-modal"
								onKeyPress={ stopKeyPropagation }
								onKeyDown={ this.onKeyDown }
								onSubmit={ this.submitLink }
							>
								<div className="editor-format-toolbar__link-modal-line">
									<URLInput value={ inputValue } onChange={ this.onChangeInputValue } />
									<IconButton icon="editor-break" label={ __( 'Apply' ) } type="submit" />
									<IconButton
										className="editor-format-toolbar__link-settings-toggle"
										icon="ellipsis"
										label={ __( 'Link Settings' ) }
										onClick={ this.toggleLinkSettingsVisibility }
										aria-expanded={ settingsVisible }
									/>
								</div>
								{ linkSettings }
							</form>
							/* eslint-enable jsx-a11y/no-noninteractive-element-interactions */
						) }

						{ inputValue === null && (
							// Disable reason: KeyPress must be suppressed so the block doesn't hide the toolbar
							/* eslint-disable jsx-a11y/no-static-element-interactions */
							<div
								className="editor-format-toolbar__link-modal"
								onKeyPress={ stopKeyPropagation }
							>
								<div className="editor-format-toolbar__link-modal-line">
									<ExternalLink
										className="editor-format-toolbar__link-value"
										href={ link.attributes.href }
									>
										{ link.attributes.href && filterURLForDisplay( decodeURI( link.attributes.href ) ) }
									</ExternalLink>
									<IconButton icon="edit" label={ __( 'Edit' ) } onClick={ this.editLink } />
									<IconButton
										className="editor-format-toolbar__link-settings-toggle"
										icon="ellipsis"
										label={ __( 'Link Settings' ) }
										onClick={ this.toggleLinkSettingsVisibility }
										aria-expanded={ settingsVisible }
									/>
								</div>
								{ linkSettings }
							</div>
							/* eslint-enable jsx-a11y/no-static-element-interactions */
						) }
					</Popover>
				</PositionedAtSelection>
			</Fill>
		);
	}
}

export default withSpokenMessages( LinkContainer );
