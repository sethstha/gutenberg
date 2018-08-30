/**
 * Internal dependencies
 */

import { split } from '../split';

describe( 'split', () => {
	it( 'should split', () => {
		const record = {
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
		};

		const expected = [
			{
				formats: [
					undefined,
					undefined,
					undefined,
					undefined,
					[ { type: 'em' } ],
					[ { type: 'em' } ],
				],
				text: 'one tw',
			},
			{
				formats: [
					[ { type: 'em' } ],
					undefined,
					undefined,
					undefined,
					undefined,
					undefined,
					undefined,
				],
				text: 'o three',
			},
		];

		expect( split( record, 6, 6 ) ).toEqual( expected );
	} );

	it( 'should split with selection', () => {
		const record = {
			value: {
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
			},
			selection: {
				start: 6,
				end: 6,
			},
		};

		const expected = [
			{
				value: {
					formats: [
						undefined,
						undefined,
						undefined,
						undefined,
						[ { type: 'em' } ],
						[ { type: 'em' } ],
					],
					text: 'one tw',
				},
				selection: {},
			},
			{
				value: {
					formats: [
						[ { type: 'em' } ],
						undefined,
						undefined,
						undefined,
						undefined,
						undefined,
						undefined,
					],
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
} );

describe( 'splitSearch', () => {
	it( 'should split search', () => {
		const record = {
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
		};

		const expected = [
			{
				formats: [
					undefined,
					undefined,
					undefined,
				],
				text: 'one',
			},
			{
				formats: [
					[ { type: 'em' } ],
					[ { type: 'em' } ],
					[ { type: 'em' } ],
				],
				text: 'two',
			},
			{
				formats: [
					undefined,
					undefined,
					undefined,
					undefined,
					undefined,
				],
				text: 'three',
			},
		];

		expect( split( record, ' ' ) ).toEqual( expected );
	} );
} );
