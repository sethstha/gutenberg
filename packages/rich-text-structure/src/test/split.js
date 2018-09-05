/**
 * Internal dependencies
 */

import { split } from '../split';

describe( 'split', () => {
	const em = { type: 'em' };

	it( 'should split', () => {
		const record = {
			formats: [ , , , , [ em ], [ em ], [ em ], , , , , , , ],
			text: 'one two three',
		};

		const expected = [
			{
				formats: [ , , , , [ em ], [ em ] ],
				text: 'one tw',
			},
			{
				formats: [ [ em ], , , , , , , ],
				text: 'o three',
			},
		];

		expect( split( record, 6, 6 ) ).toEqual( expected );
	} );

	it( 'should split with selection', () => {
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

		const expected = [
			{
				value: {
					formats: [ , , , , [ em ], [ em ] ],
					text: 'one tw',
				},
				selection: {},
			},
			{
				value: {
					formats: [ [ em ], , , , , , , ],
					text: 'o three',
				},
				selection: {
					start: 0,
					end: 0,
				},
			},
		];

		expect( split( record ) ).toEqual( expected );
	} );

	it( 'should split empty', () => {
		const record = {
			formats: [],
			text: '',
		};

		const expected = [
			record,
			record,
		];

		expect( split( record, 6, 6 ) ).toEqual( expected );
	} );

	it( 'should split search', () => {
		const record = {
			formats: [ , , , , [ em ], [ em ], [ em ], , , , , , , ],
			text: 'one two three',
		};

		const expected = [
			{
				formats: [ , , , ],
				text: 'one',
			},
			{
				formats: [ [ em ], [ em ], [ em ] ],
				text: 'two',
			},
			{
				formats: [ , , , , , ],
				text: 'three',
			},
		];

		expect( split( record, ' ' ) ).toEqual( expected );
	} );
} );
