/**
 * External dependencies
 */
import classnames from 'classnames';
import {
	defer,
	find,
	identity,
	noop,
} from 'lodash';
import 'element-closest';

/**
 * WordPress dependencies
 */
import { Component, Fragment, RawHTML, createRef } from '@wordpress/element';
import {
	isHorizontalEdge,
	getRectangleFromRange,
	getScrollContainer,
} from '@wordpress/dom';
import { createBlobURL } from '@wordpress/blob';
import { BACKSPACE, DELETE, ENTER, LEFT, RIGHT, rawShortcut, isKeyboardEvent } from '@wordpress/keycodes';
import { Slot } from '@wordpress/components';
import { withDispatch, withSelect } from '@wordpress/data';
import { rawHandler, richTextStructure } from '@wordpress/blocks';
import { withInstanceId, withSafeTimeout, compose } from '@wordpress/compose';
import deprecated from '@wordpress/deprecated';
import { isURL } from '@wordpress/url';

/**
 * Internal dependencies
 */
import Autocomplete from '../autocomplete';
import BlockFormatControls from '../block-format-controls';
import { FORMATTING_CONTROLS } from './formatting-controls';
import FormatToolbar from './format-toolbar';
import TinyMCE from './tinymce';
import { pickAriaProps } from './aria';
import patterns from './patterns';
import { withBlockEditContext } from '../block-edit/context';
import TokenUI from './tokens/ui';

/**
 * Browser dependencies
 */

const { Node, getSelection } = window;

/**
 * Zero-width space character used by TinyMCE as a caret landing point for
 * inline boundary nodes.
 *
 * @see tinymce/src/core/main/ts/text/Zwsp.ts
 *
 * @type {string}
 */
const TINYMCE_ZWSP = '\uFEFF';

const { isEmpty } = richTextStructure;

const richTextStructureSettings = {
	removeNodeMatch: ( node ) => node.getAttribute( 'data-mce-bogus' ) === 'all',
	unwrapNodeMatch: ( node ) => !! node.getAttribute( 'data-mce-bogus' ),
	removeAttributeMatch: ( attribute ) => attribute.indexOf( 'data-mce-' ) === 0,
	filterString: ( string ) => string.replace( '\uFEFF', '' ),
};

export class RichText extends Component {
	constructor( { value } ) {
		super( ...arguments );

		this.onInit = this.onInit.bind( this );
		this.getSettings = this.getSettings.bind( this );
		this.onSetup = this.onSetup.bind( this );
		this.onFocus = this.onFocus.bind( this );
		this.onChange = this.onChange.bind( this );
		this.onNodeChange = this.onNodeChange.bind( this );
		this.onDeleteKeyDown = this.onDeleteKeyDown.bind( this );
		this.onHorizontalNavigationKeyDown = this.onHorizontalNavigationKeyDown.bind( this );
		this.onKeyDown = this.onKeyDown.bind( this );
		this.onKeyUp = this.onKeyUp.bind( this );
		this.onPropagateUndo = this.onPropagateUndo.bind( this );
		this.onPaste = this.onPaste.bind( this );
		this.onCreateUndoLevel = this.onCreateUndoLevel.bind( this );
		this.setFocusedElement = this.setFocusedElement.bind( this );
		this.onInput = this.onInput.bind( this );
		this.onSelectionChange = this.onSelectionChange.bind( this );
		this.getRecord = this.getRecord.bind( this );
		this.applyFormat = this.applyFormat.bind( this );
		this.removeFormat = this.removeFormat.bind( this );
		this.getActiveFormat = this.getActiveFormat.bind( this );
		this.toggleFormat = this.toggleFormat.bind( this );

		this.containerRef = createRef();
		this.patterns = patterns.call( this );
		this.savedContent = value;

		this.state = {
			selection: {},
		};
	}

