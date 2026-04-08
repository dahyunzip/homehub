<template>
  <div class="calendar-page">

    <!-- 좌측 패널 -->
    <aside class="cal-panel">
      <section class="panel-section">
        <h3 class="panel-title">구성원</h3>
        <ul class="member-list">
          <li
            v-for="member in calStore.members"
            :key="member.id"
            class="member-item"
            @click="calStore.toggleMember(member.id)"
          >
            <div class="member-avatar" :style="{ background: member.color }">
              {{ member.name.charAt(0) }}
            </div>
            <span class="member-name">{{ member.name }}</span>
            <div
              class="member-check"
              :style="calStore.selectedMemberIds.has(member.id)
                ? { background: member.color, borderColor: member.color }
                : {}"
            >
              <svg v-if="calStore.selectedMemberIds.has(member.id)" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </li>
          <li v-if="calStore.members.length === 0" class="member-empty">
            그룹에 멤버를 초대해보세요
          </li>
        </ul>
      </section>
    </aside>

    <!-- 우측 캘린더 영역 -->
    <div class="cal-main">

      <!-- 캘린더 헤더 -->
      <div class="cal-header">
        <div class="cal-nav">
          <button class="nav-arrow" @click="handlePrev">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <button class="btn-today" @click="calStore.goToday">Today</button>
          <button class="nav-arrow" @click="handleNext">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>

        <h2 class="cal-title">{{ currentLabel }}</h2>

        <div class="cal-view-tabs">
          <button
            v-for="v in views"
            :key="v.key"
            class="view-tab"
            :class="{ active: calStore.currentView === v.key }"
            @click="switchView(v.key)"
          >{{ v.label }}</button>
        </div>
      </div>

      <!-- Month 뷰 -->
      <template v-if="calStore.currentView === 'month'">
        <div class="cal-grid">
          <div class="grid-header">
            <div v-for="d in ['MON','TUE','WED','THU','FRI','SAT','SUN']" :key="d" class="grid-dow">{{ d }}</div>
          </div>
          <div class="grid-body">
            <div v-for="(week, wi) in calStore.calendarWeeks" :key="wi" class="grid-week">
              <div
                v-for="(cell, di) in week"
                :key="di"
                class="grid-cell"
                :class="{
                  'other-month': !cell.currentMonth,
                  'is-today': isToday(cell.date),
                  'is-weekend': di >= 5,
                }"
                @click="openCreateModal(cell.date)"
              >
                <span class="cell-date" :class="{ 'today-badge': isToday(cell.date) }">
                  {{ cell.date.getDate() }}
                </span>
                <div class="cell-events">
                  <div
                    v-for="event in calStore.getEventsForDate(cell.date)"
                    :key="event.id"
                    class="event-bar"
                    :style="{ borderLeftColor: event.color, background: event.color + '18' }"
                    :title="event.title"
                    @click.stop="openEditModal(event)"
                  >
                    <span class="event-who">{{ event.creator_name?.charAt(0) }}</span>
                    {{ event.title }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Week 뷰 -->
      <CalendarWeekView
        v-else-if="calStore.currentView === 'week'"
        @add="openCreateModal"
        @edit="openEditModal"
      />

      <!-- Year 뷰 -->
      <CalendarYearView v-else-if="calStore.currentView === 'year'" />

    </div>

    <!-- 일정 추가/수정 모달 -->
    <CalendarEventModal
      v-if="modalOpen"
      :event="editingEvent"
      :default-date="selectedDate"
      @close="modalOpen = false"
      @saved="onSaved"
    />

  </div>
</template>

<script setup lang="ts">
import { useCalendarStore } from '~/stores/calendar'
import type { CalendarEvent } from '~/stores/calendar'

const calStore = useCalendarStore()

const views = [
  { key: 'week' as const, label: 'Week' },
  { key: 'month' as const, label: 'Month' },
  { key: 'year' as const, label: 'Year' },
]

// 뷰별 헤더 타이틀
const currentLabel = computed(() => {
  if (calStore.currentView === 'week') return calStore.currentWeekLabel
  if (calStore.currentView === 'year') return String(calStore.currentYear)
  return calStore.currentMonthLabel
})

// 뷰별 prev/next
function handlePrev() {
  if (calStore.currentView === 'week') calStore.prevWeek()
  else if (calStore.currentView === 'year') calStore.currentYear--
  else calStore.prevMonth()
}
function handleNext() {
  if (calStore.currentView === 'week') calStore.nextWeek()
  else if (calStore.currentView === 'year') calStore.currentYear++
  else calStore.nextMonth()
}

// 뷰 전환 시 데이터 fetch
function switchView(key: 'month' | 'week' | 'year') {
  calStore.currentView = key
  if (key === 'week') calStore.fetchWeekEvents()
  else if (key === 'year') calStore.fetchYearEvents()
  else calStore.fetchEvents()
}

// 모달 상태
const modalOpen = ref(false)
const editingEvent = ref<CalendarEvent | null>(null)
const selectedDate = ref('')

function openCreateModal(date: Date) {
  editingEvent.value = null
  selectedDate.value = calStore.formatDate(date)
  modalOpen.value = true
}

function openEditModal(event: CalendarEvent) {
  editingEvent.value = event
  selectedDate.value = event.start_date
  modalOpen.value = true
}

function onSaved() {
  if (calStore.currentView === 'week') calStore.fetchWeekEvents()
  else calStore.fetchEvents()
}

const today = new Date()
function isToday(date: Date) {
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  )
}

