import type { NodeParams, GroupParams } from '../../stores/nodeStore';

interface GroupedParam {
    display: 'group' | 'collapse';
    label: string | null;
    hidden: boolean;
    disabled: boolean;
    open: boolean;
    direction: 'row' | 'column';
    params: Record<string, NodeParams>;
}

const createGroupConfig = (group: GroupParams): GroupParams => {
    if (typeof group === 'string') {
        return { key: `${group}_group`, display: 'group' };
    }
    
    return {
        key: `${group.key || 'untitled'}_group`,
        display: group.display || 'group',
        label: group.label || null,
        hidden: group.hidden || false,
        disabled: group.disabled || false,
        open: group.open || false,
        direction: group.direction || 'row',
    };
};

const createGroupedParam = (config: GroupParams): GroupedParam => ({
    display: config.display || 'group',
    label: config.label || null,
    hidden: config.hidden || false,
    disabled: config.disabled || false,
    open: config.open || false,
    direction: config.direction || 'row',
    params: {},
});

/*
    Group fields by data.params.group.

    Convert group from:
    'seed': { ... }, 'width': { ... group: 'dimensions' }, 'height': { ... group: 'dimensions' }

    To:
    'seed': { ... }, 'dimensions_group': { ... , 'params': { 'width': { ... }, 'height': { ... } } }

    This complication is to keep all fields on the same level and avoid nested objects
*/
export const groupParams = (params: Record<string, NodeParams>): Record<string, NodeParams | GroupedParam> => {
    return Object.entries(params).reduce<Record<string, NodeParams | GroupedParam>>(
        (acc, [key, data]) => {
            if (!data.group) {
                acc[key] = data;
                return acc;
            }

            const groupConfig = createGroupConfig(data.group);

            if (!acc[groupConfig.key]) {
                acc[groupConfig.key] = createGroupedParam(groupConfig);
            }
            
            (acc[groupConfig.key] as GroupedParam).params[key] = data;
            return acc;
        }, 
        {}
    );
};

export type { GroupParams };
