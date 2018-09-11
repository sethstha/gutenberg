/**
 * Internal dependencies
 */

import { applyFormat } from '../apply-format';

describe( 'applyFormat', () => {
	const strong = { type: 'strong' };
	const em = { type: 'em' };

	it( 'should apply format', () => {
		const record = {
			formats: [ , , , , [ em ], [ em ], [ em ], , , , , , , ],
			text: 'one two three',
		};

		const expected = {
			formats: [ , , , [ strong ], [ em, strong ], [ em, strong ], [ em ], , , , , , , ],
			text: 'one two three',
		};

		expect( applyFormat( record, strong, 3, 6 ) ).toEqual( expected );
	} );

	it( 'should apply format by selection', () => {
		const record = {
			value: {
				formats: [ , , , , [ em ], [ em ], [ em ], , , , , , , ],
				text: 'one two three',
			},
			selection: {
				start: 3,
				end: 6,
			},
		};

		const expected = {
			value: {
				formats: [ , , , [ strong ], [ em, strong ], [ em, strong ], [ em ], , , , , , , ],
				text: 'one two three',
			},
			selection: {
				start: 3,
				end: 6,
			},
		};

		expect( applyFormat( record, strong ) ).toEqual( expected );
	} );
} );
