import { deepEqual } from 'assert';
import { JSDOM } from 'jsdom';

const { window } = new JSDOM();
const { document } = window;

import {
	create,
	createWithSelection,
	toString,
	concat,
	isEmpty,
	splice,
	applyFormat,
	removeFormat,
	split,
	getActiveFormat,
	getTextContent,
} from '../';

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

describe( 'toString', () => {
	it( 'should extract recreate HTML 1', () => {
		const HTML = 'one <em>two 🍒</em> <a href="#"><img src=""><strong>three</strong></a><img src="">';

		deepEqual( toString( create( createNode( `<p>${ HTML }</p>` ) ) ), HTML );
	} );

	it( 'should extract recreate HTML 2', () => {
		const HTML = 'one <em>two 🍒</em> <a href="#">test <img src=""><strong>three</strong></a><img src="">';

		deepEqual( toString( create( createNode( `<p>${ HTML }</p>` ) ) ), HTML );
	} );

	it( 'should extract recreate HTML 3', () => {
		const HTML = '<img src="">';

		deepEqual( toString( create( createNode( `<p>${ HTML }</p>` ) ) ), HTML );
	} );

	it( 'should extract recreate HTML 4', () => {
		const HTML = '<img src="">';

		deepEqual( toString( create( createNode( `<p>${ HTML }</p>` ) ) ), HTML );
	} );

	it( 'should extract recreate HTML 5', () => {
		const HTML = '<em>two 🍒</em>';

		deepEqual( toString( create( createNode( `<p>${ HTML }</p>` ) ) ), HTML );
	} );

	it( 'should extract recreate HTML 6', () => {
		const HTML = '<em>If you want to learn more about how to build additional blocks, or if you are interested in helping with the project, head over to the <a href="https://github.com/WordPress/gutenberg">GitHub repository</a>.</em>';

		deepEqual( toString( create( createNode( `<p>${ HTML }</p>` ) ) ), HTML );
	} );

	it( 'should extract recreate HTML 7', () => {
		const HTML = '<li>one<ul><li>two</li></ul></li><li>three</li>';

		deepEqual( toString( create( createNode( `<ul>${ HTML }</ul>` ), 'li' ), 'li' ), HTML );
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

describe( 'concat', () => {
	it( 'should merge records', () => {
		const one = {
			formats: [
				undefined,
				undefined,
				[ { type: 'em' } ],
			],
			text: 'one',
		};
		const two = {
			formats: [
				[ { type: 'em' } ],
				undefined,
				undefined,
			],
			text: 'two',
		};
		const three = {
			formats: [
				undefined,
				undefined,
				[ { type: 'em' } ],
				[ { type: 'em' } ],
				undefined,
				undefined,
			],
			text: 'onetwo',
		};

		const merged = concat( one, two );

		expect( merged ).not.toBe( one );
		expect( merged ).toEqual( three );
	} );

	it( 'should merge multiline records', () => {
		const one = [ {
			formats: [
				undefined,
				undefined,
				[ { type: 'em' } ],
			],
			text: 'one',
		} ];
		const two = [ {
			formats: [
				undefined,
				undefined,
				[ { type: 'em' } ],
			],
			text: 'two',
		} ];

		const merged = concat( one, two );

		expect( merged ).not.toBe( one );
		expect( merged ).toEqual( [ ...one, ...two ] );
	} );
} );

describe( 'isEmpty', () => {
	const emptyRecord = {
		formats: [],
		text: '',
	};

	it( 'should return true', () => {
		const one = emptyRecord;
		const two = [ emptyRecord ];
		const three = [];

		expect( isEmpty( one ) ).toBe( true );
		expect( isEmpty( two ) ).toBe( true );
		expect( isEmpty( three ) ).toBe( true );
	} );

	it( 'should return false', () => {
		const one = {
			formats: [],
			text: 'test',
		};
		const two = {
			formats: [
				[ { type: 'image' } ],
			],
			text: '',
		};
		const three = [ emptyRecord, one ];
		const four = [ one ];

		expect( isEmpty( one ) ).toBe( false );
		expect( isEmpty( two ) ).toBe( false );
		expect( isEmpty( three ) ).toBe( false );
		expect( isEmpty( four ) ).toBe( false );
	} );
} );

describe( 'splice', () => {
	it( 'should delete and insert', () => {
		const record = {
			value: {
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
			selection: {
				start: 6,
				end: 6,
			},
		};

		const expected = {
			value: {
				formats: [
					undefined,
					undefined,
					[ { type: 'strong' } ],
					[ { type: 'em' } ],
					undefined,
					undefined,
					undefined,
					undefined,
					undefined,
					undefined,
				],
				text: 'onao three',
			},
			selection: {
				start: 3,
				end: 3,
			},
		};

		expect( splice( record, 2, 4, 'a', [ [ { type: 'strong' } ] ] ) ).toEqual( expected );
	} );

	it( 'should insert line break with selection', () => {
		const record = {
			value: {
				formats: [
					undefined,
					undefined,
				],
				text: 'tt',
			},
			selection: {
				start: 1,
				end: 1,
			},
		};

		const expected = {
			value: {
				formats: [
					undefined,
					undefined,
					undefined,
				],
				text: 't\nt',
			},
			selection: {
				start: 2,
				end: 2,
			},
		};

		expect( splice( record, undefined, 0, '\n' ) ).toEqual( expected );
	} );

	// it( 'should delete and insert multiline', () => {
	// 	const record = {
	// 		value: [
	// 			{
	// 				formats: [
	// 					undefined,
	// 					undefined,
	// 					undefined,
	// 					undefined,
	// 					[ { type: 'em' } ],
	// 					[ { type: 'em' } ],
	// 					[ { type: 'em' } ],
	// 					undefined,
	// 					undefined,
	// 					undefined,
	// 					undefined,
	// 					undefined,
	// 					undefined,
	// 				],
	// 				text: 'one two three',
	// 			}
	// 		],
	// 		selection: {
	// 			start: [ 0, 6 ],
	// 			end: [ 0, 6 ],
	// 		},
	// 	};

	// 	const expected = {
	// 		value: [
	// 			{
	// 				formats: [
	// 					undefined,
	// 					undefined,
	// 					[ { type: 'strong' } ],
	// 					[ { type: 'em' } ],
	// 					undefined,
	// 					undefined,
	// 					undefined,
	// 					undefined,
	// 					undefined,
	// 					undefined,
	// 				],
	// 				text: 'onao three',
	// 			}
	// 		],
	// 		selection: {
	// 			start: [ 0, 3 ],
	// 			end: [ 0, 3 ],
	// 		},
	// 	};

	// 	expect( splice( record, [ 0, 2 ], [ 0, 4 ], 'a', [ [ { type: 'strong' } ] ] ) ).toEqual( expected );
	// } );
} );

describe( 'applyFormat', () => {
	it( 'should apply format', () => {
		const record = {
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
		};

		const expected = {
			formats: [
				undefined,
				undefined,
				undefined,
				[ { type: 'strong' } ],
				[ { type: 'em' }, { type: 'strong' } ],
				[ { type: 'em' }, { type: 'strong' } ],
				[ { type: 'em' } ],
				undefined,
				undefined,
				undefined,
				undefined,
				undefined,
				undefined,
			],
			text: 'one two three',
		};

		expect( applyFormat( record, { type: 'strong' }, 3, 6 ) ).toEqual( expected );
	} );

	it( 'should apply format by selection', () => {
		const record = {
			value: {
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
			selection: {
				start: 3,
				end: 6,
			},
		};

		const expected = {
			value: {
				formats: [
					undefined,
					undefined,
					undefined,
					[ { type: 'strong' } ],
					[ { type: 'em' }, { type: 'strong' } ],
					[ { type: 'em' }, { type: 'strong' } ],
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
			selection: {
				start: 3,
				end: 6,
			},
		};

		expect( applyFormat( record, { type: 'strong' } ) ).toEqual( expected );
	} );

	it( 'should apply format for multiline', () => {
		const record = {
			value: [
				{
					formats: [
						undefined,
						undefined,
						undefined,
					],
					text: 'one',
				},
				{
					formats: [
						undefined,
						undefined,
						undefined,
					],
					text: 'two',
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
				{
					formats: [
						undefined,
						undefined,
						undefined,
						undefined,
					],
					text: 'four',
				},
			],
			selection: {
				start: [ 0, 2 ],
				end: [ 2, 1 ],
			},
		};

		const expected = {
			value: [
				{
					formats: [
						undefined,
						undefined,
						[ { type: 'em' } ],
					],
					text: 'one',
				},
				{
					formats: [
						[ { type: 'em' } ],
						[ { type: 'em' } ],
						[ { type: 'em' } ],
					],
					text: 'two',
				},
				{
					formats: [
						[ { type: 'em' } ],
						undefined,
						undefined,
						undefined,
						undefined,
					],
					text: 'three',
				},
				{
					formats: [
						undefined,
						undefined,
						undefined,
						undefined,
					],
					text: 'four',
				},
			],
			selection: {
				start: [ 0, 2 ],
				end: [ 2, 1 ],
			},
		};

		expect( applyFormat( record, { type: 'em' } ) ).toEqual( expected );
	} );
} );

describe( 'removeFormat', () => {
	it( 'should remove format', () => {
		const record = {
			formats: [
				undefined,
				undefined,
				undefined,
				[ { type: 'strong' } ],
				[ { type: 'em' }, { type: 'strong' } ],
				[ { type: 'em' }, { type: 'strong' } ],
				[ { type: 'em' } ],
				undefined,
				undefined,
				undefined,
				undefined,
				undefined,
				undefined,
			],
			text: 'one two three',
		};

		const expected = {
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
		};

		expect( removeFormat( record, 'strong', 3, 6 ) ).toEqual( expected );
	} );

	it( 'should remove format for multiline', () => {
		const record = {
			value: [
				{
					formats: [
						undefined,
						undefined,
						[ { type: 'em' } ],
					],
					text: 'one',
				},
				{
					formats: [
						[ { type: 'em' } ],
						[ { type: 'em' } ],
						[ { type: 'em' } ],
					],
					text: 'two',
				},
				{
					formats: [
						[ { type: 'em' } ],
						undefined,
						undefined,
						undefined,
						undefined,
					],
					text: 'three',
				},
				{
					formats: [
						undefined,
						undefined,
						undefined,
						undefined,
					],
					text: 'four',
				},
			],
			selection: {
				start: [ 0, 2 ],
				end: [ 2, 1 ],
			},
		};

		const expected = {
			value: [
				{
					formats: [
						undefined,
						undefined,
						undefined,
					],
					text: 'one',
				},
				{
					formats: [
						undefined,
						undefined,
						undefined,
					],
					text: 'two',
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
				{
					formats: [
						undefined,
						undefined,
						undefined,
						undefined,
					],
					text: 'four',
				},
			],
			selection: {
				start: [ 0, 2 ],
				end: [ 2, 1 ],
			},
		};

		expect( removeFormat( record, 'em' ) ).toEqual( expected );
	} );
} );

describe( 'getActiveFormat', () => {
	it( 'should get format by selection', () => {
		const record = {
			value: {
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
			selection: {
				start: 4,
				end: 4,
			},
		};

		const expected = { type: 'em' };

		expect( getActiveFormat( record, 'em' ) ).toEqual( expected );
	} );

	it( 'should get format by selection for multiline', () => {
		const record = {
			value: [ {
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
			} ],
			selection: {
				start: [ 0, 4 ],
				end: [ 0, 4 ],
			},
		};

		const expected = { type: 'em' };

		expect( getActiveFormat( record, 'em' ) ).toEqual( expected );
	} );
} );

describe( 'split', () => {
	it( 'should split', () => {
		const record = {
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
		};

		const expected = [
			{
				formats: [
					undefined,
					undefined,
					undefined,
					undefined,
					[ { type: 'em' } ],
					[ { type: 'em' } ],
				],
				text: 'one tw',
			},
			{
				formats: [
					[ { type: 'em' } ],
					undefined,
					undefined,
					undefined,
					undefined,
					undefined,
					undefined,
				],
				text: 'o three',
			},
		];

		expect( split( record, 6, 6 ) ).toEqual( expected );
	} );

	it( 'should split with selection', () => {
		const record = {
			value: {
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
			selection: {
				start: 6,
				end: 6,
			},
		};

		const expected = [
			{
				value: {
					formats: [
						undefined,
						undefined,
						undefined,
						undefined,
						[ { type: 'em' } ],
						[ { type: 'em' } ],
					],
					text: 'one tw',
				},
				selection: {},
			},
			{
				value: {
					formats: [
						[ { type: 'em' } ],
						undefined,
						undefined,
						undefined,
						undefined,
						undefined,
						undefined,
					],
					text: 'o three',
				},
				selection: {
					start: 0,
					end: 0,
				},
			},
		];

		expect( split( record ) ).toEqual( expected );
	} );

	it( 'should split empty', () => {
		const record = {
			formats: [],
			text: '',
		};

		const expected = [
			record,
			record,
		];

		expect( split( record, 6, 6 ) ).toEqual( expected );
	} );
} );

describe( 'getTextContent', () => {
	it( 'should get text content for multiline record', () => {
		const record = {
			value: [ {
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
			} ],
			selection: {
				start: [ 0, 4 ],
				end: [ 0, 4 ],
			},
		};

		const expected = 'one two three';

		expect( getTextContent( record ) ).toEqual( expected );
	} );
} );
