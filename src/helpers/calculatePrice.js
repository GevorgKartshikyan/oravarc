/**
 * Calculates the total price for a booking based on season rules.
 *
 * productInfo fields:
 *   OPPORTUNITY          – default daily price
 *   UF_CRM_1778739878015 – default night surcharge
 *   UF_CRM_1781007389884 – JSON string of season rules
 *
 * ruleType:
 *   "by_day"     – price per weekday
 *   "by_persons" – price per person-count range
 *   "mix"        – weekday × person-count range
 */

const DAY_MAP = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

/**
 * Parse a "YYYY-MM-DD" string as LOCAL midnight (not UTC midnight).
 * Avoids the classic off-by-one when the server sends bare date strings.
 */
function parseLocalDate(str) {
    if (!str) return null
    // "2026-07-12" → [2026, 7, 12] → new Date(2026, 6, 12)  (month is 0-based)
    const [y, m, d] = String(str).split('-').map(Number)
    return new Date(y, m - 1, d)
}

/**
 * Returns the season whose [startDate, endDate] contains the given date.
 * If multiple seasons match, the first one wins.
 */
function findSeasonForDate(rules, date) {
    if (!rules || !rules.length) return null
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)

    return rules.find(season => {
        if (!season.startDate || !season.endDate) return false
        // Parse as LOCAL dates so "2026-07-12" means Jul 12 in the user's timezone
        const start = parseLocalDate(season.startDate)
        const end = parseLocalDate(season.endDate)
        end.setHours(23, 59, 59, 999)
        return d >= start && d <= end
    }) || null
}

/**
 * Get price for a single day given the season rule and person count.
 * Returns { price, nightSurcharge }
 */
function getPriceForDay(season, date, persons, defaultPrice, defaultNight) {
    const dayKey = DAY_MAP[new Date(date).getDay()]

    if (season.ruleType === 'by_day') {
        const rule = (season.dayRules || []).find(r => r.day === dayKey)
        if (rule) {
            return {
                price: rule.price ?? defaultPrice,
                nightSurcharge: rule.nightSurcharge ?? defaultNight
            }
        }
    }

    if (season.ruleType === 'by_persons') {
        const p = Number(persons) || 1
        const range = (season.personRanges || []).find(r => p >= r.min && p < r.max)
        if (range) {
            const extra = p > range.min ? (p - range.min) * (range.extraPerPerson || 0) : 0
            return {
                price: (range.price ?? defaultPrice) + extra,
                nightSurcharge: range.nightSurcharge ?? defaultNight
            }
        }
        // If no range matches, use last range's price + extraPerPerson for overflow
        const last = season.personRanges?.[season.personRanges.length - 1]
        if (last) {
            const extra = (p - last.max) * (last.extraPerPerson || 0);
            return {
                price: (last.price ?? defaultPrice) + extra,
                nightSurcharge: last.nightSurcharge ?? defaultNight
            }
        }
    }

    if (season.ruleType === 'mix') {
        const inSelectedDays = (season.mixDays || []).includes(dayKey)
        if (inSelectedDays) {
            const p = Number(persons) || 1
            const range = (season.mixRanges || []).find(r => p >= r.min && p <= r.max)
            if (range) {
                const extra = p > range.min ? (p - range.min) * (range.extraPerPerson || 0) : 0
                return {
                    price: (range.price ?? defaultPrice) + extra,
                    nightSurcharge: range.nightSurcharge ?? defaultNight
                }
            }
        }
        // days not in mixDays → fall through to default
    }

    return { price: defaultPrice, nightSurcharge: defaultNight }
}

/**
 * Main function: calculates breakdown per day and totals.
 *
 * @param {string|Date} startDate   – check-in date
 * @param {string|Date} endDate     – check-out date
 * @param {number}      persons     – number of guests
 * @param {object}      productInfo – deal fields
 * @param {boolean}     hasNight    – true when UF_CRM_1751462672002.ID === "558"
 *                                    (overnight stay: count endDate as an extra night)
 * @returns {{ days, nights, totalPrice, totalNight, grandTotal }}
 */
export function calculateBookingPrice(startDate, endDate, persons, productInfo, hasNight = false) {
    const defaultPrice = Number(productInfo?.OPPORTUNITY || productInfo?.opportunity) || 0
    const defaultNight = Number(productInfo?.UF_CRM_1778739878015) || 0

    const rules = productInfo?.rules || []
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)

    const end = new Date(endDate)
    end.setHours(0, 0, 0, 0)

    // Base nights = calendar days between start and end
    let nights = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)))

    // If overnight option is active, add one more night (endDate counts as a stay night)
    if (hasNight) nights += 1

    const days = []
    let totalPrice = 0
    let totalNight = 0

    for (let i = 0; i < nights; i++) {
        const current = new Date(start)
        current.setDate(start.getDate() + i)

        const season = findSeasonForDate(rules, current);
        let price, nightSurcharge, seasonName

        if (season) {
            const result = getPriceForDay(season, current, persons, defaultPrice, defaultNight)
            price = result.price
            nightSurcharge = result.nightSurcharge
            seasonName = season.name
        } else {
            price = defaultPrice
            nightSurcharge = defaultNight
            seasonName = null
        }

        totalPrice += price
        totalNight += nightSurcharge
        days.push({ date: new Date(current), price, nightSurcharge, seasonName })
    }

    return { days, nights, totalPrice, totalNight, grandTotal: totalPrice + totalNight }
}

/**
 * Format date as "5 հուլ." in Armenian
 */
export function formatDateArm(date) {
    return new Date(date).toLocaleDateString('hy-AM', { day: 'numeric', month: 'short' })
}
