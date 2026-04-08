import { defineStore } from 'pinia'

export interface CalendarEvent {
  id: string
  title: string
  memo: string | null
  start_date: string
  end_date: string | null
  created_by: string
  color: string
  creator_name: string
}

export interface Member {
  id: string
  name: string
  color: string
  avatar_url: string | null
}

export const useCalendarStore = defineStore('calendar', () => {
  const today = new Date()
  const currentYear = ref(today.getFullYear())
  const currentMonth = ref(today.getMonth()) // 0-indexed
  const currentView = ref<'month' | 'week' | 'year'>('month')

  const events = ref<CalendarEvent[]>([])
  const weekEvents = ref<CalendarEvent[]>([])
  const members = ref<Member[]>([])
  const selectedMemberIds = ref<Set<string>>(new Set())

  // ── 주간 뷰 ──
  const weekAnchor = ref(new Date(today))

  const currentWeekDays = computed(() => {
    const anchor = weekAnchor.value
    const dow = anchor.getDay()
    const offset = dow === 0 ? -6 : 1 - dow // 월요일 기준
    const monday = new Date(anchor)
    monday.setDate(monday.getDate() + offset)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      return d
    })
  })

  const currentWeekLabel = computed(() => {
    const days = currentWeekDays.value
    const s = days[0]; const e = days[6]
    const fmt = (d: Date) => d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
    return `${fmt(s)} – ${fmt(e)}, ${e.getFullYear()}`
  })

  function prevWeek() {
    const d = new Date(weekAnchor.value)
    d.setDate(d.getDate() - 7)
    weekAnchor.value = d
  }

  function nextWeek() {
    const d = new Date(weekAnchor.value)
    d.setDate(d.getDate() + 7)
    weekAnchor.value = d
  }

  const currentMonthLabel = computed(() => {
    const d = new Date(currentYear.value, currentMonth.value, 1)
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  })

  function prevMonth() {
    if (currentMonth.value === 0) {
      currentMonth.value = 11
      currentYear.value--
    } else {
      currentMonth.value--
    }
  }

  function nextMonth() {
    if (currentMonth.value === 11) {
      currentMonth.value = 0
      currentYear.value++
    } else {
      currentMonth.value++
    }
  }

  function goToday() {
    currentYear.value = today.getFullYear()
    currentMonth.value = today.getMonth()
    weekAnchor.value = new Date(today)
  }

  function toggleMember(id: string) {
    if (selectedMemberIds.value.has(id)) {
      selectedMemberIds.value.delete(id)
    } else {
      selectedMemberIds.value.add(id)
    }
  }

  // 달력 그리드 생성 (월요일 시작)
  const calendarWeeks = computed(() => {
    const year = currentYear.value
    const month = currentMonth.value
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    // 월요일 기준 시작 오프셋 (0=Mon, 6=Sun)
    let startOffset = firstDay.getDay()
    startOffset = startOffset === 0 ? 6 : startOffset - 1

    const days: { date: Date; currentMonth: boolean }[] = []

    for (let i = startOffset - 1; i >= 0; i--) {
      days.push({ date: new Date(year, month, -i), currentMonth: false })
    }
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push({ date: new Date(year, month, d), currentMonth: true })
    }
    const remaining = 42 - days.length
    for (let d = 1; d <= remaining; d++) {
      days.push({ date: new Date(year, month + 1, d), currentMonth: false })
    }

    const weeks = []
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7))
    }
    return weeks
  })

  // 특정 날짜의 이벤트 반환 (선택된 멤버 필터 적용)
  function getEventsForDate(date: Date): CalendarEvent[] {
    const dateStr = formatDate(date)
    return events.value.filter(e => {
      const matchDate = e.start_date === dateStr
      const matchMember = selectedMemberIds.value.size === 0 || selectedMemberIds.value.has(e.created_by)
      return matchDate && matchMember
    })
  }

  async function fetchMembers() {
    try {
      const data = await $fetch<Member[]>('/api/members')
      members.value = data
      // 기본적으로 전원 선택
      selectedMemberIds.value = new Set(data.map(m => m.id))
    } catch {}
  }

  function formatDate(date: Date) {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  async function fetchEvents() {
    try {
      const data = await $fetch<CalendarEvent[]>('/api/events', {
        query: { year: currentYear.value, month: currentMonth.value + 1 },
      })
      events.value = data
    } catch {}
  }

  async function fetchWeekEvents() {
    try {
      const days = currentWeekDays.value
      const data = await $fetch<CalendarEvent[]>('/api/events', {
        query: { startDate: formatDate(days[0]), endDate: formatDate(days[6]) },
      })
      weekEvents.value = data
    } catch {}
  }

  async function fetchYearEvents() {
    try {
      const data = await $fetch<CalendarEvent[]>('/api/events', {
        query: { startDate: `${currentYear.value}-01-01`, endDate: `${currentYear.value}-12-31` },
      })
      events.value = data
    } catch {}
  }

  function getWeekEventsForDate(date: Date): CalendarEvent[] {
    const dateStr = formatDate(date)
    return weekEvents.value.filter(e => {
      const matchDate = e.start_date === dateStr
      const matchMember = selectedMemberIds.value.size === 0 || selectedMemberIds.value.has(e.created_by)
      return matchDate && matchMember
    })
  }

  async function createEvent(payload: { title: string; memo: string; start_date: string; end_date: string }) {
    const newEvent = await $fetch<CalendarEvent>('/api/events', {
      method: 'POST',
      body: payload,
    })
    events.value.push(newEvent)
    return newEvent
  }

  async function updateEvent(id: string, payload: { title: string; memo: string; start_date: string; end_date: string }) {
    const updated = await $fetch<CalendarEvent>(`/api/events/${id}`, {
      method: 'PUT',
      body: payload,
    })
    const idx = events.value.findIndex(e => e.id === id)
    if (idx !== -1) events.value[idx] = updated
    return updated
  }

  async function deleteEvent(id: string) {
    await $fetch(`/api/events/${id}`, { method: 'DELETE' })
    events.value = events.value.filter(e => e.id !== id)
  }

  return {
    currentYear, currentMonth, currentView,
    events, weekEvents, members, selectedMemberIds,
    currentMonthLabel, calendarWeeks,
    weekAnchor, currentWeekDays, currentWeekLabel,
    prevMonth, nextMonth, goToday,
    prevWeek, nextWeek,
    toggleMember, getEventsForDate, getWeekEventsForDate,
    fetchMembers, fetchEvents, fetchWeekEvents, fetchYearEvents,
    createEvent, updateEvent, deleteEvent,
    formatDate,
  }
})
