export const formatEventFileds = (object) => {
    const keys = Object.keys(object);
    const result = [];
    keys.forEach((key) => {
        const field = object[key];
        if (field.title.startsWith('UF_CRM') && !field.filterLabel.startsWith('.')) {
            result.push({
                FIELD_NAME:key,
                USER_TYPE_ID:field.type,
                MULTIPLE:field.isMultiple ? 'Y' : 'N',
                LIST:field.items,
                title:field.filterLabel,
                MANDATORY:field.isRequired ? 'Y' : 'N'
            });
        }
    })
    return result;
}