	/**
	 * Retrieves the settings for this block.
	 *
	 * Allows passing in settings which will be overwritten.
	 *
	 * @param {Object} settings The settings to overwrite.
	 * @return {Object} The settings for this block.
	 */
	getSettings( settings ) {
		let { unstableGetSettings: getSettings } = this.props;
		if ( ! getSettings && typeof this.props.getSettings === 'function' ) {
			deprecated( 'RichText getSettings prop', {
				alternative: 'unstableGetSettings',
				plugin: 'Gutenberg',
				version: '3.9',
				hint: 'Unstable APIs are strongly discouraged to be used, and are subject to removal without notice.',
			} );

			getSettings = this.props.getSettings;
		}

		settings = {
			...settings,
			forced_root_block: this.props.multiline || false,
			// Allow TinyMCE to keep one undo level for comparing changes.
			// Prevent it otherwise from accumulating any history.
			custom_undo_redo_levels: 1,
		};

		if ( getSettings ) {
			settings = getSettings( settings );
		}

		return settings;
	}

	/**
	 * Handles the onSetup event for the TinyMCE component.
	 *
	 * Will setup event handlers for the TinyMCE instance.
	 * An `onSetup` function in the props will be called if it is present.
	 *
	 * @param {tinymce} editor The editor instance as passed by TinyMCE.
	 */
	onSetup( editor ) {
		this.editor = editor;

		editor.on( 'init', this.onInit );
		editor.on( 'nodechange', this.onNodeChange );
		editor.on( 'keydown', this.onKeyDown );
		editor.on( 'keyup', this.onKeyUp );
		editor.on( 'BeforeExecCommand', this.onPropagateUndo );
		editor.on( 'focus', this.onFocus );
		editor.on( 'input', this.onInput );
		// The change event in TinyMCE fires every time an undo level is added.
		editor.on( 'change', this.onCreateUndoLevel );
		editor.on( 'selectionchange', this.onSelectionChange );

		patterns.apply( this, [ editor ] );

		let { unstableOnSetup: onSetup } = this.props;
		if ( ! onSetup && typeof this.props.onSetup === 'function' ) {
			deprecated( 'RichText onSetup prop', {
				alternative: 'unstableOnSetup',
				plugin: 'Gutenberg',
				version: '3.9',
				hint: 'Unstable APIs are strongly discouraged to be used, and are subject to removal without notice.',
			} );

			onSetup = this.props.onSetup;
		}

		if ( onSetup ) {
			onSetup( editor );
		}
	}

	setFocusedElement() {
		if ( this.props.setFocusedElement ) {
			this.props.setFocusedElement( this.props.instanceId );
		}
	}

	onInit() {
		this.editor.shortcuts.add( rawShortcut.primary( 'k' ), '', () => this.applyFormat( { type: 'a', attributes: { href: '' } } ) );
		this.editor.shortcuts.add( rawShortcut.access( 'a' ), '', () => this.applyFormat( { type: 'a', attributes: { href: '' } } ) );
		this.editor.shortcuts.add( rawShortcut.access( 's' ), '', () => this.removeFormat( 'a' ) );
		this.editor.shortcuts.add( rawShortcut.access( 'd' ), '', () => this.toggleFormat( { type: 'del' } ) );
		this.editor.shortcuts.add( rawShortcut.access( 'x' ), '', () => this.toggleFormat( { type: 'code' } ) );
		this.editor.shortcuts.add( rawShortcut.primary( 'z' ), '', 'Undo' );
		this.editor.shortcuts.add( rawShortcut.primaryShift( 'z' ), '', 'Redo' );

		// Remove TinyMCE Core shortcut for consistency with global editor
		// shortcuts. Also clashes with Mac browsers.
		this.editor.shortcuts.remove( 'meta+y', '', 'Redo' );
	}

	/**
	 * Handles an undo event from TinyMCE.
	 *
	 * @param {UndoEvent} event The undo event as triggered by TinyMCE.
	 */
	onPropagateUndo( event ) {
		const { onUndo, onRedo } = this.props;
		const { command } = event;

		if ( command === 'Undo' && onUndo ) {
			defer( onUndo );
			event.preventDefault();
		}

		if ( command === 'Redo' && onRedo ) {
			defer( onRedo );
			event.preventDefault();
		}
	}

