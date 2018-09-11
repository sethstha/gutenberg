/**
 * Internal dependencies
 */

import { insert } from '../insert';

describe( 'insert', () => {
	const em = { type: 'em' };
	const strong = { type: 'strong' };

	it( 'should delete and insert', () => {
		const record = {
			value: {
				formats: [ , , , , [ em ], [ em ], [ em ], , , , , , , ],
				text: 'one two three',
			},
			selection: {
				start: 6,
				end: 6,
			},
		};

		const toInsert = {
			value: {
				formats: [ [ strong ] ],
				text: 'a',
			},
			selection: {},
		};

		const expected = {
			value: {
				formats: [ , , [ strong ], [ em ], , , , , , , ],
				text: 'onao three',
			},
			selection: {
				start: 3,
				end: 3,
			},
		};

		expect( insert( record, toInsert, 2, 6 ) ).toEqual( expected );
	} );

	it( 'should insert line break with selection', () => {
		const record = {
			value: {
				formats: [ , , ],
				text: 'tt',
			},
			selection: {
				start: 1,
				end: 1,
			},
		};

		const toInsert = {
			value: {
				formats: [ , ],
				text: '\n',
			},
			selection: {},
		};

		const expected = {
			value: {
				formats: [ , , , ],
				text: 't\nt',
			},
			selection: {
				start: 2,
				end: 2,
			},
		};

		expect( insert( record, toInsert ) ).toEqual( expected );
	} );
} );
