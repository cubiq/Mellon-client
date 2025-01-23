import { memo } from "react";
import { NodeParams } from "../stores/nodeStore";
import { deepEqual } from './utils/deepEqual';

// MUI
import { SxProps, Theme } from "@mui/material/styles";

// Custom fields
import AccordionField from "./fields/AccordionField";
import GroupField from "./fields/GroupField";
import HandleField from './fields/HandleField';
import TextField from './fields/TextField';
import ToggleField from "./fields/ToggleField";
import AutocompleteField from "./fields/AutocompleteField";
import SelectField from "./fields/SelectField";
import IconToggleField from "./fields/IconToggleField";
import NumberField from "./fields/NumberField";
import RangeField from "./fields/RangeField";
import TextareaField from "./fields/TextareaField";
import TagsField from "./fields/TagsField";
import CustomField from "./fields/CustomField";
import UIDropdownIcon from "./fields/UIDropdownIcon";
import UIImageField from "./fields/UIImageField";
import UIThreeField from "./fields/UIThreeField";


// These are the props sent to the fields
export type FieldProps = {
    fieldKey: string;
    label?: string;
    fieldType?: string;
    value?: any;
    options?: any;
    dataType?: string;
    style?: SxProps<Theme>;
    disabled?: boolean;
    hidden?: boolean;
    open?: boolean;
    no_validation?: boolean;
    icon?: 'random' | 'none';
    min?: number;
    max?: number;
    step?: number;
    source?: string;
    updateStore?: (param: string, value: any, key?: keyof NodeParams) => void;
    onChangeAction?: { action: string, target?: any };
}

export type GroupProps = {
    fieldKey: string;
    fields: Record<string, NodeParams>;
    updateStore: (param: string, value: any, key?: keyof NodeParams) => void;
    label?: string;
    open?: boolean;
    direction?: 'row' | 'column';
    disabled?: boolean;
    hidden?: boolean;
    style?: SxProps<Theme>;
}

type NodeContentProps = {
    fields: NodeParams;
    updateStore: (param: string, value: any, key?: keyof NodeParams, group?: string) => void;
    groups?: { [key: string]: { disabled?: boolean, hidden?: boolean, open?: boolean } };
    parentDisabled?: boolean; // avoid disabling fields when the parent group is already disabled
}

const NodeContent = (props: NodeContentProps) => {
    //const renderField = (key: string, data: any) => {
    return Object.entries(props.fields).map(([key, data]: [string, any]) => {
        const displayData = (data.display || '').toLowerCase();
        const disabled = props.parentDisabled ? false : data.disabled || false;
        const hidden = data.hidden || false;
        const sxStyle = data.style || {};
        const label = data.label || key;
        
        if (displayData === 'group') {
            const groupDisabled = data.disabled !== undefined ? data.disabled : props.groups?.[key]?.disabled ?? false;
            const groupHidden = data.hidden !== undefined ? data.hidden : props.groups?.[key]?.hidden ?? false;
            console.log('groupHidden', label, data.hidden, groupHidden);

            return (
                <GroupField
                    key={key}
                    fieldKey={key}
                    label={data.label}
                    direction={data.direction}
                    disabled={groupDisabled}
                    hidden={groupHidden}
                    style={sxStyle}
                    updateStore={props.updateStore}
                    fields={data.params}
                />
            )
        }
        
        if (displayData === 'collapse') {
            const open = props.groups?.[key]?.open || data.open || false;
            const groupDisabled = props.groups?.[key]?.disabled || data.disabled || false;
            const groupHidden = props.groups?.[key]?.hidden || data.hidden || false;
            return (
                <AccordionField
                    key={key}
                    fieldKey={key}
                    open={open}
                    label={data.label}
                    disabled={groupDisabled}
                    hidden={groupHidden}
                    style={sxStyle}
                    updateStore={props.updateStore}
                    fields={data.params}
                />
            )
        }

        // Data type can be an array, the array is mostly used for input handles to allow connection to multiple types
        // For node processing we only use the first type, that becomes the main type
        // TODO: should we use an "allowedTypes" property instead?
        const dataType = (Array.isArray(data.type) && data.type.length > 0 ? data.type[0] : data.type || 'string').toLowerCase();

        const fieldType = getFieldType(displayData, dataType, data);
        const fieldValue = data.value === undefined ? data.default || '' : data.value;
        const options = data.options || [];
        const no_validation = data.no_validation || false;
        const onChangeAction = typeof data.onChange === 'string' ? { action: data.onChange } : data.onChange || null;

        const fieldProps: FieldProps = {
            fieldKey: key,
            fieldType: fieldType,
            dataType: dataType,
            label: label,
            value: fieldValue,
            style: sxStyle,
            hidden: hidden,
            disabled: disabled,
            options: options,
            no_validation: no_validation,
            updateStore: props.updateStore,
            onChangeAction: onChangeAction,
            icon: data.icon,
            min: data.min,
            max: data.max,
            step: data.step,
            source: data.source,
        }

        return <FieldMemo key={key} {...fieldProps} />;
    });

    //return Object.entries(props.fields).map(([key, data]: [string, any]) => renderField(key, data));
};

const FieldMemo = memo((props: FieldProps) => {
    switch (props.fieldType) {
        case 'input':
        case 'output':
            return <HandleField {...props} />;
        case 'number':
        case 'slider':
            return <NumberField {...props} />;
        case 'checkbox':
        case 'switch':
            return <ToggleField {...props} />;
        case 'autocomplete':
            return <AutocompleteField {...props} />;
        case 'select':
            return <SelectField {...props} />;
        case 'textarea':
            return <TextareaField {...props} />;
        case 'icontoggle':
            return <IconToggleField {...props} />;
        case 'range':
            return <RangeField {...props} />;
        case 'tags':
            return <TagsField {...props} />;
        case 'custom':
            return <CustomField {...props} />;
        case 'ui_image':
            return <UIImageField {...props} />;
        case 'ui_dropdownicon':
            return <UIDropdownIcon {...props} />;
        case 'ui_3d': // TODO: NOT WORKING, need to find a better way to transmit data to a three.js viewer
            return <UIThreeField {...props} />;
        default:
            return <TextField {...props} />;
    }
}, (prevProps, nextProps) => {
    return (
        deepEqual(prevProps.value, nextProps.value) &&
        prevProps.disabled === nextProps.disabled &&
        prevProps.hidden === nextProps.hidden
    );
});

const getFieldType = (displayData: string, dataType: string, data: any) => {
    if (displayData === 'input' || displayData === 'output') {
        return displayData;
    }

    if (dataType === 'boolean') {
        return displayData === 'checkbox' || displayData === 'icontoggle' ? displayData : 'switch';
    }

    if (displayData === 'ui') {
        if (dataType === 'image') {
            return 'ui_image';
        } else if (dataType.toLowerCase() === 'dropdownicon') {
            return 'ui_dropdownicon';
        } else if (dataType.toLowerCase() === '3d') {
            return 'ui_3d';
        }
    }

    if (displayData) {
        return displayData;
    }

    if (data.options && typeof data.options === 'object') {
        return 'select';
    }

    if (dataType === 'int' || dataType === 'integer' || dataType === 'float' || dataType === 'number' ) {
        return displayData === 'slider' ? 'slider' : 'number';
    }

    return 'text';
};

export default NodeContent;