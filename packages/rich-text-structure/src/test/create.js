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

describe( 'createValue', () => {
	const em = { type: 'em' };
	const strong = { type: 'strong' };
	const img = { type: 'img', attributes: { src: '' }, object: true };
	const a = { type: 'a', attributes: { href: '#' } };
	const list = [ { type: 'ul' }, { type: 'li' } ];

	const spec = [
		{
			description: 'should create an empty value',
			html: '',
			value: {
				formats: [],
				text: '',
			},
		},
		{
			description: 'should create an empty value from empty tags',
			html: '<em></em>',
			value: {
				formats: [],
				text: '',
			},
		},
		{
			description: 'should create a value without formatting',
			html: 'test',
			value: {
				formats: [ , , , , ],
				text: 'test',
			},
		},
		{
			description: 'should preserve emoji',
			html: '🍒',
			value: {
				formats: [ , , ],
				text: '🍒',
			},
		},
		{
			description: 'should preserve emoji in formatting',
			html: '<em>🍒</em>',
			value: {
				formats: [ [ em ], [ em ] ],
				text: '🍒',
			},
		},
		{
			description: 'should create a value with formatting',
			html: '<em>test</em>',
			value: {
				formats: [ [ em ], [ em ], [ em ], [ em ] ],
				text: 'test',
			},
		},
		{
			description: 'should create a value with nested formatting',
			html: '<em><strong>test</strong></em>',
			value: {
				formats: [ [ em, strong ], [ em, strong ], [ em, strong ], [ em, strong ] ],
				text: 'test',
			},
		},
		{
			description: 'should create a value with formatting for split tags',
			html: '<em>te</em><em>st</em>',
			value: {
				formats: [ [ em ], [ em ], [ em ], [ em ] ],
				text: 'test',
			},
		},
		{
			description: 'should create a value with formatting with attributes',
			html: '<a href="#">test</a>',
			value: {
				formats: [ [ a ], [ a ], [ a ], [ a ] ],
				text: 'test',
			},
		},
		{
			description: 'should create a value with image object',
			html: '<img src="">',
			value: {
				formats: [ [ img ] ],
				text: '',
			},
		},
		{
			description: 'should create a value with image object and formatting',
			html: '<em><img src=""></em>',
			value: {
				formats: [ [ em, img ] ],
				text: '',
			},
		},
		{
			description: 'should create a value with image object and text before',
			html: 'te<em>st<img src=""></em>',
			value: {
				formats: [ , , [ em ], [ em ], [ em, img ] ],
				text: 'test',
			},
		},
		{
			description: 'should create a value with image object and text after',
			html: '<em><img src="">te</em>st',
			value: {
				formats: [ [ em, img ], [ em ], [ em ], , , ],
				text: 'test',
			},
		},
		{
			description: 'should handle br',
			html: '<br>',
			value: {
				formats: [ , ],
				text: '\n',
			},
		},
		{
			description: 'should handle br with text',
			html: 'te<br>st',
			value: {
				formats: [ , , , , , ],
				text: 'te\nst',
			},
		},
		{
			description: 'should handle br with formatting',
			html: '<em><br></em>',
			value: {
				formats: [ [ em ] ],
				text: '\n',
			},
		},
		{
			description: 'should handle multiline value',
			multiline: 'p',
			html: '<p>one</p><p>two</p>',
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
		{
			description: 'should handle multiline list value',
			multiline: 'li',
			html: '<li>one<ul><li>two</li></ul></li><li>three</li>',
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
	];

	spec.forEach( ( { description, multiline, html, value } ) => {
		it( description, () => {
			const createdValue = createValue( html, multiline );
			expect( createdValue ).toEqual( value );

			if ( ! multiline ) {
				const formatsLength = getSparseArrayLength( value.formats );
				const createdFormatsLength = getSparseArrayLength( createdValue.formats );
				expect( createdFormatsLength ).toEqual( formatsLength );
			}
		} );
	} );

	it( 'should reference formats', () => {
		const element = createNode( '<p><em>te<strong>st</strong></em></p>' );
		const value = createValue( element );

		expect( value ).toEqual( {
			formats: [ [ em ], [ em ], [ em, strong ], [ em, strong ] ],
			text: 'test',
		} );

		expect( value.formats[ 0 ][ 0 ] ).toBe( value.formats[ 1 ][ 0 ] );
		expect( value.formats[ 0 ][ 0 ] ).toBe( value.formats[ 2 ][ 0 ] );
		expect( value.formats[ 2 ][ 1 ] ).toBe( value.formats[ 3 ][ 1 ] );
	} );
} );

describe( 'create', () => {
	const em = { type: 'em' };
	const strong = { type: 'strong' };
	const a = { type: 'a', attributes: { href: '#' } };
	const img = { type: 'img', attributes: { src: '' }, object: true };

	it( 'should extract text with formats', () => {
		const element = createNode( '<p>one <em>two 🍒</em> <a href="#"><img src=""><strong>three</strong></a><img src=""></p>' );
		const range = {
			startOffset: 1,
			startContainer: element.querySelector( 'em' ).firstChild,
			endOffset: 0,
			endContainer: element.querySelector( 'strong' ).firstChild,
		};
		const actual = create( element, range );

		expect( actual ).toEqual( {
			value: {
				formats: [ , , , ,
					[ em ],
					[ em ],
					[ em ],
					[ em ],
					[ em ],
					[ em ], ,
					[ a, img, strong ],
					[ a, strong ],
					[ a, strong ],
					[ a, strong ],
					[ a, strong ],
					[ img ],
				],
				text: 'one two 🍒 three',
			},
			selection: {
				start: 5,
				end: 11,
			},
		} );

		expect( getSparseArrayLength( actual.value.formats ) ).toBe( 12 );
	} );

	it( 'should extract text with node selection', () => {
		const element = createNode( '<p>one <em>two 🍒</em></p>' );
		const range = {
			startOffset: 1,
			startContainer: element,
			endOffset: 2,
			endContainer: element,
		};
		const actual = create( element, range );

		expect( actual ).toEqual( {
			value: {
				formats: [ , , , , [ em ], [ em ], [ em ], [ em ], [ em ], [ em ] ],
				text: 'one two 🍒',
			},
			selection: {
				start: 4,
				end: 10,
			},
		} );

		expect( getSparseArrayLength( actual.value.formats ) ).toBe( 6 );
	} );

	it( 'should extract multiline text', () => {
		const element = createNode( '<div><p>one <em>two</em> three</p><p>test</p></div>' );
		const range = {
			startOffset: 1,
			startContainer: element.querySelector( 'em' ).firstChild,
			endOffset: 0,
			endContainer: element.lastChild,
		};
		const actual = create( element, range, 'p' );

		expect( actual ).toEqual( {
			value: [
				{
					formats: [ , , , , [ em ], [ em ], [ em ], , , , , , , ],
					text: 'one two three',
				},
				{
					formats: [ , , , , ],
					text: 'test',
				},
			],
			selection: {
				start: [ 0, 5 ],
				end: [ 1 ],
			},
		} );
		expect( getSparseArrayLength( actual.value[ 0 ].formats ) ).toBe( 3 );
		expect( getSparseArrayLength( actual.value[ 1 ].formats ) ).toBe( 0 );
	} );

	it( 'should skip bogus 1', () => {
		const element = createNode( '<p><strong data-mce-selected="inline-boundary">&#65279;test</strong></p>' );
		const range = {
			startOffset: 1,
			startContainer: element.querySelector( 'strong' ).firstChild,
			endOffset: 1,
			endContainer: element.querySelector( 'strong' ).firstChild,
		};
		const settings = {
			removeNodeMatch: ( node ) => node.getAttribute( 'data-mce-bogus' ) === 'all',
			unwrapNodeMatch: ( node ) => !! node.getAttribute( 'data-mce-bogus' ),
			removeAttributeMatch: ( attribute ) => attribute.indexOf( 'data-mce-' ) === 0,
			filterString: ( string ) => string.replace( '\uFEFF', '' ),
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
		const settings = {
			removeNodeMatch: ( node ) => node.getAttribute( 'data-mce-bogus' ) === 'all',
			unwrapNodeMatch: ( node ) => !! node.getAttribute( 'data-mce-bogus' ),
			removeAttributeMatch: ( attribute ) => attribute.indexOf( 'data-mce-' ) === 0,
			filterString: ( string ) => string.replace( '\uFEFF', '' ),
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

	it( 'should handle br', () => {
		const element = createNode( '<p>test<br>test</p>' );
		const range1 = {
			startOffset: 1,
			startContainer: element,
			endOffset: 1,
			endContainer: element,
		};
		const range2 = {
			startOffset: 0,
			startContainer: element.lastChild,
			endOffset: 0,
			endContainer: element.lastChild,
		};
		const actual1 = create( element, range1, false );
		const actual2 = create( element, range2, false );

		expect( actual1 ).toEqual( {
			value: {
				formats: [ , , , , , , , , , ],
				text: 'test\ntest',
			},
			selection: {
				start: 4,
				end: 4,
			},
		} );
		expect( getSparseArrayLength( actual1.value.formats ) ).toBe( 0 );
		expect( actual2 ).toEqual( {
			value: {
				formats: [ , , , , , , , , , ],
				text: 'test\ntest',
			},
			selection: {
				start: 5,
				end: 5,
			},
		} );
		expect( getSparseArrayLength( actual2.value.formats ) ).toBe( 0 );
	} );
} );

describe( 'create with settings', () => {
	const settings = {
		removeNodeMatch: ( node ) => node.getAttribute( 'data-mce-bogus' ) === 'all',
		unwrapNodeMatch: ( node ) => !! node.getAttribute( 'data-mce-bogus' ),
		removeAttributeMatch: ( attribute ) => attribute.indexOf( 'data-mce-' ) === 0,
		filterString: ( string ) => string.replace( '\uFEFF', '' ),
	};

	it( 'should skip bogus 1', () => {
		const HTML = '<br data-mce-bogus="true">';

		expect( toHTMLString( createValue( createNode( `<p>${ HTML }</p>` ), false, settings ) ) ).toEqual( '' );
	} );

	it( 'should skip bogus 2', () => {
		const HTML = '<strong data-mce-bogus="true"></strong>';

		expect( toHTMLString( createValue( createNode( `<p>${ HTML }</p>` ), false, settings ) ) ).toEqual( '' );
	} );

	it( 'should skip bogus 3', () => {
		const HTML = '<strong data-mce-bogus="true">test <em>test</em></strong>';

		expect( toHTMLString( createValue( createNode( `<p>${ HTML }</p>` ), false, settings ) ) ).toEqual( 'test <em>test</em>' );
	} );

	it( 'should skip bogus 4', () => {
		const HTML = '<strong data-mce-bogus="all">test</strong>';

		expect( toHTMLString( createValue( createNode( `<p>${ HTML }</p>` ), false, settings ) ) ).toEqual( '' );
	} );

	it( 'should skip bogus 5', () => {
		const HTML = '<strong data-mce-selected="inline-boundary">test&#65279;</strong>';

		expect( toHTMLString( createValue( createNode( `<p>${ HTML }</p>` ), false, settings ) ) ).toEqual( '<strong>test</strong>' );
	} );
} );
