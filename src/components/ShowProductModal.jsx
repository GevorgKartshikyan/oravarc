import React from 'react';
import {Dialog} from 'primereact/dialog';
import {Tag} from 'primereact/tag';
import {Image} from 'primereact/image';
import useWindowSize from "../hooks/useWindowSize.js";

function ShowProductModal({product, visible, onHide, smartProcessFields}) {
    const {width} = useWindowSize();
    if (!product) return null;
    const renderField = (key, field) => {
        const value = product[key];
        if (
            value === null ||
            value === undefined ||
            (typeof value === 'string' && value.trim() === '') ||
            (Array.isArray(value) && value.length === 0)
        ) return null;

        const title = field.title || key;

        switch (field.type) {
            case 'boolean':
                return (
                    <div key={key} className="flex justify-between items-center mb-3">
                        <span className="font-medium text-gray-700">{title}</span>
                        <Tag className='text-xl' severity={value ? 'success' : 'danger'} value={value ? 'Այո' : 'Ոչ'}/>
                    </div>
                );

            case 'enumeration': {
                const items = field.items || [];
                const getLabel = (v) => items.find(i => +i.ID === +v)?.VALUE || v;
                return (
                    <div key={key} className="mb-3 flex align-items-center gap-3 flex-wrap">
                        <div className="font-medium text-gray-700 mb-1">{title}</div>
                        <span>-</span>
                        {field.isMultiple && Array.isArray(value)
                            ? value.map(v => (
                                <Tag key={v} value={getLabel(v)} className="mr-2 mb-1 text-base " rounded/>
                            ))
                            : <p className='text-base'>{getLabel(value)}</p>}
                    </div>
                );
            }

            case 'file': {
                const files = Array.isArray(value) ? value : [value];
                return null
                return (
                    <div key={key} className="mb-3">
                        <div className="font-medium text-gray-700 mb-2">{title}</div>
                        <div className="flex flex-wrap gap-3">
                            {files.map((file, i) => (
                                <Image
                                    key={i}
                                    src={file?.url || file?.url || file}
                                    alt={`Նկար-${i}`}
                                    width="100"
                                    height="100"
                                    preview
                                    className="shadow-2 border-round"
                                />
                            ))}
                        </div>
                    </div>
                );
            }

            default:
                return (
                    <div key={key} className="flex flex-col mb-3 gap-3 align-items-center">
                        <span className="font-medium text-gray-700">{title}</span>
                        <span>-</span>
                        <span className="text-gray-900 text-xl">{value}</span>
                    </div>
                );
        }
    };
    return (
        <Dialog
            header={product?.title || product?.NAME || 'Ապրանքի մանրամասներ'}
            visible={visible}
            onHide={onHide}
            style={{width: width < 768 ? '95%' : '50%'}}
            className="p-fluid"
            modal
        >
            <div className="mt-4 pt-2">
                <div className="mb-3 flex align-items-center gap-3">
                    <span className="font-medium text-gray-700">Սեփականատեր</span>
                    <span>-</span>
                    <span className="text-gray-900 text-xl">{product?.contact?.FULL_NAME}</span>
                </div>
                {product && product.contact && product.contact.PHONES && (
                    <div className="mb-3 flex align-items-center gap-3">
                        <span className="font-medium text-gray-700">Հեռ․՝</span>
                        <span>-</span>
                        {product.contact.PHONES.map((e) => (
                            <a href={`tel:${e.VALUE}`} className="text-gray-900 text-xl">{e.VALUE}</a>
                        ))}
                    </div>)}
                <div className="mb-3 flex align-items-center gap-3">
                    <span className="font-medium text-gray-700">Արժեք</span>
                    <span>-</span>
                    <span className="text-gray-900 text-xl">{product?.opportunity}</span>
                </div>
            </div>
            {Object.entries(smartProcessFields)
                .filter(([key]) => key.startsWith('ufCrm'))
                .map(([key, field]) => renderField(key, field))}

        </Dialog>
    );
}

export default ShowProductModal;
