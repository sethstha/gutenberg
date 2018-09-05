/**
 * Internal dependencies
 */

import { getTextContent } from '../get-text-content';

describe( 'getTextContent', () => {
	const em = { type: 'em' };

	it( 'should get text content for multiline record', () => {
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

		const expected = 'one two three';

		expect( getTextContent( record ) ).toEqual( expected );
	} );
} );