	/**
	 * Get the current record (value and selection) from props and state.
	 *
	 * @return {Object} The current record (value and selection).
	 */
	getRecord() {
		return {
			value: this.props.value,
			selection: this.state.selection,
		};
	}

	/**
	 * Apply a format with the current value and selection.
	 *
	 * @param {Object} format The format to apply.
	 */
	applyFormat( format ) {
		this.onChange( richTextStructure.applyFormat( this.getRecord(), format ) );
	}

	/**
	 * Remove a format from the current value with the current selection.
	 *
	 * @param {string} formatType The type of format to remove.
	 */
	removeFormat( formatType ) {
		this.onChange( richTextStructure.removeFormat( this.getRecord(), formatType ) );
	}

	/**
	 * Get the current format based on the selection
	 *
	 * @param {string} formatType The type of format to check.
	 *
	 * @return {boolean} Wether the format is active or not.
	 */
	getActiveFormat( formatType ) {
		return richTextStructure.getActiveFormat( this.getRecord(), formatType );
	}

	/**
	 * Toggle a format based on the selection.
	 *
	 * @param {Object} format The format to toggle.
	 */
	toggleFormat( format ) {
		if ( this.getActiveFormat( format.type ) ) {
			this.removeFormat( format.type );
		} else {
			this.applyFormat( format );
		}
	}

	/**
	 * Handles a paste event from TinyMCE.
	 *
	 * Saves the pasted data as plain text in `pastedPlainText`.
	 *
	 * @param {PasteEvent} event The paste event as triggered by TinyMCE.
	 */
	onPaste( event ) {
		const clipboardData = event.clipboardData;
		const { items = [], files = [] } = clipboardData;
		const item = find( [ ...items, ...files ], ( { type } ) => /^image\/(?:jpe?g|png|gif)$/.test( type ) );
		let plainText = '';
		let html = '';

		// IE11 only supports `Text` as an argument for `getData` and will
		// otherwise throw an invalid argument error, so we try the standard
		// arguments first, then fallback to `Text` if they fail.
		try {
			plainText = clipboardData.getData( 'text/plain' );
			html = clipboardData.getData( 'text/html' );
		} catch ( error1 ) {
			try {
				html = clipboardData.getData( 'Text' );
			} catch ( error2 ) {
				// Some browsers like UC Browser paste plain text by default and
				// don't support clipboardData at all, so allow default
				// behaviour.
				return;
			}
		}

		event.preventDefault();

		// Allows us to ask for this information when we get a report.
		window.console.log( 'Received HTML:\n\n', html );
		window.console.log( 'Received plain text:\n\n', plainText );

		// Only process file if no HTML is present.
		// Note: a pasted file may have the URL as plain text.
		if ( item && ! html ) {
			const file = item.getAsFile ? item.getAsFile() : item;
			const content = rawHandler( {
				HTML: `<img src="${ createBlobURL( file ) }">`,
				mode: 'BLOCKS',
				tagName: this.props.tagName,
			} );
			const shouldReplace = this.props.onReplace && isEmpty( this.props.value );

			// Allows us to ask for this information when we get a report.
			window.console.log( 'Received item:\n\n', file );

			if ( shouldReplace ) {
				// Necessary to allow the paste bin to be removed without errors.
				this.props.setTimeout( () => this.props.onReplace( content ) );
			} else if ( this.props.onSplit ) {
				// Necessary to get the right range.
				// Also done in the TinyMCE paste plugin.
				this.props.setTimeout( () => this.splitContent( content ) );
			}

			return;
		}

		// There is a selection, check if a URL is pasted.
		if ( ! this.editor.selection.isCollapsed() ) {
			const pastedText = ( html || plainText ).replace( /<[^>]+>/g, '' ).trim();

			// A URL was pasted, turn the selection into a link
			if ( isURL( pastedText ) ) {
				this.applyFormat( {
					type: 'a',
					attributes: {
						href: this.editor.dom.decode( pastedText ),
					},
				} );

				// Allows us to ask for this information when we get a report.
				window.console.log( 'Created link:\n\n', pastedText );

				return;
			}
		}

		const shouldReplace = this.props.onReplace && isEmpty( this.props.value );

		let mode = 'INLINE';

		if ( shouldReplace ) {
			mode = 'BLOCKS';
		} else if ( this.props.onSplit ) {
			mode = 'AUTO';
		}

		const content = rawHandler( {
			HTML: html,
			plainText,
			mode,
			tagName: this.props.tagName,
			canUserUseUnfilteredHTML: this.props.canUserUseUnfilteredHTML,
		} );

		if ( typeof content === 'string' ) {
			this.editor.insertContent( content );
		} else if ( this.props.onSplit ) {
			if ( ! content.length ) {
				return;
			}

			if ( shouldReplace ) {
				this.props.onReplace( content );
			} else {
				this.splitContent( content, { paste: true } );
			}
		}
	}

