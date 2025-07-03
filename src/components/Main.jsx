import React, {useEffect, useRef, useState} from 'react';
import Loading from "./Loading.jsx";
import {
    addDeal, deleteEvent,
    fetchAllContacts,
    fetchAllDeals, fetchAllItems, fetItemsFields, getAllUsers,
    getDealUserField, getDealUserFieldGet, updateDeal,
} from "../../api.js";
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import interactionPlugin from '@fullcalendar/interaction';
import FullCalendar from "@fullcalendar/react";
import AddEventModal from "./AddEventModal.jsx";
import {Button} from "primereact/button";
import ShowProductModal from "./ShowProductModal.jsx";
import ShowEventModal from "./ShowEventModal.jsx";
import Filters from "./Filters.jsx";
import {formatResources} from "../helpers/formatResources.js";
import {getDateTimeString, getDaysDifference} from "../helpers/formatDate.js";
import {formatEvents} from "../helpers/formatEvents.js";
import flattenFormData from "../helpers/flattenFormData.js";
import {Toast} from "primereact/toast";
import {MultiSelect} from "primereact/multiselect";
import dayGridPlugin from '@fullcalendar/daygrid'
import {SelectButton} from "primereact/selectbutton";

function Main({isAdmin, user}) {
    const [loading, setLoading] = useState(true);
    const [events, setEvents] = useState([]);
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [resources, setResources] = useState([]);
    const [allResources, setAllResources] = useState([]);
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [newEventStart, setNewEventStart] = useState(null);
    const [newEventEnd, setNewEventEnd] = useState(null);
    const [addBtnLoading, setAddBtnLoading] = useState(false);
    const [dealUserFields, setDealUserFields] = useState([]);
    const [productToShow, setProductToShow] = useState(null);
    const [eventToShow, setEventToShow] = useState(null);
    const [filterVisible, setFilterVisible] = useState(false);
    const [allContacts, setAllContacts] = useState([]);
    const [smartProcessFields, setSmartProcessFields] = useState([]);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [updateBtnLoading, setUpdateBtnLoading] = useState(false);
    const [isOtherPerson, setIsOtherPerson] = useState(false);
    const [allUsers, setAllUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [selectedResource, setSelectedResource] = useState({});
    useEffect(() => {
        setSelectedResource(resources[0])
        setSelectedProduct(resources[0])
    }, [resources])
    useEffect(() => {
        if (!isAdmin) {
            const filteredEvents = events.filter(event => +event.PARENT_ID_1036 === +selectedResource.id);
            setFilteredEvents(filteredEvents);
        }
    }, [selectedResource, isAdmin]);
    const toast = useRef(null);
    // const []
    useEffect(() => {
        (async () => {
            const allFields = await fetItemsFields();
            const dealUserFields = await getDealUserField();
            for (const item of dealUserFields) {
                const res = await getDealUserFieldGet(item.ID);
                item.title = res.LIST_COLUMN_LABEL?.ru || '';
            }
            const allSmartProcess = await fetchAllItems(1036, isAdmin, user);
            const allDeals = await fetchAllDeals();
            const allContacts = await fetchAllContacts();
            const allUsers = await getAllUsers();
            setResources(formatResources(allSmartProcess, allContacts));
            setAllResources(formatResources(allSmartProcess, allContacts));
            setEvents(formatEvents(allDeals.filter((e) => e.STAGE_ID !== 'LOSE'), allSmartProcess));
            setFilteredEvents(formatEvents(allDeals.filter((e) => e.STAGE_ID !== 'LOSE'), allSmartProcess));
            setAllUsers(allUsers);
            setSelectedUsers(allUsers);
            setDealUserFields(dealUserFields);
            setAllContacts(allContacts);
            setLoading(false);
            setSmartProcessFields(allFields);
        })();
    }, []);

    const handleHideAddModal = () => {
        setAddModalVisible(false);
        setSelectedProduct(null);
    }
    const handleAddEvent = async (fields) => {
        const startToSend = getDateTimeString(newEventStart, fields.startTime);
        const endToSend = getDateTimeString(newEventEnd, fields.endTime);
        const daysCount = getDaysDifference(newEventStart, newEventEnd) || 1;
        const hasOverlap = events.some(ev => {
            if (+selectedProduct.id !== +ev.product.id) return false;
            const evStart = new Date(ev.start);
            const evEnd = new Date(ev.end);
            return (new Date(startToSend) < evEnd && new Date(endToSend) > evStart);
        });
        if (hasOverlap) {
            toast.current.show({severity: 'error', summary: 'Սխալ', detail: 'Նշված ժամկետում կա գրանցում', life: 3000});
            return;
        }
        try {
            const flatFields = flattenFormData(fields);
            const deal = await addDeal(
                startToSend,
                endToSend,
                daysCount,
                selectedProduct.id,
                flatFields,
                selectedProduct.opportunity * daysCount,
                isAdmin ? user.ID : `contact_${user.ID}`,
                isAdmin,
                isAdmin ? user.ID : 12,
                (selectedProduct.opportunity * daysCount) - flatFields.UF_CRM_1749559223646
            );
            setEvents([...events, ...formatEvents([deal], [selectedProduct])]);
            setFilteredEvents([...events, ...formatEvents([deal], [selectedProduct])]);
            setAddModalVisible(false);
            setSelectedProduct(null);
            setNewEventStart(null);
            setNewEventEnd(null);
        } catch (error) {
            console.error('error to add event', error);
        } finally {
            setAddBtnLoading(false);
        }
    };
    const handleUpdateEvent = async (fields) => {
        const startToSend = getDateTimeString(new Date(eventToShow.UF_CRM_1749479675960), fields.startTime);
        const endToSend = getDateTimeString(new Date(eventToShow.UF_CRM_1749479687467), fields.endTime);
        const daysCount = getDaysDifference(new Date(eventToShow.UF_CRM_1749479675960), (new Date(eventToShow.UF_CRM_1749479687467))) || 1;
        try {
            const flatFields = flattenFormData(fields);
            const deal = await updateDeal(
                eventToShow.ID,
                startToSend,
                endToSend,
                daysCount,
                flatFields,
                eventToShow.product.opportunity * daysCount,
                (eventToShow.product.opportunity * daysCount) - flatFields.UF_CRM_1749559223646,
            );
            const newData = formatEvents([deal], [eventToShow.product]);
            setEvents(events.map((e) => +e.ID === +eventToShow.ID ? newData[0] : e));
            setFilteredEvents(events.map((e) => +e.ID === +eventToShow.ID ? newData[0] : e));
            setEventToShow(null);
        } catch (error) {
            console.error('error to add event', error);
        } finally {
            setUpdateBtnLoading(false);
        }
    }
    const handleDeleteEvent = async (id) => {
        setDeleteLoading(true);
        await deleteEvent(id);
        setEvents(events.filter((e) => +e.ID !== +id));
        setFilteredEvents(events.filter((e) => +e.ID !== +id));
        setEventToShow(null)
        setDeleteLoading(false)
    };
    useEffect(() => {
        const filtered = events.filter((e) => selectedUsers.some((u) => +u.id === +e.ASSIGNED_BY_ID));
        setFilteredEvents(filtered);
    }, [selectedUsers, events]);

    function renderDayCell(arg, events) {
        const dayStart = new Date(arg.date);
        const dayEnd = new Date(arg.date);
        dayEnd.setHours(23, 59, 59, 999);
        const eventsInDay = events.filter(event => {
            const start = new Date(event.start);
            const end = new Date(event.end || event.start);
            return end >= dayStart && start <= dayEnd;
        });
        return (
            <div className="custom-day">
                <div className={`circle ${arg.dayNumberText ? 'active' : ''}`}>
                    {arg.dayNumberText}
                    {eventsInDay.length > 0 && (
                        <div className="event-fill" style={{
                            backgroundColor: eventsInDay[0].backgroundColor,
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            borderRadius: '50%',
                            opacity: 0.2,
                            zIndex: 1
                        }}/>
                    )}
                </div>
            </div>
        );
    }


    function renderEventContent(arg) {
        return (
            <div style={{
                backgroundColor: arg.backgroundColor,
                color: 'white',
                boxShadow:'rgba(0, 0, 0, 0.2) 0px 2px 5px',
                borderRadius: '3px',
                padding: '2px'
            }} className="reserved-dot">{arg.event._def.title}</div>
        );
    }

    if (loading) {
        return <Loading/>
    }
    return (
        <>
            <Toast ref={toast}/>
            <div className='flex gap-3 align-items-center mb-3'>
                {isAdmin && <Button
                    icon='pi pi-filter'
                    onClick={() => setFilterVisible(true)} outlined
                />}
                {!isAdmin && (
                    <SelectButton
                        value={selectedResource} onChange={(e) => {
                        setSelectedResource(e.value)
                        setSelectedProduct(e.value)
                        // setProductToShow(e.value)
                    }}
                        optionLabel="title"
                        options={resources}
                    />
                )}
                {isAdmin && <MultiSelect
                    filter
                    options={allUsers}
                    value={selectedUsers}
                    onChange={(e) => {
                        setSelectedUsers(e.value)
                    }}
                    optionLabel="title"
                    display="chip"
                    className='w-20rem'
                />}
            </div>
            {filterVisible && <Filters
                visible={filterVisible}
                onHide={() => setFilterVisible(false)}
                properties={smartProcessFields}
                resources={resources}
                setResources={setResources}
                allResources={allResources}
            />}
            {eventToShow && (
                <ShowEventModal
                    isOtherPerson={isOtherPerson}
                    handleUpdateEvent={handleUpdateEvent}
                    btnLoading={updateBtnLoading}
                    allContacts={allContacts}
                    allFields={dealUserFields}
                    deleteLoading={deleteLoading}
                    handleDeleteEvent={handleDeleteEvent}
                    event={eventToShow}
                    visible={!!eventToShow}
                    onHide={() => setEventToShow(null)}
                />
            )}
            {productToShow && (
                <ShowProductModal
                    smartProcessFields={smartProcessFields}
                    visible={!!productToShow}
                    onHide={() => setProductToShow(null)}
                    product={productToShow}
                />
            )}
            {addModalVisible && (<AddEventModal
                isAdmin={isAdmin}
                allFields={dealUserFields}
                allContacts={allContacts}
                addLoading={addBtnLoading}
                handleAddEvent={handleAddEvent}
                productInfo={selectedProduct}
                visible={addModalVisible}
                onHide={handleHideAddModal}
                product={selectedProduct}
                eventStart={newEventStart}
                eventEnd={newEventEnd}
            />)}
            <div className={!isAdmin ? "custom-calendar" : ""}>
                <FullCalendar
                    dayCellContent={(arg) => renderDayCell(arg, filteredEvents)}
                    eventContent={isAdmin ? undefined : renderEventContent}
                    selectable={true}
                    select={(info) => {
                        setNewEventStart(info.start);
                        setNewEventEnd(new Date(info.end.getTime() - 86400000));
                        if (isAdmin) {
                            setSelectedProduct({
                                ...info.resource._resource.extendedProps,
                                title: info.resource._resource.title,
                                id: info.resource._resource.id
                            });
                        } else {
                            setSelectedProduct(selectedResource)
                        }
                        setAddModalVisible(true);

                    }}
                    eventMouseEnter={(arg) => {
                        // console.log(arg)
                    }}
                    plugins={[resourceTimelinePlugin, interactionPlugin, dayGridPlugin]}
                    timeZone="Asia/Yerevan"
                    initialView={!isAdmin ? "dayGridMonth" : 'resourceTimelineMonth'}
                    resourceAreaWidth="200px"
                    aspectRatio={1.5}
                    headerToolbar={{
                        left: 'prev,next',
                        center: 'title',
                        right: isAdmin ? 'resourceTimelineWeek,resourceTimelineMonth' : '',
                    }}
                    editable={true}
                    resourceLabelContent={({resource}) => {
                        const info = resource._resource.extendedProps;
                        return (
                            <div className="flex align-items-center justify-content-between">
                                <span>{resource._resource.title}</span>
                                <Button
                                    onClick={() => setProductToShow({...info, title: resource._resource.title})}
                                    outlined
                                    style={{width: '30px', height: '30px'}}
                                    icon="pi pi-info"
                                    rounded
                                    className="p-pulse"
                                />
                            </div>
                        );
                    }}
                    eventDrop={(info) => {
                        info.revert();
                    }}
                    slotLabelContent={(arg) => {
                        const date = arg.date;
                        const day = String(date.getDate()).padStart(2, '0');
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        return (
                            <span className="my-custom-date-label">
                                {day}.{month}
                                 </span>
                        );
                    }}
                    resources={resources}
                    events={filteredEvents}
                    eventDurationEditable={true}
                    eventResize={async (info) => {
                        info.revert();
                        return;
                    }}

                    eventDataTransform={(event) => ({
                        ...event,
                        title: event.TITLE,
                    })}
                    slotDuration="24:00:00"
                    slotLabelFormat={[
                        {day: '2-digit', month: '2-digit'},
                    ]}
                    height="auto"
                    eventClick={(info) => {
                        const creator = info.event._def.extendedProps.UF_CRM_1749565990368
                        if (!isAdmin && creator !== `contact_${user.ID}`) {
                            setIsOtherPerson(true)
                        } else {
                            setIsOtherPerson(false)
                        }
                        setEventToShow({...info.event._def, ...info.event._def.extendedProps});
                    }}
                />
            </div>
        </>
    );
}

export default Main;