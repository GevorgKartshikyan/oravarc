import moment from "moment";
import {getEventColor} from "./getEventColor.js";

export const formatEvents = (allDeals,allSmartProcess) => {
    return allDeals.map((e)=>{
        const product = allSmartProcess.find((pr)=>+pr.ID===+e?.UF_CRM_1751522804);
        return {
            ...e,
            product,
            resourceId: product?.ID,
            start: moment(e.UF_CRM_1749479675960).format('YYYY-MM-DDTHH:mm:ss'),
            end: moment(e.UF_CRM_1749479687467).format('YYYY-MM-DDTHH:mm:ss'),
            backgroundColor: getEventColor(e.UF_CRM_1749479746448 , e.UF_CRM_1751462672002 === "558"),
            borderColor: getEventColor(e.UF_CRM_1749479746448 , e.UF_CRM_1751462672002 === "558"),
            color: getEventColor(e.UF_CRM_1749479746448, e.UF_CRM_1751462672002 === "558"),
        }
    }).filter((e)=>e.product)
}
