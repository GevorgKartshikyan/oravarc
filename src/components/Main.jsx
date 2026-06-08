import React, {useEffect, useRef, useState} from 'react';
import Loading from "./Loading.jsx";
import {
    addDeal, deleteEvent,
    fetchAllContacts,
    fetchAllDeals, fetchAllItems, fetItemsFields, getAllUsers, getDeal,
    getDealUserField, sendAction, updateDeal,
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
import {formatEventFileds} from "../helpers/formatEventFileds.js";
import {Calendar} from "primereact/calendar";
import Holidays from 'date-holidays';
import getSpecialDaysCount from "../helpers/getSpecialDaysCount.js";
import echo from "../helpers/echo.js";
import useWindowSize from "../hooks/useWindowSize.js";
import moment from "moment";
import Overlay from "./Overlay.jsx";
import {applyFilters} from "../helpers/applyFilters.js";

function Main({isAdmin, user}) {
    const [loading, setLoading] = useState(true);
    const [secondLoading, setSecondLoading] = useState(false);
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
    const [freeDays, setFreeDays] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const {width} = useWindowSize();
    const [selectedDate, setSelectedDate] = useState(null);
    useEffect(() => {
        setSelectedResource(resources[0])
        setSelectedProduct(resources[0])
    }, [resources])
    const eventsRef = useRef([]);
    useEffect(() => {
        eventsRef.current = events;
    }, [events]);

    useEffect(() => {
        const handleDealAdded = async (event) => {
            const {dealId} = event;
            console.log(event)
            try {
                const deal = await getDeal(dealId);
                const selectedProduct = await getDeal(deal.UF_CRM_1751522804);
                const formatted = formatEvents([deal], [selectedProduct]);
                setEvents((prev) => {
                    const updated = [...prev, ...formatted];
                    eventsRef.current = updated;
                    return updated;
                });
                setFilteredEvents((prev) => [...prev, ...formatted]);
            } catch (err) {
                console.error("error to get deal", err);
            }
        };
        const handleDeleteEvent = (dealId) => {
            setEvents((prev) => {
                const updated = prev.filter((e) => +e.ID !== +dealId);
                eventsRef.current = updated;
                return updated;
            });
            setFilteredEvents((prev) => prev.filter((e) => +e.ID !== +dealId));
        };
        const handleDealUpdate = async (event) => {
            const {dealId} = event;
            try {
                const deal = await getDeal(dealId);
                if (deal.STAGE_ID === 'LOSE') {
                    handleDeleteEvent(dealId)
                } else {
                    const selectedProduct = await getDeal(deal.UF_CRM_1751522804);
                    const newData = formatEvents([deal], [selectedProduct]);
                    setEvents((prev) => {
                        const updated = prev.map((e) => +e.ID === +deal.ID ? newData[0] : e);
                        eventsRef.current = updated;
                        return updated;
                    });

                    setFilteredEvents((prev) => prev.map((e) => +e.ID === +deal.ID ? newData[0] : e));
                }
            } catch (err) {
                console.error("error to get deal", err);
            }
        };
        echo.channel("deals").listen(".deal.added", handleDealAdded);
        echo.channel("deals").listen(".deal.updated", handleDealUpdate);
        return () => {
            echo.leave("deals");
        };
    }, []);


    useEffect(() => {
        const hd = new Holidays('AM');
        const year = new Date().getFullYear();
        const data = hd.getHolidays(year);
        setHolidays(data);
    }, []);
    useEffect(() => {
        if (!isAdmin) {
            const filteredEvents = events.filter(event => +event.UF_CRM_1751522804 === +selectedResource.id);
            setFilteredEvents(filteredEvents);
        }
    }, [selectedResource, isAdmin]);
    const toast = useRef(null);
    // const []
    useEffect(() => {
        (async () => {
            if (!selectedDate) return;
            setSecondLoading(true)
            const baseDate = !isAdmin
                ? new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1)
                : selectedDate;

            const firstDayCurrentMonth = new Date(
                baseDate.getFullYear(),
                baseDate.getMonth(),
                1
            );

            const firstDayNextMonth = new Date(
                baseDate.getFullYear(),
                baseDate.getMonth() + 1,
                1
            );

            const start = moment(firstDayCurrentMonth).format('YYYY-MM-DD');
            const end = moment(firstDayNextMonth).format('YYYY-MM-DD');
            const [allFields ,dealUserFields,allDealsEvents,allDealsProperty ,allContacts,allUsers] = await Promise.all([
                fetItemsFields(),
                getDealUserField(),
                fetchAllDeals(0, start, end),
                fetchAllItems(2, isAdmin, user),
                fetchAllContacts(),
                getAllUsers()
            ])
            const savedFilters = JSON.parse(
                localStorage.getItem('filters') || '{}'
            );
            const resources = formatResources(allDealsProperty, allContacts);

            setResources(
                applyFilters(
                    resources,
                    allFields,
                    savedFilters
                )
            );
            setAllResources(resources);
            setEvents(formatEvents(allDealsEvents.filter((e) => e.STAGE_ID !== 'LOSE'), allDealsProperty));
            setFilteredEvents(formatEvents(allDealsEvents.filter((e) => e.STAGE_ID !== 'LOSE'), allDealsProperty));
            setAllUsers(allUsers);
            setSelectedUsers(allUsers);
            setDealUserFields(formatEventFileds(dealUserFields));
            setAllContacts(allContacts);
            setLoading(false);
            setSecondLoading(false);
            setSmartProcessFields(allFields);
        })();
    }, [selectedDate]);
    const handleHideAddModal = () => {
        setAddModalVisible(false);
        setSelectedProduct(null);
    }
    const handleFilterFreeDays = async () => {
        const [rangeStartStr, rangeEndStr] = freeDays;
        const rangeStart = new Date(rangeStartStr);
        const rangeEnd = new Date(rangeEndStr);
        const toDateStr = (date) => new Date(date).toISOString().split('T')[0];
        const rangeDates = [];
        for (let d = new Date(rangeStart); d <= rangeEnd; d.setDate(d.getDate() + 1)) {
            rangeDates.push(toDateStr(new Date(d)));
        }
        const busyDatesByResource = {};
        for (const event of filteredEvents) {
            const resId = event.resourceId;
            if (!busyDatesByResource[resId]) {
                busyDatesByResource[resId] = new Set();
            }

            const eventStart = new Date(event.start);
            const eventEnd = new Date(event.end);
            eventStart.setHours(0, 0, 0, 0);
            eventEnd.setHours(0, 0, 0, 0);

            for (let d = new Date(eventStart); d <= eventEnd; d.setDate(d.getDate() + 1)) {
                busyDatesByResource[resId].add(toDateStr(new Date(d)));
            }
        }
        const filteredResources = allResources.filter((resource) => {
            const busyDates = busyDatesByResource[resource.id] || new Set();
            return rangeDates.some((date) => !busyDates.has(date));
        });

        setResources(filteredResources);
    };
    const handleAddEvent = async (fields) => {
        console.log(fields)
        return
        const startToSend = getDateTimeString(newEventStart, fields.startTime);
        const endToSend = getDateTimeString(newEventEnd, fields.endTime);
        const specialDaysCount = getSpecialDaysCount(newEventStart, newEventEnd, holidays);
        let daysCount = (getDaysDifference(newEventStart, newEventEnd) || 1);
        let daysCount2 = (getDaysDifference(newEventStart, newEventEnd) || 1);
        if (selectedProduct.UF_CRM_1754312563154) {
            daysCount = daysCount - specialDaysCount
        }
        let regularPrice = selectedProduct.opportunity * daysCount;
        const specialPrice = specialDaysCount * (parseInt(selectedProduct.UF_CRM_1754312563154) || 0);
        const totalPrice = regularPrice + specialPrice;
        const hasOverlap = events.some(ev => {
            if (+selectedProduct.ID !== +ev.product.ID) return false;
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
                daysCount2,
                selectedProduct.id,
                flatFields,
                totalPrice,
                isAdmin ? user.ID : `contact_${user.ID}`,
                isAdmin,
                    isAdmin ? user.ID : 22,
                (totalPrice) - flatFields.UF_CRM_1749559223646
            );
            console.log(deal)
            await sendAction({
                action: 'ADD',
                dealId: deal
            })
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
        let daysCount = getDaysDifference(new Date(eventToShow.UF_CRM_1749479675960), (new Date(eventToShow.UF_CRM_1749479687467))) || 1;
        let daysCount2 = getDaysDifference(new Date(eventToShow.UF_CRM_1749479675960), (new Date(eventToShow.UF_CRM_1749479687467))) || 1;
        const specialDaysCount = getSpecialDaysCount(new Date(eventToShow.UF_CRM_1749479675960), (new Date(eventToShow.UF_CRM_1749479687467)), holidays);
        if (selectedProduct.UF_CRM_1754312563154) {
            daysCount = daysCount - specialDaysCount
        }
        let regularPrice = selectedProduct.opportunity * daysCount;
        const specialPrice = specialDaysCount * (parseInt(selectedProduct.UF_CRM_1754312563154) || 0);
        const totalPrice = regularPrice + specialPrice;
        try {
            const flatFields = flattenFormData(fields);
            await updateDeal(
                eventToShow.ID,
                startToSend,
                endToSend,
                daysCount2,
                flatFields,
                totalPrice,
                (totalPrice) - flatFields.UF_CRM_1749559223646,
            );
            await sendAction({
                action: 'UPDATE',
                dealId: eventToShow.ID
            })
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
        await sendAction({
            action: 'UPDATE',
            dealId: id
        })
        setEventToShow(null)
        setDeleteLoading(false)
    };
    useEffect(() => {
        const filtered = events.filter((e) => selectedUsers.some((u) => +u.id === +e.ASSIGNED_BY_ID));
        setFilteredEvents(filtered);
    }, [selectedUsers, events]);
    const handleClearFreeDays = () => {
        setFreeDays([]);
        setResources(allResources);
    };

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
                boxShadow: 'rgba(0, 0, 0, 0.2) 0px 2px 5px',
                borderRadius: '3px',
                padding: '2px'
            }} className="reserved-dot">{arg.event._def.title}</div>
        );
    }

    return (
        <>
            <Toast ref={toast}/>
            {secondLoading && <Overlay/>}
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
                {isAdmin && (
                    <div className='flex gap-3 align-items-center'>
                        <Calendar
                            value={freeDays}
                            onChange={(e) => setFreeDays(e.value)}
                            selectionMode='range'
                            placeholder='Ազատ գույքեր'
                        />
                        <Button disabled={freeDays.length !== 2} onClick={handleFilterFreeDays} label='Փնտրել'/>
                        <Button disabled={freeDays.length !== 2} onClick={handleClearFreeDays} label='Մարքրել'/>
                    </div>
                )}
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
                    allUsers={allUsers}
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
                holidays={holidays}
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
            <div>
                <FullCalendar
                    eventDisplay="block"
                    datesSet={(info) => {
                        const newDate = moment(info.start).format('YYYY-MM-DD');
                        const currentDate = moment(selectedDate).format('YYYY-MM-DD');

                        if (newDate !== currentDate) {
                            setSelectedDate(info.start);
                        }
                    }}
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
                    dateClick={(info) => {
                        if (width > 768) return;

                        setNewEventStart(info.date);
                        setNewEventEnd(info.date);

                        if (isAdmin) {
                            setSelectedProduct({
                                ...info.resource?._resource?.extendedProps,
                                title: info.resource?._resource?.title,
                                id: info.resource?._resource?.id
                            });
                        } else {
                            setSelectedProduct(selectedResource);
                        }

                        setAddModalVisible(true);
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
                        setSelectedProduct(info.event._def.extendedProps.product)
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
