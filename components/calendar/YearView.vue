<template>
  <div class="year-view">
    <div
      v-for="(month, mi) in months"
      :key="mi"
      class="mini-month"
      :class="{ 'is-current-month': isCurrentMonth(mi) }"
      @click="goToMonth(mi)"
    >
      <div class="mini-month-title">{{ month }}</div>

      <!-- 요일 헤더 -->
      <div class="mini-grid-header">
        <span v-for="d in ['M','T','W','T','F','S','S']" :key="d">{{ d }}</span>
      </div>

      <!-- 날짜 그리드 -->
      <div class="mini-grid-body">
        <div
          v-for="(cell, ci) in getMonthCells(mi)"
          :key="ci"
          class="mini-cell"
          :class="{
            'other-month': !cell.currentMonth,
            'is-today': isTodayCell(cell.date),
            'has-event': hasEvent(cell.date),
          }"
        >
          <span>{{ cell.date.getDate() }}</span>
          <span v-if="hasEvent(cell.date)" class="event-dot" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCalendarStore } from '~/stores/calendar'

const calStore = useCalendarStore()
const today = new Date()

const months = [
  'January','February','March','April',
  'May','June','July','August',
  'September','October','November','December',
]

function getMonthCells(monthIndex: number) {
  const year = calStore.currentYear
  const firstDay = new Date(year, monthIndex, 1)
  const lastDay = new Date(year, monthIndex + 1, 0)

  let offset = firstDay.getDay()
  offset = offset === 0 ? 6 : offset - 1

  const cells: { date: Date; currentMonth: boolean }[] = []

  for (let i = offset - 1; i >= 0; i--)
    cells.push({ date: new Date(year, monthIndex, -i), currentMonth: false })

  for (let d = 1; d <= lastDay.getDate(); d++)
    cells.push({ date: new Date(year, monthIndex, d), currentMonth: true })

  // 6주 고정
  while (cells.length < 42)
    cells.push({ date: new Date(year, monthIndex + 1, cells.length - lastDay.getDate() - offset + 1), currentMonth: false })

  return cells
}

function isTodayCell(date: Date) {
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  )
}

function isCurrentMonth(mi: number) {
  const now = new Date()
  return calStore.currentYear === now.getFullYear() && mi === now.getMonth()
}

function hasEvent(date: Date) {
  const str = calStore.formatDate(date)
  return calStore.events.some(e =>
    e.start_date === str &&
    (calStore.selectedMemberIds.size === 0 || calStore.selectedMemberIds.has(e.created_by)),
  )
}

function goToMonth(mi: number) {
  calStore.currentMonth = mi
  calStore.currentView = 'month'
}
</script>

<style scoped lang="scss">
.year-view {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  overflow-y: auto;
  padding: 16px;
}

.mini-month {
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 12px;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;

  &:hover {
    border-color: var(--color-primary);
    box-shadow: 0 2px 12px rgba(71, 99, 228, 0.1);
  }

  &.is-current-month {
    border-color: var(--color-primary);
    background: #f5f7ff;
  }
}

.mini-month-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 8px;
}

.mini-grid-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 4px;

  span {
    text-align: center;
    font-size: 10px;
    font-weight: 600;
    color: var(--color-text-muted);
  }
}

.mini-grid-body {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
}

.mini-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
  border-radius: 4px;
  position: relative;

  span:first-child {
    font-size: 10px;
    color: var(--color-text);
    line-height: 1;
  }

  &.other-month span:first-child { color: var(--color-text-placeholder); }

  &.is-today {
    span:first-child {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 18px;
      height: 18px;
      background: var(--color-primary);
      color: #fff;
      border-radius: 50%;
      font-weight: 700;
    }
  }
}

.event-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--color-primary);
  position: absolute;
  bottom: 1px;
}
</style>
