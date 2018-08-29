/**
 * Internal dependencies
 */

import { isEmpty } from '../is-empty';

describe( 'isEmpty', () => {
	const emptyRecord = {
		formats: [],
		text: '',
	};

	it( 'should return true', () => {
		const one = emptyRecord;
		const two = [ emptyRecord ];
		const three = [];

		expect( isEmpty( one ) ).toBe( true );
		expect( isEmpty( two ) ).toBe( true );
		expect( isEmpty( three ) ).toBe( true );
	} );

	it( 'should return false', () => {
		const one = {
			formats: [],
			text: 'test',
		};
		const two = {
			formats: [
				[ { type: 'image' } ],
			],
			text: '',
		};
		const three = [ emptyRecord, one ];
		const four = [ one ];

		expect( isEmpty( one ) ).toBe( false );
		expect( isEmpty( two ) ).toBe( false );
		expect( isEmpty( three ) ).toBe( false );
		expect( isEmpty( four ) ).toBe( false );
	} );
} );
