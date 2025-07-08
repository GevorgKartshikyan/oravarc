import axios from "axios";

const REACT_APP_BASE_URL = import.meta.env.VITE_API_URL_BX
const BATCH_SIZE = 50;
const fetchDealCount = async (categoryId) => {
    const response = await axios.post(`${REACT_APP_BASE_URL}/crm.deal.list.json`, {
        select: ['ID'],
        filter: {
            CATEGORY_ID: categoryId
        }
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
export const fetchAllDeals = async (categoryId) => {
    const totalLeads = await fetchDealCount(categoryId);
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
                const select = ["ID", 'TITLE', "UF_*", 'CATEGORY_ID', "*"];
                const selectStr = select.map(id => `select[]=${id}`).join('&');
                acc[`req_${idx}`] = `${req.method}?start=${req.params.start}${selectStr}&filter[CATEGORY_ID]=${categoryId}`;
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
    return allContacts.map((e) => {
        return {
            ...e,
            FULL_NAME: e.NAME || '' + ' ' + e.LAST_NAME || '',
            PHONE: e.PHONE ? e.PHONE[0].VALUE : '',
            PHONES: e.PHONE
        }
    });
};
const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });
};
export const uploadFile = async (fileName, file) => {
    const base64 = await fileToBase64(file);
    const {data} = await axios.post(`${REACT_APP_BASE_URL}/disk.storage.uploadFile.json`, {
        id: 3,
        data: {
            NAME: fileName
        },
        fileContent: base64.split(',')[1],
        generateUniqueName: true
    }, {
        headers: {
            'Content-Type': 'multipart/form-data',
        }
    })
    return data.result.ID
}
export const addDeal = async (start, end, daysCount, productId, ufs, opportunity, creator, is_admin, assigned, remainder) => {
    const files = [];
    if (ufs.UF_CRM_1751885344112) {
        for (const item of ufs.UF_CRM_1751885344112) {
            const base64 = await fileToBase64(item);
            files.push(item.name , base64.split(',')[1]);
        }
    }
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
            UF_CRM_1751522804:productId,
            ...ufs,
            OPPORTUNITY:opportunity,
            CONTACT_ID:contact_id,
            UF_CRM_1749565990368:creator,
            ASSIGNED_BY_ID:assigned,
            UF_CRM_1750401051:remainder,
            UF_CRM_1751885344112:{
                fileData: files,
            }
        },
    });
    const {data:deal} = await axios.post(`${REACT_APP_BASE_URL}/crm.deal.get`, {
        id: dealId.result
    })
    return deal.result
};
export const updateDeal = async (id, start, end, daysCount, ufs, opportunity, remainder) => {
    const {data: dealId} = await axios.post(`${REACT_APP_BASE_URL}/crm.deal.update`, {
        id: id,
        fields: {
            UF_CRM_1749479687467: end,
            UF_CRM_1749479675960: start,
            UF_CRM_1749539216833: daysCount,
            ...ufs,
            OPPORTUNITY: opportunity,
            UF_CRM_1750401051: remainder
        },
    });
    const {data: deal} = await axios.post(`${REACT_APP_BASE_URL}/crm.deal.get`, {
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
    const {data} = await axios.post(`${REACT_APP_BASE_URL}/crm.deal.fields`, {
        select: ['*', 'TITLE', 'NAME']
    })
    return data.result
}
export const getDealUserFieldGet = async (id) => {
    const {data} = await axios.post(`${REACT_APP_BASE_URL}/crm.deal.userfield.get`, {
        id: id
    })
    return data.result
}
const fetchItemsCount = async (entity, isAdmin, user) => {
    const filter = {
        CATEGORY_ID: entity
    };
    if (!isAdmin) {
        filter['CONTACT_ID'] = user.ID
    }
    const response = await axios.post(`${REACT_APP_BASE_URL}/crm.deal.list.json`, {
        select: ['ID', 'CONTACT_ID'],
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

    const filter = {
        CATEGORY_ID: entity
    };
    if (!isAdmin) {
        filter['CONTACT_ID'] = user.ID;
    }

    while (start < totalItems) {
        const batchRequests = [];
        const requestsNeeded = Math.min(BATCH_SIZE, Math.ceil((totalItems - start) / BATCH_SIZE));

        for (let i = 0; i < requestsNeeded; i++) {
            const startIndex = start + i * BATCH_SIZE;
            const filterParams = Object.entries(filter)
                .map(([key, value]) => `filter[${key}]=${value}`)
                .join('&');

            const select = ["ID", "TITLE", "*", 'UF_*'];
            const selectStr = select.map(id => `select[]=${id}`).join('&');

            batchRequests.push({
                key: `req_${i}`,
                url: `crm.deal.list?start=${startIndex}&${filterParams}&${selectStr}`
            });
        }

        const cmd = batchRequests.reduce((acc, req) => {
            acc[req.key] = req.url;
            return acc;
        }, {});

        const batchResponse = await axios.post(`${REACT_APP_BASE_URL}/batch.json`, {cmd});

        if (batchResponse.data.error) {
            throw new Error(batchResponse.data.error_description);
        }

        const groupDeals = Object.values(batchResponse.data.result.result).flat();
        allItems = allItems.concat(groupDeals);
        if (groupDeals.length < requestsNeeded * BATCH_SIZE) {
            break;
        }
        start += requestsNeeded * BATCH_SIZE;
    }

    return allItems;
};

export const fetItemsFields = async () => {
    const {data} = await axios.post(`${REACT_APP_BASE_URL}/crm.item.fields`, {
        entityTypeId: 2,
    })
    return data.result.fields
}
export const deleteEvent = async (id) => {
    const {data} = await axios.post(`${REACT_APP_BASE_URL}/crm.deal.update`, {
        id,
        fields: {
            STAGE_ID: 'LOSE'
        },
    })
    return data.result
}
export const fetchContactByCode = async (code, phone) => {
    const {data} = await axios.post(`${REACT_APP_BASE_URL}/crm.contact.list`, {
        select: ['*', 'UF_CRM_1749826732273'],
        filter: {
            UF_CRM_1749826732273: code,
            PHONE: phone
        }
    })
    return data.result
}