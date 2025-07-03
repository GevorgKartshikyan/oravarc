export const formatResources = (allSmartProcess, allContacts) => {
    const contactsMap = new Map(
        allContacts.map(contact => [+contact.ID, contact])
    );
    return allSmartProcess.map(item => {
        const contactId = item.CONTACT_ID;
        const contact = contactsMap.get(contactId);
        return {
            ...item,
            title: item.TITLE,
            id: item.ID,
            opportunity: item.OPPORTUNITY,
            contact,
        };
    });
};