	/**
	 * Handles a focus event on the contenteditable field, calling the
	 * `unstableOnFocus` prop callback if one is defined. The callback does not
	 * receive any arguments.
	 *
	 * This is marked as a private API and the `unstableOnFocus` prop is not
	 * documented, as the current requirements where it is used are subject to
	 * future refactoring following `isSelected` handling.
	 *
	 * In contrast with `setFocusedElement`, this is only triggered in response
	 * to focus within the contenteditable field, whereas `setFocusedElement`
	 * is triggered on focus within any `RichText` descendent element.
	 *
	 * @see setFocusedElement
	 *
	 * @private
	 */
	onFocus() {
		const { unstableOnFocus } = this.props;
		if ( unstableOnFocus ) {
			unstableOnFocus();
		}
	}

	/**
	 * Handles the `input` event: sync the content and handle transformations.
	 */
	onInput() {
		const { multiline } = this.props;
		const rootNode = this.editor.getBody();
		const range = this.editor.selection.getRng();
		let record = richTextStructure.createWithSelection( rootNode, range, multiline, richTextStructureSettings );
		const transformed = this.patterns.reduce( ( accu, transform ) => transform( accu ), record );

		if ( record !== transformed ) {
			richTextStructure.apply( transformed, this.editor.getBody(), multiline );
			record = transformed;
		}

		this.savedContent = record.value;
		this.props.onChange( record.value );
	}

	/**
	 * Handles the `selectionchange` event: sync the selection to local state.
	 */
	onSelectionChange() {
		const rootNode = this.editor.getBody();

		// Ensure it's the active element. This is a global event.
		if ( document.activeElement !== rootNode ) {
			return;
		}

		const range = this.editor.selection.getRng();
		const { multiline } = this.props;
		const { selection } = richTextStructure.createWithSelection( rootNode, range, multiline, richTextStructureSettings );
		const { start: nextStart, end: nextEnd } = selection;
		const { start, end } = this.state.selection;

		// Only set state if it's actually different.
		if ( multiline ) {
			if (
				start !== nextStart ||
				end !== nextEnd ||
				start[ 0 ] !== nextStart[ 0 ] ||
				start[ 1 ] !== nextStart[ 1 ] ||
				end[ 0 ] !== nextEnd[ 0 ] ||
				end[ 1 ] !== nextEnd[ 1 ]
			) {
				this.setState( { selection } );
			}
		} else if ( start !== nextStart || end !== nextEnd ) {
			this.setState( { selection } );
		}
	}

	/**
	 * Sync the value to global state.
	 *
	 * - If a record is provided, that record's value will be synced, the node
	 *   tree will be updated with the value, and the provided record's
	 *   selection will be set.
	 * - If no record is provided (such as after an input event), the node
	 *   tree will be converted to the right structure and synced. In the
	 *   future, the node tree and selection may be updated if they are
	 *   different after conversion.
	 *
	 * @param {Object} record The record to sync and apply. Optional.
	 */
	onChange( record ) {
		const { multiline } = this.props;
		const rootNode = this.editor.getBody();

		if ( ! record ) {
			const range = this.editor.selection.getRng();
			record = richTextStructure.createWithSelection( rootNode, range, multiline, richTextStructureSettings );
		} else {
			richTextStructure.apply( record, rootNode, multiline );
		}

		this.savedContent = record.value;
		this.props.onChange( record.value );
	}

