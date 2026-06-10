export const getEventColor = (value,hasNight) => {
    if (hasNight) {
        return "#8E44AD"
    }
    switch (value){
        case '48': return '#8890FC'
        case '44': return '#C0392B'
        case '50': return '#1B4016'
        default: return '#F37805'
    }
}
