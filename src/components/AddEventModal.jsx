import React, {useRef, useState} from 'react';
import {Dialog} from "primereact/dialog";
import {Button} from "primereact/button";
import {Dropdown} from "primereact/dropdown";
import {InputTextarea} from "primereact/inputtextarea";
import useWindowSize from "../hooks/useWindowSize.js";
import {InputText} from "primereact/inputtext";
import {InputNumber} from "primereact/inputnumber";
import {InputMask} from "primereact/inputmask";
import {AutoComplete} from "primereact/autocomplete";
import {Checkbox} from "primereact/checkbox";
import {MultiSelect} from "primereact/multiselect";
import {Toast} from "primereact/toast";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import {FileUpload} from "primereact/fileupload";
import PriceSummary from "./PriceSummary.jsx";
import { calculateBookingPrice } from "../helpers/calculatePrice.js";

function AddEventModal({
                           visible, handleAddEvent, addLoading, onHide, productInfo,
                           allContacts, allFields, isAdmin, product, eventEnd, eventStart, allUsers, user
                       }) {
    const {width} = useWindowSize()
    const [newEventStart, setNewEventStart] = useState('12:00');
    const [newEventEnd, setNewEventEnd] = useState('14:00');
    const [selectedContact, setSelectedContact] = useState(null);
    const [filteredContacts, setFilteredContacts] = useState([]);
    const [newContactName, setNewContactName] = useState('');
    const [newContactPhone, setNewContactPhone] = useState('');
    const [newContactPhones, setNewContactPhones] = useState([]);
    const [isNewContact, setIsNewContact] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [btnLoading, setBtnLoading] = useState(false);
    const [persons, setPersons] = useState(1);
    const [selectedUser, setSelectedUser] = useState(allUsers.find((e) => +e.id === +user.ID) || null);

    const toast = useRef(null);
    const searchContacts = (event) => {
        const query = event.query.toLowerCase();
        const results = allContacts.filter(contact =>
            contact.FULL_NAME?.toLowerCase().includes(query) ||
            contact.PHONE?.toLowerCase().includes(query)
        );
        setFilteredContacts(results);
    };

    const [formData, setFormData] = useState({
        "UF_CRM_1749479746448": {
            "ID": "44",
            "SORT": "10",
            "VALUE": "Նախնական",
            "DEF": "N",
            "XML_ID": "324354de9dc32043a1cccd0e0be17c4f"
        }
    });

    const sortedFields = [...allFields]
        .filter(f => f.USER_TYPE_ID !== 'datetime' && f.FIELD_NAME !== 'UF_CRM_1749539216833' && f.title !== 'Ամրագրող' && !f?.title?.endsWith('-'));

    const idx262 = sortedFields.findIndex(f => f.ID === "262");
    const idx251 = sortedFields.findIndex(f => f.ID === "252");
    if (idx262 !== -1 && idx251 !== -1 && idx262 !== idx251 + 1) {
        const [f262] = sortedFields.splice(idx262, 1);
        sortedFields.splice(idx251 + 1, 0, f262);
    }
    const idx234 = sortedFields.findIndex(f => f.FIELD_NAME === "UF_CRM_1749479746448");
    if (idx234 !== -1) {
        const [f234] = sortedFields.splice(idx234, 1);
        sortedFields.push(f234);
    }

    const handleChange = (fieldName, value) => {
        setFormData(prev => ({...prev, [fieldName]: value}));
    };

    // Calculate total for dialog header
    const { grandTotal } = calculateBookingPrice(eventStart, eventEnd, persons, productInfo)
    return (
        <>
            <Toast ref={toast}/>
            <Dialog
                className='modal-dialog'
                header={() => (
                    <div>
                        <p style={{ fontWeight: 700, fontSize: 16 }}>{productInfo?.title}</p>
                        <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>
                            Ընդհանուր գին:{' '}
                            <strong style={{ color: '#4361ee', fontSize: 16 }}>
                                {grandTotal.toLocaleString()} ֏
                            </strong>
                        </p>
                    </div>
                )}
                onHide={onHide}
                visible={visible}
                style={{minWidth: width < 768 ? '95%' : '50%'}}
            >
                <div className="flex flex-column gap-3 mt-1">

                    {/* Date range display */}
                    {eventStart && eventEnd && (
                        <div className="border-round bg-gray-100 p-2">
                            <b>Օրեր:</b>{' '}
                            {new Date(eventStart).toLocaleDateString()} —{' '}
                            {(() => {
                                const endDate = new Date(eventEnd);
                                if (formData?.UF_CRM_1751462672002?.ID === "558") {
                                    endDate.setDate(endDate.getDate() + 1);
                                }
                                return endDate.toLocaleDateString();
                            })()}
                        </div>
                    )}

                    {/* Check-in / check-out times */}
                    <div className="flex w-full gap-3">
                        <div className='w-full'>
                            <label htmlFor="start">Սկիզբ</label>
                            <InputMask
                                mask='99:99'
                                className='w-full'
                                timeOnly
                                placeholder='Մուտք'
                                value={newEventStart}
                                onChange={(e) => setNewEventStart(e.target.value)}
                            />
                        </div>
                        <div className='w-full'>
                            <label htmlFor="end">Ավարտ</label>
                            <InputMask
                                mask='99:99'
                                className='w-full'
                                timeOnly
                                placeholder='Ելք'
                                value={newEventEnd}
                                onChange={(e) => setNewEventEnd(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Persons count */}
                    <div>
                        <label className="block mb-1">Հյուրերի քանակ</label>
                        <InputNumber
                            value={persons}
                            min={1}
                            max={99}
                            showButtons
                            buttonLayout="horizontal"
                            decrementButtonClassName="p-button-secondary"
                            incrementButtonClassName="p-button-secondary"
                            incrementButtonIcon="pi pi-plus"
                            decrementButtonIcon="pi pi-minus"
                            className="w-full"
                            onChange={(e) => setPersons(e.value || 1)}
                        />
                    </div>

                    {/* ── PRICE BREAKDOWN ── */}
                    <PriceSummary
                        formData={formData}
                        eventStart={eventStart}
                        eventEnd={eventEnd}
                        persons={persons}
                        productInfo={productInfo}
                    />

                    {/* Contact search */}
                    <div className="relative w-full">
                        {isAdmin && (
                            <AutoComplete
                                inputClassName='w-full'
                                value={selectedContact || ''}
                                suggestions={filteredContacts}
                                completeMethod={searchContacts}
                                field="FULL_NAME"
                                placeholder="Որոնել հաճախորդին"
                                className="w-full"
                                onChange={(e) => {
                                    setSelectedContact(e.value);
                                    setIsNewContact(false);
                                }}
                                itemTemplate={(item) => (
                                    <div className="flex justify-between">
                                        <span>{item.FULL_NAME}</span>
                                        <span className="text-sm text-gray-500">{item.PHONE}</span>
                                    </div>
                                )}
                                onInput={(e) => {
                                    setSearchQuery(e.target.value);
                                }}
                            />
                        )}

                        {isAdmin && (
                            <div className="w-full mt-2">
                                <label className="block mb-1">Պատասխանատու</label>
                                <Dropdown
                                    value={selectedUser}
                                    options={allUsers || []}
                                    optionLabel="title"
                                    placeholder="Ընտրել օգտատիրոջը"
                                    className="w-full"
                                    onChange={(e) => setSelectedUser(e.value)}
                                />
                            </div>
                        )}

                        {searchQuery.length > 0 && !isNewContact && (
                            <div className="mt-2 border-t border-gray-200 pt-2">
                                <Button
                                    label="Ավելացնել նորը"
                                    icon="pi pi-plus"
                                    className="w-full"
                                    onClick={() => {
                                        const lettersOnly = /^[\p{L}\s]+$/u;
                                        const numbersAndPlus = /^[\d+]+$/;
                                        if (lettersOnly.test(searchQuery)) {
                                            setNewContactName(searchQuery);
                                        } else if (numbersAndPlus.test(searchQuery)) {
                                            setNewContactPhone(searchQuery);
                                        } else {
                                            setNewContactName(searchQuery);
                                        }
                                        setIsNewContact(true);
                                        setSelectedContact(null);
                                    }}
                                />
                            </div>
                        )}

                        {isNewContact && (
                            <div className="mt-2 flex flex-column gap-2">
                                <label htmlFor="newContactName" className="block mb-1">Անուն Ազգանուն</label>
                                <InputText
                                    id='newContactName'
                                    placeholder="Անուն Ազգանուն"
                                    className="w-full"
                                    value={newContactName}
                                    onChange={(e) => setNewContactName(e.target.value)}
                                />
                                <label htmlFor="newContactPhone" className="block mb-1">Հեռախոսահամար</label>
                                <div className='flex gap-2 align-items-center align-self-stretch'>
                                    <PhoneInput
                                        enableSearch
                                        autocompleteSearch
                                        buttonClass="form-input__block-input__button"
                                        inputClass="w-full"
                                        id="phone"
                                        country={'am'}
                                        value={newContactPhone}
                                        onChange={(e) => setNewContactPhone(e)}
                                    />
                                    <Button
                                        icon="pi pi-plus"
                                        onClick={() => {
                                            if (newContactPhone && !newContactPhones.includes(newContactPhone)) {
                                                setNewContactPhones([...newContactPhones, newContactPhone]);
                                                setNewContactPhone('');
                                            }
                                        }}
                                    />
                                </div>
                                {newContactPhones.length > 0 && (
                                    <div>
                                        <p>Ավելացված համարներ</p>
                                        <ul className="p-0 flex gap-2">
                                            {newContactPhones.map((phone, index) => (
                                                <li key={index} className="flex justify-between align-items-center border-1 rounded p-2">
                                                    <span>{phone}</span>
                                                    <Button
                                                        icon="pi pi-times"
                                                        className="p-button-sm p-button-text text-red-500"
                                                        onClick={() => setNewContactPhones(newContactPhones.filter((_, i) => i !== index))}
                                                    />
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Dynamic fields */}
                    <div className='flex flex-wrap gap-3'>
                        {sortedFields
                            .filter((e) => isAdmin || e.FIELD_NAME === 'UF_CRM_1749479746448' || e.FIELD_NAME === 'UF_CRM_1749539326485')
                            .map(field => {
                                const { FIELD_NAME, USER_TYPE_ID, MULTIPLE, SETTINGS, LIST, title, MANDATORY } = field;
                                const value = formData[FIELD_NAME];
                                return (
                                    <div key={FIELD_NAME} className="row-filed">
                                        {title && (
                                            <label className={`block mb-1 ${FIELD_NAME === 'UF_CRM_1749479746448' ? 'font-bold text-lg' : ''}`}>
                                                {title}
                                                {MANDATORY === 'Y' && <span className="text-red-500"> *</span>}
                                            </label>
                                        )}
                                        {USER_TYPE_ID === 'enumeration' ? (
                                            MULTIPLE === 'Y' ? (
                                                <MultiSelect
                                                    value={value || []}
                                                    options={LIST || []}
                                                    optionLabel="VALUE"
                                                    placeholder="Select..."
                                                    className="w-full"
                                                    onChange={(e) => handleChange(FIELD_NAME, e.value)}
                                                />
                                            ) : (
                                                <Dropdown
                                                    value={value}
                                                    options={LIST || []}
                                                    optionLabel="VALUE"
                                                    placeholder="Select..."
                                                    className={`w-full ${FIELD_NAME === 'UF_CRM_1749479746448' ? 'font-bold text-xl border-8 border-red-600 shadow-[0_0_20px_5px_rgba(220,38,38,0.7)] bg-red-50 rounded-lg' : ''}`}
                                                    onChange={(e) => handleChange(FIELD_NAME, e.value)}
                                                />
                                            )
                                        ) : USER_TYPE_ID === 'string' ? (
                                            SETTINGS?.ROWS && SETTINGS.ROWS > 1 ? (
                                                <InputTextarea
                                                    value={value || ''}
                                                    placeholder={title}
                                                    className="w-full"
                                                    rows={SETTINGS.ROWS}
                                                    onChange={(e) => handleChange(FIELD_NAME, e.target.value)}
                                                />
                                            ) : (
                                                <InputText
                                                    value={value || ''}
                                                    placeholder={title}
                                                    className="w-full"
                                                    onChange={(e) => handleChange(FIELD_NAME, e.target.value)}
                                                />
                                            )
                                        ) : USER_TYPE_ID === 'boolean' ? (
                                            <>
                                                <Checkbox
                                                    checked={!!value}
                                                    onChange={(e) => handleChange(FIELD_NAME, e.checked)}
                                                />
                                                <label className="ml-2">Այո</label>
                                            </>
                                        ) : USER_TYPE_ID === 'double' || USER_TYPE_ID === 'money' ? (
                                            <InputNumber
                                                value={value || ''}
                                                placeholder={title}
                                                className="w-full"
                                                onChange={(e) => handleChange(FIELD_NAME, e.value)}
                                            />
                                        ) : USER_TYPE_ID === 'file' ? (
                                            <FileUpload
                                                name="file"
                                                customUpload
                                                auto
                                                multiple={false}
                                                chooseLabel="Ներբեռնել ֆայլ"
                                                className="w-full"
                                                onSelect={(e) => {
                                                    const file = e.files?.[0];
                                                    if (file) handleChange(FIELD_NAME, [file]);
                                                }}
                                                onClear={() => handleChange(FIELD_NAME, [])}
                                            />
                                        ) : null}
                                    </div>
                                );
                            })}
                    </div>

                    {/* Submit */}
                    <div>
                        <Button
                            loading={btnLoading}
                            disabled={btnLoading}
                            label="Ամրագրել"
                            icon="pi pi-save"
                            onClick={async () => {
                                setBtnLoading(true);
                                const missingRequired = sortedFields
                                    .filter(field => field.MANDATORY === 'Y' && field.USER_TYPE_ID !== 'datetime')
                                    .filter((e) => isAdmin || e.ID === '238' || e.ID === '234')
                                    .some(field => {
                                        const value = formData[field.FIELD_NAME];
                                        return value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
                                    });

                                if (missingRequired) {
                                    toast.current.show({
                                        severity: 'error',
                                        summary: 'Սխալ',
                                        detail: 'Խնդրում ենք լրացնել բոլոր պարտադիր դաշտերը։',
                                        life: 3000
                                    });
                                    setBtnLoading(false);
                                    return;
                                }

                                if (!isNewContact && !selectedContact && isAdmin) {
                                    if (formData?.UF_CRM_1749479746448?.ID !== '44' && formData?.UF_CRM_1749479746448?.ID !== '48' && formData?.UF_CRM_1749479746448?.ID !== '46') {
                                        toast.current.show({
                                            severity: 'error',
                                            summary: 'Սխալ',
                                            detail: 'Խնդրում ենք նշել հաճախորդ',
                                            life: 3000
                                        });
                                        setBtnLoading(false);
                                        return;
                                    }
                                }

                                if (isNewContact && (!newContactName || newContactPhones.length === 0) && isAdmin) {
                                    if (formData?.UF_CRM_1749479746448?.ID !== '44' && formData?.UF_CRM_1749479746448?.ID !== '48' && formData?.UF_CRM_1749479746448?.ID !== '46') {
                                        toast.current.show({
                                            severity: 'error',
                                            summary: 'Սխալ',
                                            detail: 'Խնդրում ենք նշել հաճախորդի անունը եւ հեռախոս',
                                            life: 3000
                                        });
                                        setBtnLoading(false);
                                        return;
                                    }
                                }

                                await handleAddEvent({
                                    startTime: newEventStart,
                                    endTime: newEventEnd,
                                    ...formData,
                                    persons,
                                    isNewContact,
                                    CONTACT_ID: selectedContact?.ID,
                                    contact_name: isAdmin ? (isNewContact ? newContactName : selectedContact?.FULL_NAME) : null,
                                    contact_phone: isAdmin ? (isNewContact ? newContactPhones : selectedContact?.PHONE) : null,
                                    ASSIGNED_BY_ID: isAdmin ? selectedUser : user,
                                });
                                setBtnLoading(false);
                            }}
                            className="w-full"
                        />
                    </div>
                </div>
            </Dialog>
        </>
    );
}

export default AddEventModal;