onMounted(() => {
  calStore.fetchMembers()
  calStore.fetchEvents()
})

watch([() => calStore.currentYear, () => calStore.currentMonth], () => {
  if (calStore.currentView === 'month') calStore.fetchEvents()
})

watch(() => calStore.weekAnchor, () => {
  if (calStore.currentView === 'week') calStore.fetchWeekEvents()
})
</script>

<style scoped lang="scss">
.calendar-page {
  display: flex;
  gap: 20px;
  height: calc(100vh - 60px - 56px);
  min-height: 0;
}

/* ── 좌측 패널 ── */
.cal-panel {
  width: 210px;
  flex-shrink: 0;
}

.panel-section {
  background: #fff;
  border-radius: 12px;
  padding: 18px 16px;
  border: 1px solid var(--color-border);
}

.panel-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-muted);
  margin-bottom: 12px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.member-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.12s;
  &:hover { background: var(--color-bg-hover); }
}

.member-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}

.member-name {
  flex: 1;
  font-size: 13px;
  color: var(--color-text);
}

.member-check {
  width: 18px;
  height: 18px;
  border-radius: 5px;
  border: 2px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.12s, border-color 0.12s;
  svg { width: 10px; height: 10px; }
}

.member-empty {
  font-size: 12px;
  color: var(--color-text-muted);
  padding: 8px 0;
  text-align: center;
}

/* ── 캘린더 메인 ── */
.cal-main {
  flex: 1;
  background: #fff;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

.cal-header {
  display: flex;
  align-items: center;
  padding: 14px 20px;
  border-bottom: 1px solid var(--color-border);
  gap: 14px;
  flex-shrink: 0;
}

.cal-nav {
  display: flex;
  align-items: center;
  gap: 4px;
}

.nav-arrow {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  cursor: pointer;
  color: var(--color-text-muted);
  transition: background 0.12s;
  svg { width: 14px; height: 14px; }
  &:hover { background: var(--color-bg-hover); }
}

.btn-today {
  height: 28px;
  padding: 0 12px;
  background: none;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text);
  cursor: pointer;
  transition: background 0.12s;
  &:hover { background: var(--color-bg-hover); }
}

.cal-title {
  flex: 1;
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text);
}

.cal-view-tabs {
  display: flex;
  background: var(--color-bg-hover);
  border-radius: 8px;
  padding: 3px;
}

.view-tab {
  height: 26px;
  padding: 0 12px;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-muted);
  background: none;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
  &.active {
    background: #fff;
    color: var(--color-text);
    font-weight: 600;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  }
}

/* ── 그리드 ── */
.cal-grid {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.grid-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.grid-dow {
  padding: 8px 0;
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-muted);
  letter-spacing: 0.5px;
}

.grid-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.grid-week {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  flex: 1;
  border-bottom: 1px solid var(--color-border);
  &:last-child { border-bottom: none; }
}

.grid-cell {
  border-right: 1px solid var(--color-border);
  padding: 5px 6px;
  overflow: hidden;
  cursor: pointer;
  transition: background 0.1s;

  &:last-child { border-right: none; }
  &:hover { background: #f8f9ff; }
  &.other-month { background: #fafafa; }
  &.other-month .cell-date { color: var(--color-text-placeholder); }
  &.is-weekend:not(.other-month) .cell-date { color: #e05c5c; }
  &.is-today { background: #f0f3ff; }
}

.cell-date {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text);
  border-radius: 50%;
  margin-bottom: 3px;

  &.today-badge {
    background: var(--color-primary);
    color: #fff;
    font-weight: 700;
  }
}

.cell-events {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.event-bar {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--color-text-sub);
  border-left: 3px solid;
  padding: 2px 5px;
  border-radius: 0 4px 4px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  transition: opacity 0.1s;
  &:hover { opacity: 0.75; }
}

.event-who {
  font-size: 10px;
  font-weight: 700;
  opacity: 0.7;
  flex-shrink: 0;
}
</style>
