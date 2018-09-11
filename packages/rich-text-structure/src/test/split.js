/**
 * Internal dependencies
 */

import { split } from '../split';

describe( 'split', () => {
	const em = { type: 'em' };

	it( 'should split', () => {
		const record = {
			selection: {
				start: 5,
				end: 10,
			},
			value: {
				formats: [ , , , , [ em ], [ em ], [ em ], , , , , , , ],
				text: 'one two three',
			},
		};

		const expected = [
			{
				selection: {},
				value: {
					formats: [ , , , , [ em ], [ em ] ],
					text: 'one tw',
				},
			},
			{
				selection: {
					start: 0,
					end: 0,
				},
				value: {
					formats: [ [ em ], , , , , , , ],
					text: 'o three',
				},
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
			selection: {
				start: 6,
				end: 16,
			},
			value: {
				formats: [ , , , , [ em ], [ em ], [ em ], , , , , , , , , , , , , , , , , ],
				text: 'one two three four five',
			},
		};

		const expected = [
			{
				selection: {},
				value: {
					formats: [ , , , ],
					text: 'one',
				},
			},
			{
				selection: {
					start: 2,
					end: 3,
				},
				value: {
					formats: [ [ em ], [ em ], [ em ] ],
					text: 'two',
				},
			},
			{
				selection: {
					start: 0,
					end: 5,
				},
				value: {
					formats: [ , , , , , ],
					text: 'three',
				},
			},
			{
				selection: {
					start: 0,
					end: 2,
				},
				value: {
					formats: [ , , , , ],
					text: 'four',
				},
			},
			{
				selection: {},
				value: {
					formats: [ , , , , ],
					text: 'five',
				},
			},
		];

		expect( split( record, ' ' ) ).toEqual( expected );
	} );

	it( 'should split search 2', () => {
		const record = {
			selection: {
				start: 5,
				end: 6,
			},
			value: {
				formats: [ , , , , [ em ], [ em ], [ em ], , , , , , , ],
				text: 'one two three',
			},
		};

		const expected = [
			{
				selection: {},
				value: {
					formats: [ , , , ],
					text: 'one',
				},
			},
			{
				selection: {
					start: 1,
					end: 2,
				},
				value: {
					formats: [ [ em ], [ em ], [ em ] ],
					text: 'two',
				},
			},
			{
				selection: {},
				value: {
					formats: [ , , , , , ],
					text: 'three',
				},
			},
		];

		expect( split( record, ' ' ) ).toEqual( expected );
	} );
} );
