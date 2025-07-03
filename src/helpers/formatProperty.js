export const formatProperty = (input) => {
    return Object.values(input).map(item => ({
        id: Number(item.ID),
        label: item.VALUE
    }))
}