	onCreateUndoLevel( event ) {
		// TinyMCE fires a `change` event when the first letter in an instance
		// is typed. This should not create a history record in Gutenberg.
		// https://github.com/tinymce/tinymce/blob/4.7.11/src/core/main/ts/api/UndoManager.ts#L116-L125
		// In other cases TinyMCE won't fire a `change` with at least a previous
		// record present, so this is a reliable check.
		// https://github.com/tinymce/tinymce/blob/4.7.11/src/core/main/ts/api/UndoManager.ts#L272-L275
		if ( event && event.lastLevel === null ) {
			return;
		}

		// Always ensure the content is up-to-date. This is needed because e.g.
		// making something bold will trigger a TinyMCE change event but no
		// input event. Avoid dispatching an action if the original event is
		// blur because the content will already be up-to-date.
		if ( ! event || ! event.originalEvent || event.originalEvent.type !== 'blur' ) {
			this.onChange();
		}

		this.props.onCreateUndoLevel();
	}

	/**
	 * Handles a delete keyDown event to handle merge or removal for collapsed
	 * selection where caret is at directional edge: forward for a delete key,
	 * reverse for a backspace key.
	 *
	 * @link https://en.wikipedia.org/wiki/Caret_navigation
	 *
	 * @param {tinymce.EditorEvent<KeyboardEvent>} event Keydown event.
	 */
	onDeleteKeyDown( event ) {
		const { onMerge, onRemove, value } = this.props;
		if ( ! onMerge && ! onRemove ) {
			return;
		}

		const { keyCode } = event;
		const isReverse = keyCode === BACKSPACE;

		// User is using the Remove Block shortcut, so allow the event to bubble
		// up to the BlockSettingsMenu component
		if ( isKeyboardEvent.primaryAlt( event, 'Backspace' ) ) {
			return;
		}

		const { isCollapsed } = getSelection();

		// Only process delete if the key press occurs at uncollapsed edge.
		if ( ! isCollapsed ) {
			return;
		}

		// It is important to consider emptiness because an empty container
		// will include a bogus TinyMCE BR node _after_ the caret, so in a
		// forward deletion the isHorizontalEdge function will incorrectly
		// interpret the presence of the bogus node as not being at the edge.
		const isEdge = (
			isEmpty( value ) ||
			isHorizontalEdge( this.editor.getBody(), isReverse )
		);

		if ( ! isEdge ) {
			return;
		}

		if ( onMerge ) {
			onMerge( ! isReverse );
		}

		// Only handle remove on Backspace. This serves dual-purpose of being
		// an intentional user interaction distinguishing between Backspace and
		// Delete to remove the empty field, but also to avoid merge & remove
		// causing destruction of two fields (merge, then removed merged).
		if ( onRemove && isEmpty( value ) && isReverse ) {
			onRemove( ! isReverse );
		}

		event.preventDefault();

		// Calling onMerge() or onRemove() will destroy the editor, so it's
		// important that we stop other handlers (e.g. ones registered by
		// TinyMCE) from also handling this event.
		event.stopImmediatePropagation();
	}

