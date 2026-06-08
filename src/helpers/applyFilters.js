export const applyFilters = (
    resources,
    properties,
    formData
) => {
    if (!formData || Object.keys(formData).length === 0) {
        return resources;
    }

    return resources.filter(resource => {
        return Object.keys(formData).every(fieldKey => {
            const field = properties[fieldKey];

            if (!field) return true;

            const filterValue = formData[fieldKey];

            if (
                filterValue == null ||
                filterValue === '' ||
                (Array.isArray(filterValue) && filterValue.length === 0)
            ) {
                return true;
            }

            const dealValue = resource[
                fieldKey
                    .replace(/([a-z])([A-Z])/g, '$1_$2')
                    .toUpperCase()
                ];

            switch (field.type) {
                case 'boolean':
                    return Boolean(dealValue) === Boolean(filterValue);

                case 'enumeration':
                    if (field.isMultiple) {
                        if (!Array.isArray(dealValue)) return false;

                        return filterValue.every(val =>
                            dealValue.includes(val.ID || val)
                        );
                    }

                    return (
                        +dealValue === +filterValue?.ID ||
                        dealValue === filterValue
                    );

                case 'string':
                case 'address':
                case 'crm_company':
                case 'crm_contact':
                case 'user':
                    return String(dealValue || '')
                        .toLowerCase()
                        .includes(String(filterValue).toLowerCase());

                case 'double':
                case 'money':
                    if (
                        fieldKey === 'opportunity' &&
                        typeof filterValue === 'object'
                    ) {
                        const from = parseFloat(filterValue.from);
                        const to = parseFloat(filterValue.to);
                        const value = parseFloat(dealValue);

                        if (isNaN(value)) return false;
                        if (!isNaN(from) && value < from) return false;
                        if (!isNaN(to) && value > to) return false;

                        return true;
                    }

                    return (
                        parseFloat(dealValue) ===
                        parseFloat(filterValue)
                    );

                case 'integer':
                    return (
                        parseInt(dealValue) ===
                        parseInt(filterValue)
                    );

                default:
                    return true;
            }
        });
    });
};
