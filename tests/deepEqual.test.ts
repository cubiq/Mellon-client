import { deepEqual } from './deepEqual';

describe('deepEqual', () => {
    test('handles primitive values', () => {
        expect(deepEqual(1, 1)).toBe(true);
        expect(deepEqual('test', 'test')).toBe(true);
        expect(deepEqual(true, true)).toBe(true);
        expect(deepEqual(1, 2)).toBe(false);
        expect(deepEqual('test', 'different')).toBe(false);
    });

    test('handles null and undefined', () => {
        expect(deepEqual(null, null)).toBe(true);
        expect(deepEqual(undefined, undefined)).toBe(true);
        expect(deepEqual(null, undefined)).toBe(false);
        expect(deepEqual({}, null)).toBe(false);
    });

    test('compares simple objects', () => {
        expect(deepEqual({a: 1}, {a: 1})).toBe(true);
        expect(deepEqual({a: 1}, {a: 2})).toBe(false);
        expect(deepEqual({a: 1}, {b: 1})).toBe(false);
        expect(deepEqual({a: 1, b: 2}, {a: 1, b: 2})).toBe(true);
    });

    test('compares nested objects', () => {
        expect(deepEqual(
            {a: {b: 1}},
            {a: {b: 1}}
        )).toBe(true);
        expect(deepEqual(
            {a: {b: 1}},
            {a: {b: 2}}
        )).toBe(false);
    });

    test('compares arrays', () => {
        expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
        expect(deepEqual([1, 2, 3], [3, 2, 1])).toBe(false);
        expect(deepEqual([1, {a: 2}], [1, {a: 2}])).toBe(true);
    });
});