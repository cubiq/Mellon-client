import { groupParams } from '../src/components/utils/groupParams';

describe('groupParams', () => {
    it('should handle params without groups', () => {
        const params = {
            seed: { value: 123 }
        };
        expect(groupParams(params)).toEqual(params);
    });

    it('should group params with string group', () => {
        const params = {
            width: { value: 512, group: 'dimensions' },
            height: { value: 512, group: 'dimensions' }
        };
        
        const result = groupParams(params);
        expect(result).toHaveProperty('dimensions_group');
        expect(result.dimensions_group).toHaveProperty('params');
    });
});