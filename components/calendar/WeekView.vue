<template>
  <div class="week-view">
    <!-- 요일 헤더 -->
    <div class="week-header">
      <div
        v-for="(day, i) in calStore.currentWeekDays"
        :key="i"
        class="week-col-header"
        :class="{ 'is-today': isToday(day) }"
      >
        <span class="dow">{{ DOW_LABELS[i] }}</span>
        <span class="date-num" :class="{ 'today-badge': isToday(day) }">
          {{ day.getDate() }}
        </span>
      </div>
    </div>

    <!-- 이벤트 영역 -->
    <div class="week-body">
      <div
        v-for="(day, i) in calStore.currentWeekDays"
        :key="i"
        class="week-col"
        :class="{ 'is-today': isToday(day), 'is-weekend': i >= 5 }"
        @click="$emit('add', day)"
      >
        <div class="col-events">
          <div
            v-for="event in calStore.getWeekEventsForDate(day)"
            :key="event.id"
            class="week-event"
            :style="{ borderLeftColor: event.color, background: event.color + '18' }"
            @click.stop="$emit('edit', event)"
          >
            <span class="event-dot" :style="{ background: event.color }" />
            <div class="event-info">
              <p class="event-title">{{ event.title }}</p>
              <p v-if="event.memo" class="event-memo">{{ event.memo }}</p>
            </div>
          </div>
        </div>

        <!-- 빈 날: 추가 유도 -->
        <div class="col-add-hint">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCalendarStore } from '~/stores/calendar'
import type { CalendarEvent } from '~/stores/calendar'

defineEmits<{ add: [date: Date]; edit: [event: CalendarEvent] }>()

const calStore = useCalendarStore()
const DOW_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
const today = new Date()

function isToday(date: Date) {
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  )
}
</script>

<style scoped lang="scss">
.week-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.week-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.week-col-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 0;
  gap: 4px;
  border-right: 1px solid var(--color-border);
  &:last-child { border-right: none; }

  .dow {
    font-size: 11px;
    font-weight: 600;
    color: var(--color-text-muted);
    letter-spacing: 0.5px;
  }

  .date-num {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    font-weight: 600;
    color: var(--color-text);
    border-radius: 50%;

    &.today-badge {
      background: var(--color-primary);
      color: #fff;
    }
  }

  &.is-today .dow { color: var(--color-primary); }
}

.week-body {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  overflow-y: auto;
  align-items: start;
}

.week-col {
  min-height: 100%;
  border-right: 1px solid var(--color-border);
  padding: 8px 6px;
  cursor: pointer;
  transition: background 0.1s;
  display: flex;
  flex-direction: column;
  gap: 6px;

  &:last-child { border-right: none; }
  &:hover { background: #f8f9ff; }
  &:hover .col-add-hint { opacity: 1; }
  &.is-today { background: #f0f3ff; }
  &.is-weekend { background: #fafafa; }
  &.is-weekend.is-today { background: #f0f3ff; }
}

.col-events {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.week-event {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 7px 8px;
  border-left: 3px solid;
  border-radius: 0 6px 6px 0;
  cursor: pointer;
  transition: opacity 0.1s;

  &:hover { opacity: 0.75; }
}

.event-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 4px;
}

.event-info {
  flex: 1;
  min-width: 0;
}

.event-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.event-memo {
  font-size: 11px;
  color: var(--color-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 2px;
}

.col-add-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.1s;
  padding: 4px;

  svg {
    width: 16px;
    height: 16px;
    color: var(--color-text-muted);
  }
}
</style>