	/**
	 * Handles a horizontal navigation key down event to handle the case where
	 * TinyMCE attempts to preventDefault when on the outside edge of an inline
	 * boundary when arrowing _away_ from the boundary, not within it. Replaces
	 * the TinyMCE event `preventDefault` behavior with a noop, such that those
	 * relying on `defaultPrevented` are not misinformed about the arrow event.
	 *
	 * If TinyMCE#4476 is resolved, this handling may be removed.
	 *
	 * @see https://github.com/tinymce/tinymce/issues/4476
	 *
	 * @param {tinymce.EditorEvent<KeyboardEvent>} event Keydown event.
	 */
	onHorizontalNavigationKeyDown( event ) {
		const { focusNode } = getSelection();
		const { nodeType, nodeValue } = focusNode;

		if ( nodeType !== Node.TEXT_NODE ) {
			return;
		}

		if ( nodeValue.length !== 1 || nodeValue[ 0 ] !== TINYMCE_ZWSP ) {
			return;
		}

		const { keyCode } = event;

		// Consider to be moving away from inline boundary based on:
		//
		// 1. Within a text fragment consisting only of ZWSP.
		// 2. If in reverse, there is no previous sibling. If forward, there is
		//    no next sibling (i.e. end of node).
		const isReverse = keyCode === LEFT;
		const edgeSibling = isReverse ? 'previousSibling' : 'nextSibling';
		if ( ! focusNode[ edgeSibling ] ) {
			// Note: This is not reassigning on the native event, rather the
			// "fixed" TinyMCE copy, which proxies its preventDefault to the
			// native event. By reassigning here, we're effectively preventing
			// the proxied call on the native event, but not otherwise mutating
			// the original event object.
			event.preventDefault = noop;
		}
	}

	/**
	 * Handles a keydown event from TinyMCE.
	 *
	 * @param {KeydownEvent} event The keydown event as triggered by TinyMCE.
	 */
	onKeyDown( event ) {
		const dom = this.editor.dom;
		const rootNode = this.editor.getBody();
		const { keyCode } = event;

		const isDelete = keyCode === DELETE || keyCode === BACKSPACE;
		if ( isDelete ) {
			this.onDeleteKeyDown( event );
		}

		const isHorizontalNavigation = keyCode === LEFT || keyCode === RIGHT;
		if ( isHorizontalNavigation ) {
			this.onHorizontalNavigationKeyDown( event );
		}

		// If we click shift+Enter on inline RichTexts, we avoid creating two contenteditables
		// We also split the content and call the onSplit prop if provided.
		if ( keyCode === ENTER ) {
			if ( this.props.multiline ) {
				if ( ! this.props.onSplit ) {
					return;
				}

				const selectedNode = this.editor.selection.getNode();

				if ( selectedNode.parentNode !== rootNode ) {
					return;
				}

				if ( ! dom.isEmpty( selectedNode ) ) {
					return;
				}

				event.preventDefault();

				const childNodes = Array.from( rootNode.childNodes );
				const index = dom.nodeIndex( selectedNode );
				const beforeNodes = childNodes.slice( 0, index );
				const afterNodes = childNodes.slice( index + 1 );
				const beforeFragment = document.createDocumentFragment();
				const afterFragment = document.createDocumentFragment();

				beforeNodes.forEach( ( node ) => {
					beforeFragment.appendChild( node );
				} );
				afterNodes.forEach( ( node ) => {
					afterFragment.appendChild( node );
				} );

				const { multiline } = this.props;
				const before = richTextStructure.create( beforeFragment, multiline, richTextStructureSettings );
				const after = richTextStructure.create( afterFragment, multiline, richTextStructureSettings );

				this.props.onSplit( before, after );
			} else {
				event.preventDefault();

				if ( event.shiftKey || ! this.props.onSplit ) {
					this.editor.execCommand( 'InsertLineBreak', false, event );
				} else {
					this.splitContent();
				}
			}
		}
	}

	/**
	 * Handles TinyMCE key up event.
	 *
	 * @param {number} keyCode The key code that has been pressed on the keyboard.
	 */
	onKeyUp( { keyCode } ) {
		// The input event does not fire when the whole field is selected and
		// BACKSPACE is pressed.
		if ( keyCode === BACKSPACE ) {
			this.onChange();
			this.onSelectionChange();
		}

		// `scrollToRect` is called on `nodechange`, whereas calling it on
		// `keyup` *when* moving to a new RichText element results in incorrect
		// scrolling. Though the following allows false positives, it results
		// in much smoother scrolling.
		if ( this.props.isViewportSmall && keyCode !== BACKSPACE && keyCode !== ENTER ) {
			this.scrollToRect( getRectangleFromRange( this.editor.selection.getRng() ) );
		}
	}

