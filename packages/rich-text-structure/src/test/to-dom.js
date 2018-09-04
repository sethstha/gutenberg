/**
 * External dependencies
 */

import { JSDOM } from 'jsdom';

/**
 * Internal dependencies
 */

import { create } from '../create';
import { recordToDom, multilineRecordToDom } from '../to-dom';

const { window } = new JSDOM();
const { document } = window;

function createNode( HTML ) {
	const doc = document.implementation.createHTMLDocument( '' );
	doc.body.innerHTML = HTML;
	return doc.body.firstChild;
}

describe( 'recordToDom', () => {
	it( 'should extract recreate HTML 1', () => {
		const HTML = 'one <em>two 🍒</em> <a href="#"><img src=""><strong>three</strong></a><img src="">';
		const node = createNode( `<p>${ HTML }</p>` );
		const range = {
			startOffset: 1,
			startContainer: node.querySelector( 'em' ).firstChild,
			endOffset: 0,
			endContainer: node.querySelector( 'strong' ).firstChild,
		};
		const { body, selection } = recordToDom( create( node, range ) );

		expect( body.innerHTML ).toEqual( node.innerHTML );
		expect( selection ).toEqual( {
			startPath: [ 1, 0, range.startOffset ],
			endPath: [ 3, 1, 0, range.endOffset ],
		} );
	} );

	it( 'should extract recreate HTML 2', () => {
		const HTML = 'one <em>two 🍒</em> <a href="#">test <img src=""><strong>three</strong></a><img src="">';
		const node = createNode( `<p>${ HTML }</p>` );
		const range = {
			startOffset: 1,
			startContainer: node.querySelector( 'em' ).firstChild,
			endOffset: 0,
			endContainer: node.querySelector( 'strong' ).firstChild,
		};
		const { body, selection } = recordToDom( create( node, range ) );

		expect( body.innerHTML ).toEqual( node.innerHTML );
		expect( selection ).toEqual( {
			startPath: [ 1, 0, range.startOffset ],
			endPath: [ 3, 2, 0, range.endOffset ],
		} );
	} );

	it( 'should extract recreate HTML 3', () => {
		const HTML = '<img src="">';
		const node = createNode( `<p>${ HTML }</p>` );
		const range = {
			startOffset: 0,
			startContainer: node,
			endOffset: 0,
			endContainer: node,
		};
		const { body, selection } = recordToDom( create( node, range ) );

		expect( body.innerHTML ).toEqual( node.innerHTML );
		expect( selection ).toEqual( {
			startPath: [ 1 ],
			endPath: [ 1 ],
		} );
	} );

	it( 'should extract recreate HTML 4', () => {
		const HTML = '<em>two 🍒</em>';
		const node = createNode( `<p>${ HTML }</p>` );
		const range = {
			startOffset: 1,
			startContainer: node.querySelector( 'em' ).firstChild,
			endOffset: 2,
			endContainer: node.querySelector( 'em' ).firstChild,
		};
		const { body, selection } = recordToDom( create( node, range ) );

		expect( body.innerHTML ).toEqual( node.innerHTML );
		expect( selection ).toEqual( {
			startPath: [ 0, 0, 1 ],
			endPath: [ 0, 0, 2 ],
		} );
	} );

	it( 'should extract recreate HTML 5', () => {
		const HTML = '<em>If you want to learn more about how to build additional blocks, or if you are interested in helping with the project, head over to the <a href="https://github.com/WordPress/gutenberg">GitHub repository</a>.</em>';
		const node = createNode( `<p>${ HTML }</p>` );
		const range = {
			startOffset: 1,
			startContainer: node.querySelector( 'em' ).firstChild,
			endOffset: 0,
			endContainer: node.querySelector( 'a' ).firstChild,
		};
		const { body, selection } = recordToDom( create( node, range ) );

		expect( body.innerHTML ).toEqual( node.innerHTML );
		expect( selection ).toEqual( {
			startPath: [ 0, 0, 1 ],
			endPath: [ 0, 1, 0, 0 ],
		} );
	} );

	it( 'should extract recreate HTML 6', () => {
		const HTML = '<li>one<ul><li>two</li></ul></li><li>three</li>';
		const node = createNode( `<ul>${ HTML }</ul>` );
		const range = {
			startOffset: 1,
			startContainer: node.querySelector( 'li' ).firstChild,
			endOffset: 2,
			endContainer: node.querySelector( 'li' ).firstChild,
		};
		const { body, selection } = multilineRecordToDom( create( node, range, 'li' ), 'li' );

		expect( body.innerHTML ).toEqual( node.innerHTML );
		expect( selection ).toEqual( {
			startPath: [ 0, 0, 1 ],
			endPath: [ 0, 0, 2 ],
		} );
	} );
} );
