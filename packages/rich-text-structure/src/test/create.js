/**
 * External dependencies
 */

import { JSDOM } from 'jsdom';

/**
 * Internal dependencies
 */

import { create, createValue } from '../create';
import { toHTMLString } from '../to-html-string';
import { getSparseArrayLength } from './helpers';

const { window } = new JSDOM();
const { document } = window;

function createNode( HTML ) {
	const doc = document.implementation.createHTMLDocument( '' );
	doc.body.innerHTML = HTML;
	return doc.body.firstChild;
}

function createElement( html ) {
	const htmlDocument = document.implementation.createHTMLDocument( '' );

	htmlDocument.body.innerHTML = html;

	return htmlDocument.body;
}

describe( 'create', () => {
	const em = { type: 'em' };
	const strong = { type: 'strong' };
	const img = { type: 'img', attributes: { src: '' }, object: true };
	const a = { type: 'a', attributes: { href: '#' } };
	const list = [ { type: 'ul' }, { type: 'li' } ];

	const spec = [
		{
			description: 'should create an empty value',
			html: '',
			createRange: ( element ) => ( {
				startOffset: 0,
				startContainer: element,
				endOffset: 1,
				endContainer: element,
			} ),
			record: {
				selection: {},
				value: {
					formats: [],
					text: '',
				},
			},
		},
		{
			description: 'should create an empty value from empty tags',
			html: '<em></em>',
			createRange: ( element ) => ( {
				startOffset: 0,
				startContainer: element,
				endOffset: 1,
				endContainer: element,
			} ),
			record: {
				selection: {
					start: 0,
					end: 0,
				},
				value: {
					formats: [],
					text: '',
				},
			},
		},
		{
			description: 'should create a value without formatting',
			html: 'test',
			createRange: ( element ) => ( {
				startOffset: 0,
				startContainer: element.firstChild,
				endOffset: 4,
				endContainer: element.firstChild,
			} ),
			record: {
				selection: {
					start: 0,
					end: 4,
				},
				value: {
					formats: [ , , , , ],
					text: 'test',
				},
			},
		},
		{
			description: 'should preserve emoji',
			html: '🍒',
			createRange: ( element ) => ( {
				startOffset: 0,
				startContainer: element,
				endOffset: 1,
				endContainer: element,
			} ),
			record: {
				selection: {
					start: 0,
					end: 2,
				},
				value: {
					formats: [ , , ],
					text: '🍒',
				},
			},
		},
		{
			description: 'should preserve emoji in formatting',
			html: '<em>🍒</em>',
			createRange: ( element ) => ( {
				startOffset: 0,
				startContainer: element,
				endOffset: 1,
				endContainer: element,
			} ),
			record: {
				selection: {
					start: 0,
					end: 2,
				},
				value: {
					formats: [ [ em ], [ em ] ],
					text: '🍒',
				},
			},
		},
		{
			description: 'should create a value with formatting',
			html: '<em>test</em>',
			createRange: ( element ) => ( {
				startOffset: 0,
				startContainer: element.firstChild,
				endOffset: 1,
				endContainer: element.firstChild,
			} ),
			record: {
				selection: {
					start: 0,
					end: 4,
				},
				value: {
					formats: [ [ em ], [ em ], [ em ], [ em ] ],
					text: 'test',
				},
			},
		},
		{
			description: 'should create a value with nested formatting',
			html: '<em><strong>test</strong></em>',
			createRange: ( element ) => ( {
				startOffset: 0,
				startContainer: element,
				endOffset: 1,
				endContainer: element,
			} ),
			record: {
				selection: {
					start: 0,
					end: 4,
				},
				value: {
					formats: [ [ em, strong ], [ em, strong ], [ em, strong ], [ em, strong ] ],
					text: 'test',
				},
			},
		},
		{
			description: 'should create a value with formatting for split tags',
			html: '<em>te</em><em>st</em>',
			createRange: ( element ) => ( {
				startOffset: 0,
				startContainer: element.querySelector( 'em' ),
				endOffset: 1,
				endContainer: element.querySelector( 'em' ),
			} ),
			record: {
				selection: {
					start: 0,
					end: 2,
				},
				value: {
					formats: [ [ em ], [ em ], [ em ], [ em ] ],
					text: 'test',
				},
			},
		},
		{
			description: 'should create a value with formatting with attributes',
			html: '<a href="#">test</a>',
			createRange: ( element ) => ( {
				startOffset: 0,
				startContainer: element,
				endOffset: 1,
				endContainer: element,
			} ),
			record: {
				selection: {
					start: 0,
					end: 4,
				},
				value: {
					formats: [ [ a ], [ a ], [ a ], [ a ] ],
					text: 'test',
				},
			},
		},
		{
			description: 'should create a value with image object',
			html: '<img src="">',
			createRange: ( element ) => ( {
				startOffset: 0,
				startContainer: element,
				endOffset: 1,
				endContainer: element,
			} ),
			record: {
				selection: {
					start: 0,
					end: 0,
				},
				value: {
					formats: [ [ img ] ],
					text: '',
				},
			},
		},
		{
			description: 'should create a value with image object and formatting',
			html: '<em><img src=""></em>',
			createRange: ( element ) => ( {
				startOffset: 0,
				startContainer: element.querySelector( 'img' ),
				endOffset: 1,
				endContainer: element.querySelector( 'img' ),
			} ),
			record: {
				selection: {},
				value: {
					formats: [ [ em, img ] ],
					text: '',
				},
			},
		},
		{
			description: 'should create a value with image object and text before',
			html: 'te<em>st<img src=""></em>',
			createRange: ( element ) => ( {
				startOffset: 0,
				startContainer: element,
				endOffset: 2,
				endContainer: element,
			} ),
			record: {
				selection: {
					start: 0,
					end: 4,
				},
				value: {
					formats: [ , , [ em ], [ em ], [ em, img ] ],
					text: 'test',
				},
			},
		},
		{
			description: 'should create a value with image object and text after',
			html: '<em><img src="">te</em>st',
			createRange: ( element ) => ( {
				startOffset: 0,
				startContainer: element,
				endOffset: 2,
				endContainer: element,
			} ),
			record: {
				selection: {
					start: 0,
					end: 4,
				},
				value: {
					formats: [ [ em, img ], [ em ], [ em ], , , ],
					text: 'test',
				},
			},
		},
		{
			description: 'should handle br',
			html: '<br>',
			createRange: ( element ) => ( {
				startOffset: 0,
				startContainer: element,
				endOffset: 1,
				endContainer: element,
			} ),
			record: {
				selection: {
					start: 0,
					end: 0,
				},
				value: {
					formats: [ , ],
					text: '\n',
				},
			},
		},
		{
			description: 'should handle br with text',
			html: 'te<br>st',
			createRange: ( element ) => ( {
				startOffset: 1,
				startContainer: element,
				endOffset: 2,
				endContainer: element,
			} ),
			record: {
				selection: {
					start: 2,
					end: 2,
				},
				value: {
					formats: [ , , , , , ],
					text: 'te\nst',
				},
			},
		},
		{
			description: 'should handle br with formatting',
			html: '<em><br></em>',
			createRange: ( element ) => ( {
				startOffset: 0,
				startContainer: element,
				endOffset: 1,
				endContainer: element,
			} ),
			record: {
				selection: {
					start: 0,
					end: 1,
				},
				value: {
					formats: [ [ em ] ],
					text: '\n',
				},
			},
		},
		{
			description: 'should handle multiline value',
			multiline: 'p',
			html: '<p>one</p><p>two</p>',
			createRange: ( element ) => ( {
				startOffset: 1,
				startContainer: element.querySelector( 'p' ).firstChild,
				endOffset: 0,
				endContainer: element.lastChild,
			} ),
			record: {
				selection: {
					start: [ 0, 1 ],
					end: [ 1 ],
				},
				value: [
					{
						formats: [ , , , ],
						text: 'one',
					},
					{
						formats: [ , , , ],
						text: 'two',
					},
				],
			},
		},
		{
			description: 'should handle multiline list value',
			multiline: 'li',
			html: '<li>one<ul><li>two</li></ul></li><li>three</li>',
			createRange: ( element ) => ( {
				startOffset: 0,
				startContainer: element,
				endOffset: 1,
				endContainer: element,
			} ),
			record: {
				selection: {},
				value: [
					{
						formats: [ , , , list, list, list ],
						text: 'onetwo',
					},
					{
						formats: [ , , , , , ],
						text: 'three',
					},
				],
			},
		},
	];

	spec.forEach( ( { description, multiline, html, createRange, record } ) => {
		it( description, () => {
			const element = createElement( html );
			const range = createRange( element );
			const createdRecord = create( element, range, multiline );
			expect( createdRecord ).toEqual( record );

			if ( ! multiline ) {
				const formatsLength = getSparseArrayLength( record.value.formats );
				const createdFormatsLength = getSparseArrayLength( createdRecord.value.formats );
				expect( createdFormatsLength ).toEqual( formatsLength );
			}
		} );
	} );

	it( 'should reference formats', () => {
		const value = createValue( '<em>te<strong>st</strong></em>' );

		expect( value ).toEqual( {
			formats: [ [ em ], [ em ], [ em, strong ], [ em, strong ] ],
			text: 'test',
		} );

		expect( value.formats[ 0 ][ 0 ] ).toBe( value.formats[ 1 ][ 0 ] );
		expect( value.formats[ 0 ][ 0 ] ).toBe( value.formats[ 2 ][ 0 ] );
		expect( value.formats[ 2 ][ 1 ] ).toBe( value.formats[ 3 ][ 1 ] );
	} );
} );

