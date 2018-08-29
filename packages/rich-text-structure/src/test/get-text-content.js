/**
 * Internal dependencies
 */

import { getTextContent } from '../get-text-content';

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
