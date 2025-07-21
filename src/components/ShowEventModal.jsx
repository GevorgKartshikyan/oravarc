import React, {useEffect, useState} from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import useWindowSize from '../hooks/useWindowSize.js';
import {MultiSelect} from "primereact/multiselect";
import {Dropdown} from "primereact/dropdown";
import {InputTextarea} from "primereact/inputtextarea";
import {InputText} from "primereact/inputtext";
import {Checkbox} from "primereact/checkbox";
import {InputMask} from "primereact/inputmask";
import moment from "moment";

function ShowEventModal({ visible, onHide, event,handleDeleteEvent,deleteLoading,allContacts, allFields ,btnLoading,handleUpdateEvent,isOtherPerson,allUsers}) {
    const { width } = useWindowSize();
    const [formData, setFormData] = useState({});
    const [newEventStart, setNewEventStart] = useState('');
    const [newEventEnd, setNewEventEnd] = useState('');
    const [contact, setContact] = useState(null);
    useEffect(()=>{
        const contact = allContacts.find(item => +item.ID === +event.CONTACT_ID);
        setContact(contact);
    },[])
    const handleChange = (fieldName, value) => {
        setFormData(prev => ({...prev, [fieldName]: value}));
    };
    useEffect(() => {
        const defaultFormData = {};
        allFields.forEach(field => {
            if (field.USER_TYPE_ID === 'enumeration' && field.MULTIPLE === 'N') {
                const defaultValue = event[field.FIELD_NAME];
                defaultFormData[field.FIELD_NAME] = field.LIST.find(item => +item.ID === +defaultValue);
            }else if (field.USER_TYPE_ID === 'double' || field.USER_TYPE_ID === 'string' || field.USER_TYPE_ID === 'money') {
                const defaultValue = event[field.FIELD_NAME];
                defaultFormData[field.FIELD_NAME] = defaultValue;
            }else if (field.USER_TYPE_ID === 'enumeration' && field.MULTIPLE === 'Y'){
                const defaultValue = event[field.FIELD_NAME];
                if (defaultValue){
                    defaultFormData[field.FIELD_NAME] = field.LIST.filter(item => defaultValue?.includes(+item.ID));
                }else {
                    defaultFormData[field.FIELD_NAME] = [];
                }
            }else if (field.USER_TYPE_ID === 'boolean') {
                const defaultValue = event[field.FIELD_NAME];
                defaultFormData[field.FIELD_NAME] = defaultValue === '1';
            }
        });
        const start = moment(event.UF_CRM_1749479675960).format('HH:mm');
        const end = moment(event.UF_CRM_1749479687467).format('HH:mm');
        setNewEventStart(start)
        setNewEventEnd(end)
        setFormData(defaultFormData);
    }, []);
    return (
        <Dialog
            className='modal-dialog'
            draggable={false}
            style={{ minWidth: width < 768 ? '95%' : '50%' }}
            visible={visible}
            onHide={onHide}
            header={()=>{
                return (
                    <div>
                        <p style={{cursor: 'pointer'}} onClick={()=>{
                            window.BX24.openPath(
                                `/crm/deal/details/${event.ID}/`,
                                function (result) {
                                    console.log(result);
                                }
                            );
                        }}>{event?.title}</p>
                        <p>{moment(event.UF_CRM_1749479675960).format('DD.MM.YYYY')}  - {moment(event.UF_CRM_1749479687467).format('DD.MM.YYYY')}</p>
                        <div className='flex gap-2 align-items-center'>
                            <p>Գումար  - {event.OPPORTUNITY}</p>
                            <p>Կանխավճար  - {event.UF_CRM_1749559223646}</p>
                            <p>Մնացորդ  - {event.UF_CRM_1750401051}</p>
                        </div>
                    </div>
                )
            }}
        >
            <div className='mb-3'>
                <p><strong>Հաճախորդ</strong></p>
                <p>{contact?.FULL_NAME}</p>
                <div style={{
                    maxWidth:'100%',
                    wordBreak:'break-word',
                    wordWrap:'break-word',
                }}>Հեռ։{contact?.PHONES?.map(item => item.VALUE).join(', ')}</div>
            </div>
                <div className='mb-3'>
                    <p><strong>Պատասխանատու</strong></p>
                    <p>{allUsers.find((e)=>+e.id === +event.ASSIGNED_BY_ID).title || 'Հեռացված է'}</p>
                </div>
            <div className="flex flex-column gap-3">
                <div className="flex gap-3 time-inputs">
                    <div className='w-full'>
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
           <div className='flex flex-wrap gap-3'>
               {allFields.filter(field => field.USER_TYPE_ID !== 'datetime' && field.USER_TYPE_ID !== 'file' && field.FIELD_NAME !== 'UF_CRM_1749539216833' && field.title !== 'Ամրագրող' && !field.title.endsWith('-')).map(field => {
                   const {
                       FIELD_NAME,
                       USER_TYPE_ID,
                       MULTIPLE,
                       SETTINGS,
                       LIST,
                       title
                   } = field;
                   const value = formData[FIELD_NAME];
                   return (
                       <div key={FIELD_NAME} className="row-filed">
                           {title && <label className="block mb-1">{title}</label>}
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
                                       className="w-full"
                                       onChange={(e) => handleChange(FIELD_NAME, e.value)}
                                   />
                               )
                           )  : USER_TYPE_ID === 'string' || USER_TYPE_ID === 'double' || USER_TYPE_ID === 'money'  ? (
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
                           ) : null}
                       </div>
                   );
               })}
           </div>
            </div>
            <div className="flex w-full gap-3">
            </div>
            {!isOtherPerson && <div className="flex flex-column p-jc-end gap-2 mt-4">
                <Button loading={btnLoading} label="Խմբագրել" icon="pi pi-pencil" className="p-button-info"
                        onClick={() => handleUpdateEvent({
                            startTime: newEventStart,
                            endTime: newEventEnd,
                            ...formData,
                        })}/>
                <Button loading={deleteLoading} label="Ջնջել" icon="pi pi-trash" className="p-button-danger"
                        onClick={() => handleDeleteEvent(event.ID)}/>
            </div>}
        </Dialog>
    );
}

export default ShowEventModal;