describe( 'create with settings', () => {
	const strong = { type: 'strong' };
	const settings = {
		removeNodeMatch: ( node ) => node.getAttribute( 'data-mce-bogus' ) === 'all',
		unwrapNodeMatch: ( node ) => !! node.getAttribute( 'data-mce-bogus' ),
		removeAttributeMatch: ( attribute ) => attribute.indexOf( 'data-mce-' ) === 0,
		filterString: ( string ) => string.replace( '\uFEFF', '' ),
	};

	it( 'should skip bogus 1', () => {
		const element = createNode( '<p><strong data-mce-selected="inline-boundary">&#65279;test</strong></p>' );
		const range = {
			startOffset: 1,
			startContainer: element.querySelector( 'strong' ).firstChild,
			endOffset: 1,
			endContainer: element.querySelector( 'strong' ).firstChild,
		};
		const actual = create( element, range, false, settings );

		expect( actual ).toEqual( {
			value: {
				formats: [ [ strong ], [ strong ], [ strong ], [ strong ] ],
				text: 'test',
			},
			selection: {
				start: 0,
				end: 0,
			},
		} );
		expect( getSparseArrayLength( actual.value.formats ) ).toBe( 4 );
	} );

	it( 'should skip bogus 2', () => {
		const element = createNode( '<p><strong>test<span data-mce-bogus="all">test</span></strong> test</p>' );
		const range = {
			startOffset: 1,
			startContainer: element.lastChild,
			endOffset: 1,
			endContainer: element.lastChild,
		};
		const actual = create( element, range, false, settings );

		expect( create( element, range, false, settings ) ).toEqual( {
			value: {
				formats: [ [ strong ], [ strong ], [ strong ], [ strong ], , , , , , ],
				text: 'test test',
			},
			selection: {
				start: 5,
				end: 5,
			},
		} );
		expect( getSparseArrayLength( actual.value.formats ) ).toBe( 4 );
	} );

	it( 'should skip bogus 3', () => {
		const HTML = '<br data-mce-bogus="true">';

		expect( toHTMLString( createValue( createNode( `<p>${ HTML }</p>` ), false, settings ) ) ).toEqual( '' );
	} );

	it( 'should skip bogus 4', () => {
		const HTML = '<strong data-mce-bogus="true"></strong>';

		expect( toHTMLString( createValue( createNode( `<p>${ HTML }</p>` ), false, settings ) ) ).toEqual( '' );
	} );

	it( 'should skip bogus 5', () => {
		const HTML = '<strong data-mce-bogus="true">test <em>test</em></strong>';

		expect( toHTMLString( createValue( createNode( `<p>${ HTML }</p>` ), false, settings ) ) ).toEqual( 'test <em>test</em>' );
	} );

	it( 'should skip bogus 6', () => {
		const HTML = '<strong data-mce-bogus="all">test</strong>';

		expect( toHTMLString( createValue( createNode( `<p>${ HTML }</p>` ), false, settings ) ) ).toEqual( '' );
	} );

	it( 'should skip bogus 7', () => {
		const HTML = '<strong data-mce-selected="inline-boundary">test&#65279;</strong>';

		expect( toHTMLString( createValue( createNode( `<p>${ HTML }</p>` ), false, settings ) ) ).toEqual( '<strong>test</strong>' );
	} );
} );
