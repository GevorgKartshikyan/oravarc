import React, { useState } from 'react'
import { calculateBookingPrice, formatDateArm } from '../helpers/calculatePrice'

const DAY_NAMES_ARM = ['Կիր', 'Երկ', 'Երք', 'Չոր', 'Հնգ', 'Ուրբ', 'Շբթ']

export default function PriceSummary({ eventStart, eventEnd, persons, productInfo,formData }) {
    const [expanded, setExpanded] = useState(false)

    if (!eventStart || !eventEnd || !productInfo) return null
    const hasNight = formData?.UF_CRM_1751462672002?.ID === "558"
    const { days, nights, totalPrice, totalNight, grandTotal, } =
        calculateBookingPrice(eventStart, eventEnd, persons, productInfo,hasNight)

    const hasRules = (() => {
        try {
            const raw = productInfo?.rules
            return raw &&  Array.isArray(raw) && raw.length > 0
        } catch { return false }
    })()
    // Check if all days have same price (simple display)
    const allSamePrice = days.every(d => d.price === days[0]?.price && d.nightSurcharge === days[0]?.nightSurcharge)
    return (
        <div className="price-summary">
            {/* Header totals */}
            <div className="ps-header">
                <div className="ps-title-row">
          <span className="ps-label">
            {nights} {nights === 1 ? 'գիշեր' : 'գիշեր'} · {persons || 1} հոգի
          </span>
                    <span className="ps-grand">{grandTotal.toLocaleString()} ֏</span>
                </div>

                <div className="ps-breakdown-row">
                    <div className="ps-item">
                        <span className="ps-item-label">Օրավարձ</span>
                        <span className="ps-item-value">{totalPrice.toLocaleString()} ֏</span>
                    </div>
                    {totalNight > 0 && (
                        <div className="ps-item">
                            <span className="ps-item-label">Գիշերակաց</span>
                            <span className="ps-item-value">+{totalNight.toLocaleString()} ֏</span>
                        </div>
                    )}
                </div>

                {/* Toggle per-day detail */}
                {(!allSamePrice || hasRules) &&  (
                    <button
                        className="ps-toggle"
                        onClick={() => setExpanded(v => !v)}
                    >
                        {expanded ? '▲ Թաքցնել մանրամասն' : '▼ Ցուցադրել ըստ օրերի'}
                    </button>
                )}
            </div>

            {/* Per-day table */}
            {expanded && (
                <div className="ps-days">
                    <div className="ps-days-header">
                        <span>Ամսաթիվ</span>
                        <span>Սեզոն</span>
                        <span className="text-right">Օրավարձ</span>
                        <span className="text-right">Գիշ.</span>
                    </div>
                    {days.map((d, i) => (
                        <div key={i} className={`ps-day-row ${d.seasonName ? 'has-season' : ''}`}>
              <span className="ps-day-date">
                <span className="ps-weekday">{DAY_NAMES_ARM[d.date.getDay()]}</span>
                  {formatDateArm(d.date)}
              </span>
                            <span className="ps-season-name">{d.seasonName || '—'}</span>
                            <span className="ps-day-price text-right">{d.price.toLocaleString()} ֏</span>
                            <span className="ps-day-night text-right">
                {d.nightSurcharge > 0 ? `+${d.nightSurcharge.toLocaleString()} ֏` : '—'}
              </span>
                        </div>
                    ))}
                    <div className="ps-days-total">
                        <span>Ընդամենը</span>
                        <span />
                        <span className="text-right">{totalPrice.toLocaleString()} ֏</span>
                        <span className="text-right">
              {totalNight > 0 ? `+${totalNight.toLocaleString()} ֏` : '—'}
            </span>
                    </div>
                </div>
            )}

            {/* Source tag */}
            <div className="ps-source">
                {hasRules
                    ? '📋 Սեզոնային կանոններով'
                    : '📌 Default գնով'}
            </div>
        </div>
    )
}