	scrollToRect( rect ) {
		const { top: caretTop } = rect;
		const container = getScrollContainer( this.editor.getBody() );

		if ( ! container ) {
			return;
		}

		// When scrolling, avoid positioning the caret at the very top of
		// the viewport, providing some "air" and some textual context for
		// the user, and avoiding toolbars.
		const graceOffset = 100;

		// Avoid pointless scrolling by establishing a threshold under
		// which scrolling should be skipped;
		const epsilon = 10;
		const delta = caretTop - graceOffset;

		if ( Math.abs( delta ) > epsilon ) {
			container.scrollTo(
				container.scrollLeft,
				container.scrollTop + delta,
			);
		}
	}

	/**
	 * Splits the content at the location of the selection.
	 *
	 * Replaces the content of the editor inside this element with the contents
	 * before the selection. Sends the elements after the selection to the `onSplit`
	 * handler.
	 *
	 * @param {Array}  blocks  The blocks to add after the split point.
	 * @param {Object} context The context for splitting.
	 */
	splitContent( blocks = [], context = {} ) {
		const { onSplit, value } = this.props;
		const { selection } = this.state;

		if ( ! onSplit ) {
			return;
		}

		let [ before, after ] = richTextStructure.split( value, selection.start, selection.end );

		// In case split occurs at the trailing or leading edge of the field,
		// assume that the before/after values respectively reflect the current
		// value. This also provides an opportunity for the parent component to
		// determine whether the before/after value has changed using a trivial
		//  strict equality operation.
		if ( isEmpty( after ) ) {
			before = value;
		} else if ( isEmpty( before ) ) {
			after = value;
		}

		// If pasting and the split would result in no content other than the
		// pasted blocks, remove the before and after blocks.
		if ( context.paste ) {
			before = isEmpty( before ) ? null : before;
			after = isEmpty( after ) ? null : after;
		}

		onSplit( before, after, ...blocks );
	}

	onNodeChange( { parents } ) {
		if ( document.activeElement !== this.editor.getBody() ) {
			return;
		}

		if ( this.props.isViewportSmall ) {
			let rect;
			const selectedAnchor = find( parents, ( node ) => node.tagName === 'A' );
			if ( selectedAnchor ) {
				// If we selected a link, position the Link UI below the link
				rect = selectedAnchor.getBoundingClientRect();
			} else {
				// Otherwise, position the Link UI below the cursor or text selection
				rect = getRectangleFromRange( this.editor.selection.getRng() );
			}

			// Originally called on `focusin`, that hook turned out to be
			// premature. On `nodechange` we can work with the finalized TinyMCE
			// instance and scroll to proper position.
			this.scrollToRect( rect );
		}
	}

	componentDidUpdate( prevProps ) {
		const { tagName, value, multiline } = this.props;
		const { selection } = this.state;

		if (
			this.editor &&
			tagName === prevProps.tagName &&
			value !== prevProps.value &&
			value !== this.savedContent
		) {
			richTextStructure.apply( {
				value,
				selection: this.editor.hasFocus() ? selection : undefined,
			}, this.editor.getBody(), multiline );
		}
	}

