/**
 * Internal dependencies
 */

import { getActiveFormat } from '../get-active-format';

describe( 'getActiveFormat', () => {
	it( 'should get format by selection', () => {
		const record = {
			value: {
				formats: [
					[ { type: 'em' } ],
					undefined,
					undefined,
				],
				text: 'one',
			},
			selection: {
				start: 0,
				end: 0,
			},
		};

		const expected = { type: 'em' };

		expect( getActiveFormat( record, 'em' ) ).toEqual( expected );
	} );

	it( 'should get format by selection using the start', () => {
		const record = {
			value: {
				formats: [
					[ { type: 'em' } ],
					undefined,
					[ { type: 'em' } ],
				],
				text: 'one',
			},
			selection: {
				start: 1,
				end: 1,
			},
		};

		expect( getActiveFormat( record, 'em' ) ).toBe( undefined );
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
