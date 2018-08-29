/**
 * External dependencies
 */

import { deepEqual } from 'assert';
import { JSDOM } from 'jsdom';

/**
 * Internal dependencies
 */

import { create, createWithSelection } from '../create';
import { toString } from '../to-string';

const { window } = new JSDOM();
const { document } = window;

function createNode( HTML ) {
	const doc = document.implementation.createHTMLDocument( '' );
	doc.body.innerHTML = HTML;
	return doc.body.firstChild;
}

describe( 'create', () => {
	it( 'should extract text with formats', () => {
		const element = createNode( '<p>one <em>two 🍒</em> <a href="#"><img src=""><strong>three</strong></a><img src=""></p>' );
		const range = {
			startOffset: 1,
			startContainer: element.querySelector( 'em' ).firstChild,
			endOffset: 0,
			endContainer: element.querySelector( 'strong' ).firstChild,
		};

		deepEqual( createWithSelection( element, range ), {
			value: {
				formats: [
					undefined,
					undefined,
					undefined,
					undefined,
					[ { type: 'em' } ],
					[ { type: 'em' } ],
					[ { type: 'em' } ],
					[ { type: 'em' } ],
					[ { type: 'em' } ],
					[ { type: 'em' } ],
					undefined,
					[ { type: 'a', attributes: { href: '#' } }, { type: 'img', attributes: { src: '' }, object: true }, { type: 'strong' } ],
					[ { type: 'a', attributes: { href: '#' } }, { type: 'strong' } ],
					[ { type: 'a', attributes: { href: '#' } }, { type: 'strong' } ],
					[ { type: 'a', attributes: { href: '#' } }, { type: 'strong' } ],
					[ { type: 'a', attributes: { href: '#' } }, { type: 'strong' } ],
					[ { type: 'img', attributes: { src: '' }, object: true } ],
				],
				text: 'one two 🍒 three',
			},
			selection: {
				start: 5,
				end: 11,
			},
		} );
	} );

	it( 'should extract multiline text', () => {
		const element = createNode( '<div><p>one <em>two</em> three</p><p>test</p></div>' );
		const range = {
			startOffset: 1,
			startContainer: element.querySelector( 'em' ).firstChild,
			endOffset: 0,
			endContainer: element.lastChild,
		};

		deepEqual( createWithSelection( element, range, 'p' ), {
			value: [
				{
					formats: [
						undefined,
						undefined,
						undefined,
						undefined,
						[ { type: 'em' } ],
						[ { type: 'em' } ],
						[ { type: 'em' } ],
						undefined,
						undefined,
						undefined,
						undefined,
						undefined,
						undefined,
					],
					text: 'one two three',
				},
				{
					formats: [
						undefined,
						undefined,
						undefined,
						undefined,
					],
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

		deepEqual( create( element, 'li' ), [
			{
				formats: [
					undefined,
					undefined,
					undefined,
					[ { type: 'ul' }, { type: 'li' } ],
					[ { type: 'ul' }, { type: 'li' } ],
					[ { type: 'ul' }, { type: 'li' } ],
				],
				text: 'onetwo',
			},
			{
				formats: [
					undefined,
					undefined,
					undefined,
					undefined,
					undefined,
				],
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

		deepEqual( createWithSelection( element, range, false, settings ), {
			value: {
				formats: [
					[ { type: 'strong' } ],
					[ { type: 'strong' } ],
					[ { type: 'strong' } ],
					[ { type: 'strong' } ],
				],
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

		deepEqual( createWithSelection( element, range, false, settings ), {
			value: {
				formats: [
					[ { type: 'strong' } ],
					[ { type: 'strong' } ],
					[ { type: 'strong' } ],
					[ { type: 'strong' } ],
					undefined,
					undefined,
					undefined,
					undefined,
					undefined,
				],
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

		deepEqual( createWithSelection( element, range1, false ), {
			value: {
				formats: [
					undefined,
					undefined,
					undefined,
					undefined,
					undefined,
					undefined,
					undefined,
					undefined,
					undefined,
				],
				text: 'test\ntest',
			},
			selection: {
				start: 4,
				end: 4,
			},
		} );

		deepEqual( createWithSelection( element, range2, false ), {
			value: {
				formats: [
					undefined,
					undefined,
					undefined,
					undefined,
					undefined,
					undefined,
					undefined,
					undefined,
					undefined,
				],
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

		deepEqual( toString( create( createNode( `<p>${ HTML }</p>` ), false, settings ) ), '' );
	} );

	it( 'should skip bogus 2', () => {
		const HTML = '<strong data-mce-bogus="true"></strong>';

		deepEqual( toString( create( createNode( `<p>${ HTML }</p>` ), false, settings ) ), '' );
	} );

	it( 'should skip bogus 3', () => {
		const HTML = '<strong data-mce-bogus="true">test <em>test</em></strong>';

		deepEqual( toString( create( createNode( `<p>${ HTML }</p>` ), false, settings ) ), 'test <em>test</em>' );
	} );

	it( 'should skip bogus 4', () => {
		const HTML = '<strong data-mce-bogus="all">test</strong>';

		deepEqual( toString( create( createNode( `<p>${ HTML }</p>` ), false, settings ) ), '' );
	} );

	it( 'should skip bogus 5', () => {
		const HTML = '<strong data-mce-selected="inline-boundary">test&#65279;</strong>';

		deepEqual( toString( create( createNode( `<p>${ HTML }</p>` ), false, settings ) ), '<strong>test</strong>' );
	} );
} );
