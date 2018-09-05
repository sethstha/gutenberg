/**
 * Internal dependencies
 */

import { getActiveFormat } from '../get-active-format';

describe( 'getActiveFormat', () => {
	const em = { type: 'em' };

	it( 'should get format by selection', () => {
		const record = {
			value: {
				formats: [ [ em ], , , ],
				text: 'one',
			},
			selection: {
				start: 0,
				end: 0,
			},
		};

		expect( getActiveFormat( record, 'em' ) ).toEqual( em );
	} );

	it( 'should get format by selection using the start', () => {
		const record = {
			value: {
				formats: [ [ em ], , [ em ] ],
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
				formats: [ , , , , [ em ], [ em ], [ em ], , , , , , , ],
				text: 'one two three',
			} ],
			selection: {
				start: [ 0, 4 ],
				end: [ 0, 4 ],
			},
		};

		expect( getActiveFormat( record, 'em' ) ).toEqual( em );
	} );
} );
