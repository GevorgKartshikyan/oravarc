import moment from "moment";
import {getEventColor} from "./getEventColor.js";

export const formatEvents = (allDeals,allSmartProcess) => {
    return allDeals.map((e)=>{
        const product = allSmartProcess.find((pr)=>+pr.id===+e.PARENT_ID_1036);
        return {
            ...e,
            product,
            resourceId: product?.id,
            start: moment(e.UF_CRM_1749479675960).format('YYYY-MM-DDTHH:mm:ss'),
            end: moment(e.UF_CRM_1749479687467).format('YYYY-MM-DDTHH:mm:ss'),
            backgroundColor: getEventColor(e.UF_CRM_1749479746448),
            borderColor: getEventColor(e.UF_CRM_1749479746448),
            color: getEventColor(e.UF_CRM_1749479746448),
        }
    }).filter((e)=>e.product)
}
