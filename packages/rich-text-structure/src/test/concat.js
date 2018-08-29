/**
 * Internal dependencies
 */

import { concat } from '../concat';

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