	render() {
		const {
			tagName: Tagname = 'div',
			style,
			value,
			wrapperClassName,
			className,
			inlineToolbar = false,
			formattingControls,
			placeholder,
			multiline: MultilineTag,
			keepPlaceholderOnFocus = false,
			isSelected,
			autocompleters,
		} = this.props;

		const ariaProps = pickAriaProps( this.props );

		// Generating a key that includes `tagName` ensures that if the tag
		// changes, we unmount and destroy the previous TinyMCE element, then
		// mount and initialize a new child element in its place.
		const key = [ 'editor', Tagname ].join();
		const isPlaceholderVisible = placeholder && ( ! isSelected || keepPlaceholderOnFocus ) && isEmpty( value );
		const classes = classnames( wrapperClassName, 'editor-rich-text' );

		const formatToolbar = (
			<FormatToolbar
				selection={ this.state.selection }
				applyFormat={ this.applyFormat }
				removeFormat={ this.removeFormat }
				getActiveFormat={ this.getActiveFormat }
				toggleFormat={ this.toggleFormat }
				enabledControls={ formattingControls }
			/>
		);

		return (
			<div className={ classes }
				ref={ this.containerRef }
				onFocus={ this.setFocusedElement }
			>
				{ isSelected && ! inlineToolbar && (
					<BlockFormatControls>
						{ formatToolbar }
					</BlockFormatControls>
				) }
				{ isSelected && inlineToolbar && (
					<div className="editor-rich-text__inline-toolbar">
						{ formatToolbar }
					</div>
				) }
				{ isSelected &&
					<TokenUI
						editor={ this.editor }
						containerRef={ this.containerRef }
					/>
				}

				<Autocomplete
					onReplace={ this.props.onReplace }
					completers={ autocompleters }
					record={ this.getRecord() }
					onChange={ this.onChange }
				>
					{ ( { isExpanded, listBoxId, activeId } ) => (
						<Fragment>
							<TinyMCE
								tagName={ Tagname }
								getSettings={ this.getSettings }
								onSetup={ this.onSetup }
								style={ style }
								defaultValue={ value }
								isPlaceholderVisible={ isPlaceholderVisible }
								aria-label={ placeholder }
								aria-autocomplete="list"
								aria-expanded={ isExpanded }
								aria-owns={ listBoxId }
								aria-activedescendant={ activeId }
								{ ...ariaProps }
								className={ className }
								key={ key }
								onPaste={ this.onPaste }
								multiline={ MultilineTag }
							/>
							{ isPlaceholderVisible &&
								<Tagname
									className={ classnames( 'editor-rich-text__tinymce', className ) }
									style={ style }
								>
									{ MultilineTag ? <MultilineTag>{ placeholder }</MultilineTag> : placeholder }
								</Tagname>
							}
							{ isSelected && <Slot name="RichText.Siblings" /> }
						</Fragment>
					) }
				</Autocomplete>
			</div>
		);
	}
}

RichText.defaultProps = {
	formattingControls: FORMATTING_CONTROLS.map( ( { format } ) => format ),
};

const RichTextContainer = compose( [
	withInstanceId,
	withBlockEditContext( ( context, ownProps ) => {
		// When explicitly set as not selected, do nothing.
		if ( ownProps.isSelected === false ) {
			return {};
		}
		// When explicitly set as selected, use the value stored in the context instead.
		if ( ownProps.isSelected === true ) {
			return {
				isSelected: context.isSelected,
			};
		}

		// Ensures that only one RichText component can be focused.
		return {
			isSelected: context.isSelected && context.focusedElement === ownProps.instanceId,
			setFocusedElement: context.setFocusedElement,
		};
	} ),
	withSelect( ( select ) => {
		const { isViewportMatch = identity } = select( 'core/viewport' ) || {};
		const { canUserUseUnfilteredHTML } = select( 'core/editor' );

		return {
			isViewportSmall: isViewportMatch( '< small' ),
			canUserUseUnfilteredHTML: canUserUseUnfilteredHTML(),
		};
	} ),
	withDispatch( ( dispatch ) => {
		const {
			createUndoLevel,
			redo,
			undo,
		} = dispatch( 'core/editor' );

		return {
			onCreateUndoLevel: createUndoLevel,
			onRedo: redo,
			onUndo: undo,
		};
	} ),
	withSafeTimeout,
] )( RichText );

RichTextContainer.Content = ( { value, tagName: Tag, multiline, ...props } ) => {
	const content = (
		<RawHTML>
			{ richTextStructure.toString( value, multiline ) }
		</RawHTML>
	);

	if ( Tag ) {
		return <Tag { ...props }>{ content }</Tag>;
	}

	return content;
};

RichTextContainer.isEmpty = isEmpty;
RichTextContainer.concat = richTextStructure.concat;

export default RichTextContainer;
