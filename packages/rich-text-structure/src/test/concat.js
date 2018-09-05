/**
 * Internal dependencies
 */

import { concat } from '../concat';

describe( 'concat', () => {
	const em = { type: 'em' };

	it( 'should merge records', () => {
		const one = {
			formats: [ , , [ em ] ],
			text: 'one',
		};
		const two = {
			formats: [ [ em ], , , ],
			text: 'two',
		};
		const three = {
			formats: [ , , [ em ], [ em ], , , ],
			text: 'onetwo',
		};

		const merged = concat( one, two );

		expect( merged ).not.toBe( one );
		expect( merged ).toEqual( three );
	} );

	it( 'should merge multiline records', () => {
		const one = [ {
			formats: [ , , [ em ] ],
			text: 'one',
		} ];
		const two = [ {
			formats: [ , , [ em ] ],
			text: 'two',
		} ];

		const merged = concat( one, two );

		expect( merged ).not.toBe( one );
		expect( merged ).toEqual( [ ...one, ...two ] );
	} );
} );
