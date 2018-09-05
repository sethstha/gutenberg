/**
 * Internal dependencies
 */

import { removeFormat } from '../remove-format';

describe( 'removeFormat', () => {
	it( 'should remove format', () => {
		const record = {
			formats: [
				undefined,
				undefined,
				undefined,
				[ { type: 'strong' } ],
				[ { type: 'em' }, { type: 'strong' } ],
				[ { type: 'em' }, { type: 'strong' } ],
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

		const expected = {
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

		expect( removeFormat( record, 'strong', 3, 6 ) ).toEqual( expected );
	} );

	it( 'should remove format for multiline', () => {
		const record = {
			value: [
				{
					formats: [
						undefined,
						undefined,
						[ { type: 'em' } ],
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
						[ { type: 'em' } ],
						undefined,
						undefined,
						undefined,
						undefined,
					],
					text: 'three',
				},
				{
					formats: [
						undefined,
						undefined,
						undefined,
						undefined,
					],
					text: 'four',
				},
			],
			selection: {
				start: [ 0, 2 ],
				end: [ 2, 1 ],
			},
		};

		const expected = {
			value: [
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
						undefined,
						undefined,
						undefined,
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
				{
					formats: [
						undefined,
						undefined,
						undefined,
						undefined,
					],
					text: 'four',
				},
			],
			selection: {
				start: [ 0, 2 ],
				end: [ 2, 1 ],
			},
		};

		expect( removeFormat( record, 'em' ) ).toEqual( expected );
	} );

	it( 'should remove format for collased selection', () => {
		const record = {
			formats: [
				undefined,
				undefined,
				undefined,
				[ { type: 'strong' } ],
				[ { type: 'em' }, { type: 'strong' } ],
				[ { type: 'em' }, { type: 'strong' } ],
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

		const expected = {
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

		expect( removeFormat( record, 'strong', 4, 4 ) ).toEqual( expected );
	} );
} );
