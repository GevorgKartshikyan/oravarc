import axios from "axios";

const REACT_APP_BASE_URL = import.meta.env.VITE_API_URL_BX
const BATCH_SIZE = 50;
const fetchDealCount = async () => {
    const response = await axios.post(`${REACT_APP_BASE_URL}/crm.deal.list.json`, {
        select: ['ID'],
    });
    if (response.data.error) {
        throw new Error(response.data.error_description);
    }
    return response.data.total;
};
export const getAllUsers = async () => {
    const allUsers = [];
    let next = 0;
    let start = 0;
    while (next !== undefined) {
        const {data} = await axios.post(`${REACT_APP_BASE_URL}/user.get.json?start=${start}&select[]=*&filter[ACTIVE]=true`);
        const {next: nextStart, result} = data;

        if (result) {
            allUsers.push(...result);
        }
        next = nextStart;
        start = next;
    }
    return allUsers.map((e) => {
        return {
            id: +e.ID,
            title: (e.NAME || e.LAST_NAME) ? `${e.NAME || ''} ${e.LAST_NAME || ''}` : e.EMAIL,
        };
    })
};
export const fetchAllDeals = async (startDate, endDate) => {
    const totalLeads = await fetchDealCount(startDate, endDate);
    let allDeals = [];
    let start = 0;
    while (start < totalLeads) {
        const batchRequests = [];
        const requestsNeeded = Math.min(BATCH_SIZE, Math.ceil((totalLeads - start) / BATCH_SIZE));

        for (let i = 0; i < requestsNeeded; i++) {
            batchRequests.push({
                method: 'crm.deal.list',
                params: {
                    start: start + i * BATCH_SIZE,
                },

            });
        }
        const batchResponse = await axios.post(`${REACT_APP_BASE_URL}/batch.json`, {
            cmd: batchRequests.reduce((acc, req, idx) => {
                const select = ["ID", 'TITLE',"UF_*",, "*"];
                const selectStr = select.map(id => `select[]=${id}`).join('&');
                acc[`req_${idx}`] = `${req.method}?start=${req.params.start}${selectStr}`;
                return acc;
            }, {})
        });
        if (batchResponse.data.error) {
            throw new Error(batchResponse.data.error_description);
        }
        const groupDeals = Object.values(batchResponse.data.result.result).flat();
        allDeals = allDeals.concat(groupDeals);
        if (groupDeals.length < requestsNeeded * BATCH_SIZE) {
            break;
        }
        start += requestsNeeded * BATCH_SIZE;
    }
    return allDeals
};
const fetchContactCount = async () => {
    const response = await axios.post(`${REACT_APP_BASE_URL}/crm.contact.list`, {
        select: ['ID'],
    });
    if (response.data.error) {
        throw new Error(response.data.error_description);
    }
    return response.data.total;
};
export const fetchAllContacts = async () => {
    const totalDeals = await fetchContactCount();
    let allContacts = [];
    let start = 0;
    while (start < totalDeals) {
        const batchRequests = [];
        const requestsNeeded = Math.min(BATCH_SIZE, Math.ceil((totalDeals - start) / BATCH_SIZE));
        for (let i = 0; i < requestsNeeded; i++) {
            batchRequests.push({
                method: 'crm.contact.list',
                params: {
                    start: start + i * BATCH_SIZE,
                    select: ['ID', 'TITLE', 'UF_CRM_1744112456076', 'PHONE', "*"],

                },
            });
        }
        const batchResponse = await axios.post(`${REACT_APP_BASE_URL}/batch.json`, {
            cmd: batchRequests.reduce((acc, req, idx) => {
                const {select} = req.params;
                const selectStr = select.map(id => `select[]=${id}`).join('&');
                // const filterStr = Object.entries(req.params.filter)
                //     .map(([key, val]) => `filter[${key}]=${val}`)
                //     .join('&');
                acc[`req_${idx}`] = `${req.method}?start=${req.params.start}&${selectStr}`;
                return acc;
            }, {})
        });

        if (batchResponse.data.error) {
            throw new Error(batchResponse.data.error_description);
        }

        const groupContacts = Object.values(batchResponse.data.result.result).flat();
        allContacts = allContacts.concat(groupContacts);

        if (groupContacts.length < requestsNeeded * BATCH_SIZE) {
            break;
        }
        start += requestsNeeded * BATCH_SIZE;
    }
    return allContacts.map((e)=>{
        return {
            ...e,
            FULL_NAME: e.NAME || '' + ' ' + e.LAST_NAME || '',
            PHONE: e.PHONE ? e.PHONE[0].VALUE : '',
            PHONES:e.PHONE
        }
    });
};
export const addDeal = async (start, end, daysCount,productId,ufs,opportunity,creator,is_admin,assigned,remainder) => {
    let contact_id = ufs.CONTACT_ID
    if (!contact_id && is_admin && ufs.contact_phone && ufs.contact_name){
        const {data} = await axios.post(`${REACT_APP_BASE_URL}/crm.contact.add`, {
            fields: {
                NAME: ufs.contact_name,
                PHONE: ufs.contact_phone.map((e)=>{
                    return {
                        VALUE:'+'+e,
                    }
                })
            },
        });
        contact_id = data.result
    }
    const {data: dealId} = await axios.post(`${REACT_APP_BASE_URL}/crm.deal.add`, {
        fields: {
            UF_CRM_1749479687467: end,
            UF_CRM_1749479675960: start,
            UF_CRM_1749539216833: daysCount,
            PARENT_ID_1036:productId,
            ...ufs,
            OPPORTUNITY:opportunity,
            CONTACT_ID:contact_id,
            UF_CRM_1749565990368:creator,
            ASSIGNED_BY_ID:assigned,
            UF_CRM_1750401051:remainder
        },
    });
    const {data:deal} = await axios.post(`${REACT_APP_BASE_URL}/crm.deal.get`, {
        id: dealId.result
    })
    return deal.result
};
export const updateDeal = async (id,start, end, daysCount,ufs,opportunity,remainder) =>{
    const {data: dealId} = await axios.post(`${REACT_APP_BASE_URL}/crm.deal.update`, {
        id: id,
        fields: {
            UF_CRM_1749479687467: end,
            UF_CRM_1749479675960: start,
            UF_CRM_1749539216833: daysCount,
            ...ufs,
            OPPORTUNITY:opportunity,
            UF_CRM_1750401051:remainder
        },
    });
    const {data:deal} = await axios.post(`${REACT_APP_BASE_URL}/crm.deal.get`, {
        id: id
    })
    return deal.result
}
export const addSmartProcess = async (dealId) => {
    const {data} = await axios.post(`${REACT_APP_BASE_URL}/crm.item.add`, {
        entityTypeId: 1036,
        fields: {
            parentId2: dealId
        }
    })
    return data.result
}
export const getDeal = async (id) => {
    const {data} = await axios.post(`${REACT_APP_BASE_URL}/crm.deal.get`, {
        id
    })
    return data.result
}
export const getDealUserField = async () => {
    const {data} = await axios.post(`${REACT_APP_BASE_URL}/crm.deal.userfield.list`, {
        // id
    })
    return data.result
}
export const getDealUserFieldGet = async (id) => {
    const {data} = await axios.post(`${REACT_APP_BASE_URL}/crm.deal.userfield.get`, {
        id:id
    })
    return data.result
}
const fetchItemsCount = async (entity,isAdmin,user) => {
    const filter = {};
    if(!isAdmin){
        filter['contactId'] = user.ID
    }
    const response = await axios.post(`${REACT_APP_BASE_URL}/crm.item.list.json`, {
        entityTypeId: entity,
        select: ['ID','contactId'],
        filter
    });

    if (response.data.error) {
        throw new Error(response.data.error_description);
    }
    return response.data.total;
};
export const fetchAllItems = async (entity, isAdmin, user) => {
    const totalItems = await fetchItemsCount(entity, isAdmin, user);
    let allItems = [];
    let start = 0;

    const filter = {};
    if (!isAdmin) {
        filter['contactId'] = user.ID;
    }

    while (start < totalItems) {
        const batchRequests = [];
        const requestsNeeded = Math.min(BATCH_SIZE, Math.ceil((totalItems - start) / BATCH_SIZE));

        for (let i = 0; i < requestsNeeded; i++) {
            const startIndex = start + i * BATCH_SIZE;
            const filterParams = Object.entries(filter)
                .map(([key, value]) => `filter[${key}]=${value}`)
                .join('&');

            const select = ["ID", "TITLE", "*"];
            const selectStr = select.map(id => `select[]=${id}`).join('&');

            batchRequests.push({
                key: `req_${i}`,
                url: `crm.item.list?start=${startIndex}&entityTypeId=${entity}&${filterParams}&${selectStr}`
            });
        }

        const cmd = batchRequests.reduce((acc, req) => {
            acc[req.key] = req.url;
            return acc;
        }, {});

        const batchResponse = await axios.post(`${REACT_APP_BASE_URL}/batch.json`, { cmd });

        if (batchResponse.data.error) {
            throw new Error(batchResponse.data.error_description);
        }

        const result = batchResponse.data.result.result;
        const groupItems = Object.values(result).reduce((acc, current) => acc.concat(current.items), []);

        allItems = allItems.concat(groupItems);

        if (groupItems.length < requestsNeeded * BATCH_SIZE) {
            break;
        }

        start += requestsNeeded * BATCH_SIZE;
    }

    return allItems;
};

export const fetItemsFields = async () => {
    const {data} = await axios.post(`${REACT_APP_BASE_URL}/crm.item.fields`, {
        entityTypeId: 1036,
    })
    return data.result.fields
}
export const deleteEvent = async (id) => {
    const {data} = await axios.post(`${REACT_APP_BASE_URL}/crm.deal.update`, {
        id,
        fields: {
            STAGE_ID:'LOSE'
        },
    })
    return data.result
}
export const fetchContactByCode = async (code,phone) => {
    const {data} = await axios.post(`${REACT_APP_BASE_URL}/crm.contact.list`, {
        select: ['*','UF_CRM_1749826732273'],
        filter:{
            UF_CRM_1749826732273:code,
            PHONE:phone
        }
    })
    return data.result
}