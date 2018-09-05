/**
 * External dependencies
 */

import { JSDOM } from 'jsdom';

/**
 * Internal dependencies
 */

import { create, createValue } from '../create';
import { toString } from '../to-string';

const { window } = new JSDOM();
const { document } = window;

function createNode( HTML ) {
	const doc = document.implementation.createHTMLDocument( '' );
	doc.body.innerHTML = HTML;
	return doc.body.firstChild;
}

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

		expect( create( element, range ) ).toEqual( {
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

	it( 'should extract multiline text', () => {
		const element = createNode( '<div><p>one <em>two</em> three</p><p>test</p></div>' );
		const range = {
			startOffset: 1,
			startContainer: element.querySelector( 'em' ).firstChild,
			endOffset: 0,
			endContainer: element.lastChild,
		};

		expect( create( element, range, 'p' ) ).toEqual( {
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
	} );

	it( 'should extract multiline text list', () => {
		const element = createNode( '<ul><li>one<ul><li>two</li></ul></li><li>three</li></ul>' );

		expect( createValue( element, 'li' ) ).toEqual( [
			{
				formats: [ , , ,
					[ { type: 'ul' }, { type: 'li' } ],
					[ { type: 'ul' }, { type: 'li' } ],
					[ { type: 'ul' }, { type: 'li' } ],
				],
				text: 'onetwo',
			},
			{
				formats: [ , , , , , ],
				text: 'three',
			},
		] );
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

		expect( create( element, range, false, settings ) ).toEqual( {
			value: {
				formats: [ [ strong ], [ strong ], [ strong ], [ strong ] ],
				text: 'test',
			},
			selection: {
				start: 0,
				end: 0,
			},
		} );
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

		expect( create( element, range1, false ) ).toEqual( {
			value: {
				formats: [ , , , , , , , , , ],
				text: 'test\ntest',
			},
			selection: {
				start: 4,
				end: 4,
			},
		} );

		expect( create( element, range2, false ) ).toEqual( {
			value: {
				formats: [ , , , , , , , , , ],
				text: 'test\ntest',
			},
			selection: {
				start: 5,
				end: 5,
			},
		} );
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

		expect( toString( createValue( createNode( `<p>${ HTML }</p>` ), false, settings ) ) ).toEqual( '' );
	} );

	it( 'should skip bogus 2', () => {
		const HTML = '<strong data-mce-bogus="true"></strong>';

		expect( toString( createValue( createNode( `<p>${ HTML }</p>` ), false, settings ) ) ).toEqual( '' );
	} );

	it( 'should skip bogus 3', () => {
		const HTML = '<strong data-mce-bogus="true">test <em>test</em></strong>';

		expect( toString( createValue( createNode( `<p>${ HTML }</p>` ), false, settings ) ) ).toEqual( 'test <em>test</em>' );
	} );

	it( 'should skip bogus 4', () => {
		const HTML = '<strong data-mce-bogus="all">test</strong>';

		expect( toString( createValue( createNode( `<p>${ HTML }</p>` ), false, settings ) ) ).toEqual( '' );
	} );

	it( 'should skip bogus 5', () => {
		const HTML = '<strong data-mce-selected="inline-boundary">test&#65279;</strong>';

		expect( toString( createValue( createNode( `<p>${ HTML }</p>` ), false, settings ) ) ).toEqual( '<strong>test</strong>' );
	} );
} );
