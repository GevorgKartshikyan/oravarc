export const formatEventFileds = (object) => {
    const result = [];

    Object.keys(object).forEach((key) => {
        const field = object[key];

        // берём только кастомные CRM поля
        if (!key.startsWith('ufCrm_') && !key.startsWith('UF_CRM_')) return;

        // защита от мусора
        if (!field || !field.filterLabel) return;

        // твоя логика фильтра
        if (field.filterLabel.startsWith('.')) return;

        result.push({
            FIELD_NAME: field.upperName || key,
            USER_TYPE_ID: field.type,
            MULTIPLE: field.isMultiple ? 'Y' : 'N',
            LIST: field.items || [],
            title: field.filterLabel,
            MANDATORY: field.isRequired ? 'Y' : 'N'
        });
    });

    return result;
};
