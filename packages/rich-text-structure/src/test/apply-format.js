/**
 * Internal dependencies
 */

import { applyFormat } from '../apply-format';

describe( 'applyFormat', () => {
	it( 'should apply format', () => {
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

		const expected = {
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

		expect( applyFormat( record, { type: 'strong' }, 3, 6 ) ).toEqual( expected );
	} );

	it( 'should apply format by selection', () => {
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
				start: 3,
				end: 6,
			},
		};

		const expected = {
			value: {
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
			},
			selection: {
				start: 3,
				end: 6,
			},
		};

		expect( applyFormat( record, { type: 'strong' } ) ).toEqual( expected );
	} );

	it( 'should apply format for multiline', () => {
		const record = {
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

		const expected = {
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

		expect( applyFormat( record, { type: 'em' } ) ).toEqual( expected );
	} );
} );
