/**
 * Internal dependencies
 */

import { matchXPath } from '../xpath';

// eslint-disable-next-line no-console
console.log.mockRestore();

describe( 'matchXPath', () => {
	it( 'should match a plain structure', () => {
		const plainRecord = {
			formats: [
				[],
				[],
				[],
				[],
			],
			text: 'Text',
		};
		const xpath = 'text()[1]';
		const expected = 0;

		const actual = matchXPath( plainRecord, xpath );

		expect( actual ).toEqual( expected );
	} );

	it( 'should match the first text node', () => {
		const record = {
			formats: [
				[ { type: 'strong' } ],
				[],
				[],
				[],
			],
			text: 'Text',
		};

		// There will be an empty text node before the strong:
		expect( matchXPath( record, 'text()[1]' ) ).toEqual( 0 );
		expect( matchXPath( record, 'text()[2]' ) ).toEqual( 1 );
	} );

	it( 'should match deeper trees', () => {
		const record = {
			formats: [
				[],
				[ { type: 'strong' } ],
				[ { type: 'strong' }, { type: 'em' } ],
				[ { type: 'strong' }, { type: 'em' }, { type: 's' } ],
				[ { type: 'strong' }, { type: 'em' } ],
				[ { type: 'strong' } ],
				[],
			],
			text: 'Textual',
		};

		expect( matchXPath( record, 'text()[1]' ) ).toEqual( 0 );
		expect( matchXPath( record, 'strong[1]/text()[1]' ) ).toEqual( 1 );
		expect( matchXPath( record, 'strong[1]/em[1]/text()[1]' ) ).toEqual( 2 );
		expect( matchXPath( record, 'strong[1]/em[1]/s[1]/text()[1]' ) ).toEqual( 3 );
		expect( matchXPath( record, 'strong[1]/em[1]/text()[2]' ) ).toEqual( 4 );
		expect( matchXPath( record, 'strong[1]/text()[2]' ) ).toEqual( 5 );
		expect( matchXPath( record, 'text()[2]' ) ).toEqual( 6 );
	} );
} );
