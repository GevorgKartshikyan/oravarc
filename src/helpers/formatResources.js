export const formatResources = (allSmartProcess, allContacts) => {
    const contactsMap = new Map(
        allContacts.map(contact => [+contact.ID, contact])
    );
    return allSmartProcess.map(item => {
        const contactId = item.contactId
        const contact = contactsMap.get(contactId);
        return {
            ...item,
            contact,
        };
    });
};
