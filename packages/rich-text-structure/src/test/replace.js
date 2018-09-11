/**
 * Internal dependencies
 */

import { replace } from '../replace';

describe( 'replace', () => {
	const em = { type: 'em' };

	it( 'should replace string to string', () => {
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

		const expected = {
			value: {
				formats: [ , , , , [ em ], , , , , , , ],
				text: 'one 2 three',
			},
			selection: {},
		};

		expect( replace( record, 'two', '2' ) ).toEqual( expected );
	} );

	it( 'should replace string to record', () => {
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

		const replacement = {
			formats: [ , ],
			text: '2',
		};

		const expected = {
			value: {
				formats: [ , , , , , , , , , , , ],
				text: 'one 2 three',
			},
			selection: {},
		};

		expect( replace( record, 'two', replacement ) ).toEqual( expected );
	} );

	it( 'should replace string to function', () => {
		const record = {
			value: {
				formats: [ , , , , , , , , , , , , ],
				text: 'abc12345#$*%',
			},
			selection: {
				start: 6,
				end: 6,
			},
		};

		const expected = {
			value: {
				formats: [ , , , , , , , , , , , , , , , , , , ],
				text: 'abc - 12345 - #$*%',
			},
			selection: {},
		};

		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace
		const result = replace( record, /([^\d]*)(\d*)([^\w]*)/, ( match, p1, p2, p3 ) => {
			return [ p1, p2, p3 ].join( ' - ' );
		} );

		expect( result ).toEqual( expected );
	} );
} );
