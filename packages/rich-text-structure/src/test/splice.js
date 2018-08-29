/**
 * Internal dependencies
 */

import { splice } from '../splice';

describe( 'splice', () => {
	it( 'should delete and insert', () => {
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

		const expected = {
			value: {
				formats: [
					undefined,
					undefined,
					[ { type: 'strong' } ],
					[ { type: 'em' } ],
					undefined,
					undefined,
					undefined,
					undefined,
					undefined,
					undefined,
				],
				text: 'onao three',
			},
			selection: {
				start: 3,
				end: 3,
			},
		};

		expect( splice( record, 2, 4, 'a', [ [ { type: 'strong' } ] ] ) ).toEqual( expected );
	} );

	it( 'should insert line break with selection', () => {
		const record = {
			value: {
				formats: [
					undefined,
					undefined,
				],
				text: 'tt',
			},
			selection: {
				start: 1,
				end: 1,
			},
		};

		const expected = {
			value: {
				formats: [
					undefined,
					undefined,
					undefined,
				],
				text: 't\nt',
			},
			selection: {
				start: 2,
				end: 2,
			},
		};

		expect( splice( record, undefined, 0, '\n' ) ).toEqual( expected );
	} );

	// it( 'should delete and insert multiline', () => {
	// 	const record = {
	// 		value: [
	// 			{
	// 				formats: [
	// 					undefined,
	// 					undefined,
	// 					undefined,
	// 					undefined,
	// 					[ { type: 'em' } ],
	// 					[ { type: 'em' } ],
	// 					[ { type: 'em' } ],
	// 					undefined,
	// 					undefined,
	// 					undefined,
	// 					undefined,
	// 					undefined,
	// 					undefined,
	// 				],
	// 				text: 'one two three',
	// 			}
	// 		],
	// 		selection: {
	// 			start: [ 0, 6 ],
	// 			end: [ 0, 6 ],
	// 		},
	// 	};

	// 	const expected = {
	// 		value: [
	// 			{
	// 				formats: [
	// 					undefined,
	// 					undefined,
	// 					[ { type: 'strong' } ],
	// 					[ { type: 'em' } ],
	// 					undefined,
	// 					undefined,
	// 					undefined,
	// 					undefined,
	// 					undefined,
	// 					undefined,
	// 				],
	// 				text: 'onao three',
	// 			}
	// 		],
	// 		selection: {
	// 			start: [ 0, 3 ],
	// 			end: [ 0, 3 ],
	// 		},
	// 	};

	// 	expect( splice( record, [ 0, 2 ], [ 0, 4 ], 'a', [ [ { type: 'strong' } ] ] ) ).toEqual( expected );
	// } );
} );
