import React, { useState, useEffect } from 'react';
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import useWindowSize from "../hooks/useWindowSize.js";
import { MultiSelect } from "primereact/multiselect";
import { Dropdown } from "primereact/dropdown";
import { InputTextarea } from "primereact/inputtextarea";
import { InputText } from "primereact/inputtext";
import { Checkbox } from "primereact/checkbox";

function Filters({ visible, onHide, properties, resources, setResources, allResources }) {
    const [formData, setFormData] = useState(() => {
        const saved = localStorage.getItem('filters');
        return saved ? JSON.parse(saved) : {};
    });
    const { width } = useWindowSize();

    useEffect(() => {
        localStorage.setItem('filters', JSON.stringify(formData));
    }, [formData]);

    const handleChange = (fieldName, value) => {
        setFormData(prev => ({ ...prev, [fieldName]: value }));
    };

    const ufOnly = Object.fromEntries(
        Object.entries(properties).filter(([key]) =>
            key.toLowerCase().startsWith('uf') || key === 'title' || key === 'opportunity'
        )
    );

    const ufKeys = Object.keys(ufOnly);
    const handleApply = () => {
        if (!allResources) return;

        const filtered = allResources.filter(resource => {
            return ufKeys.every(ufKey => {
                const field = properties[ufKey];
                const filterValue = formData[ufKey];
                const dealValue = resource[ufKey];
                if (!field || filterValue == null || filterValue === '' || (Array.isArray(filterValue) && filterValue.length === 0)) {
                    return true;
                }
                const type = field.type;
                const isMultiple = field.isMultiple;

                switch (type) {
                    case 'boolean':
                        return Boolean(dealValue) === Boolean(filterValue);

                    case 'enumeration':
                        if (isMultiple) {
                            if (!Array.isArray(dealValue)) return false;
                            return filterValue.every(val => dealValue.includes(val.ID || val));
                        } else {
                            return (+dealValue === +filterValue?.ID || dealValue === filterValue);
                        }

                    case 'string':
                    case 'address':
                    case 'crm_company':
                    case 'crm_contact':
                    case 'user':
                        return String(dealValue || '').toLowerCase().includes(String(filterValue).toLowerCase());

                    case 'double':
                    case 'money':
                        if (ufKey === 'opportunity' && typeof filterValue === 'object') {
                            const from = parseFloat(filterValue.from);
                            const to = parseFloat(filterValue.to);
                            const value = parseFloat(dealValue);
                            if (isNaN(value)) return false;
                            if (!isNaN(from) && value < from) return false;
                            if (!isNaN(to) && value > to) return false;
                            return true;
                        }
                        return parseFloat(dealValue) === parseFloat(filterValue);

                    case 'integer':
                        return parseInt(dealValue) === parseInt(filterValue);

                    case 'datetime':
                        return String(dealValue).includes(String(filterValue));

                    default:
                        return true;
                }
            });
        });

        setResources(filtered);
        onHide();
    };


    const handleClear = () => {
        setFormData({});
        setResources(allResources);
        onHide();
        localStorage.removeItem('filters');
    };
    const renderField = ([fieldKey, field]) => {
        const {
            type,
            isMultiple,
            items,
            settings,
            title
        } = field;

        const value = formData[fieldKey];
        if (title.endsWith('-') || title.endsWith('- ')) {
            return null
        }
        if (fieldKey === 'opportunity') {
            const range = value || { from: '', to: '' };
            return (
                <div key={fieldKey} className="mb-3">
                    <label className="block mb-1 font-semibold">{title || 'Opportunity'}</label>
                    <div className="flex gap-2">
                        <InputText
                            placeholder="Սկսած"
                            className="w-full"
                            value={range.from}
                            onChange={(e) =>
                                handleChange(fieldKey, { ...range, from: e.target.value })
                            }
                        />
                        <InputText
                            placeholder="Մինչև"
                            className="w-full"
                            value={range.to}
                            onChange={(e) =>
                                handleChange(fieldKey, { ...range, to: e.target.value })
                            }
                        />
                    </div>
                </div>
            );
        }
        return (
            <div key={fieldKey} className="mb-3">
                {title && type !== 'file' && <label className="block mb-1 font-semibold">{title}</label>}
                {type === 'enumeration' ? (
                    isMultiple ? (
                        <MultiSelect
                            filter
                            showClear
                            value={value || []}
                            options={items || []}
                            optionLabel="VALUE"
                            dataKey="ID"
                            placeholder="Ընտրել"
                            className="w-full"
                            onChange={(e) => handleChange(fieldKey, e.value)}
                        />

                    ) : (
                        <Dropdown
                            showClear
                            value={value || null}
                            options={items || []}
                            optionLabel="VALUE"
                            dataKey="ID"
                            placeholder="Ընտրել"
                            className="w-full"
                            onChange={(e) => handleChange(fieldKey, e.value)}
                        />
                    )
                ) : type === 'string' || type === 'double' || type === 'money' || type === 'address' ? (
                    settings?.ROWS > 1 ? (
                        <div className="relative w-full">
                            <InputTextarea
                                value={value || ''}
                                placeholder={title}
                                rows={settings.ROWS}
                                className="w-full pr-8"
                                onChange={(e) => handleChange(fieldKey, e.target.value)}
                            />
                            {value && (
                                <i
                                    style={{top:'13px',right:'13px'}}
                                    className="pi pi-times absolute right-2 text-gray-400 cursor-pointer"
                                    onClick={() => handleChange(fieldKey, '')}
                                />
                            )}
                        </div>
                    ) : (
                        // InputText
                        <div className="relative w-full">
                            <InputText
                                value={value || ''}
                                placeholder={title}
                                className="w-full pr-8"
                                onChange={(e) => handleChange(fieldKey, e.target.value)}
                            />
                            {value && (
                                <i
                                    style={{top:'13px',right:'13px'}}
                                    className="pi pi-times absolute right-2 text-gray-400 cursor-pointer"
                                    onClick={() => handleChange(fieldKey, '')}
                                />
                            )}
                        </div>
                    )
                ) : type === 'boolean' ? (
                    <div className="flex align-items-center">
                        <Checkbox
                            checked={!!value}
                            onChange={(e) => handleChange(fieldKey, e.checked)}
                        />
                        <label className="ml-2">{settings?.LABEL_CHECKBOX?.en || fieldKey}</label>
                    </div>
                ) : null}
            </div>
        );
    };
    return (
        <Dialog
            style={{ minWidth: width < 768 ? '95%' : '50%' }}
            visible={visible}
            onHide={onHide}
            header="Որոնում"
        >
            {Object.entries(ufOnly).map(renderField)}

            <Button
                severity='success'
                className="w-full mt-3"
                label="Կիրառել"
                onClick={handleApply}
            />
            <Button
                severity='danger'
                className="w-full mt-2"
                label="Մաքրել"
                onClick={handleClear}
            />
        </Dialog>
    );
}

export default Filters;
