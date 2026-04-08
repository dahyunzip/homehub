<template>
  <div class="settings-page">
    <div class="page-header">
      <h1>시스템 설정</h1>
      <p>정보를 올바르게 수정하세요</p>
    </div>

    <div class="settings-grid">
      <!-- ── 좌측 컬럼 ── -->
      <div class="col-left">
        <!-- User Profile -->
        <section class="card">
          <div class="card-head">
            <div>
              <h2>사용자 프로필</h2>
              <p>개인 정보 업데이트 하세요.</p>
            </div>
          </div>

          <div class="profile-body">
            <!-- 아바타 -->
            <div class="avatar-wrap">
              <div class="avatar" :style="{ background: form.color }">
                {{ authStore.user?.name?.charAt(0)?.toUpperCase() }}
              </div>
              <div class="color-dots">
                <button
                  v-for="c in PRESET_COLORS"
                  :key="c"
                  class="color-dot"
                  :class="{ active: form.color === c }"
                  :style="{ background: c }"
                  :title="c"
                  @click="form.color = c"
                />
              </div>
            </div>

            <!-- 필드 -->
            <div class="profile-fields">
              <div class="field">
                <label>이름</label>
                <input
                  v-model="form.name"
                  type="text"
                  placeholder="이름 입력"
                  maxlength="20"
                />
              </div>
            </div>
          </div>
        </section>

        <!-- Family Group -->
        <section class="card">
          <div class="card-head">
            <div>
              <h2>가족 구성원</h2>
              <p>
                Managing {{ members.length }} member{{
                  members.length !== 1 ? "s" : ""
                }}
                in this hearth.
              </p>
            </div>
            <button class="invite-link" @click="inviteOpen = true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
              >
                <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
              Invite Member
            </button>
          </div>

          <ul class="member-list">
            <li v-for="member in members" :key="member.id" class="member-row">
              <div class="member-avatar" :style="{ background: member.color }">
                {{ member.name.charAt(0).toUpperCase() }}
              </div>
              <div class="member-info">
                <span class="member-name">{{ member.name }}</span>
                <span class="member-since">{{
                  formatJoinedAt(member.joined_at)
                }}</span>
              </div>
              <div
                v-if="member.id === authStore.user?.id"
                class="member-badge me"
              >
                나
              </div>
            </li>
          </ul>
        </section>
      </div>

      <!-- ── 우측 컬럼 ── -->
      <div class="col-right">
        <!-- Atmosphere -->
        <section class="card">
          <div class="card-head">
            <div>
              <h2>컬러모드</h2>
              <p>Set the visual tone for your home.</p>
            </div>
          </div>

          <div class="theme-options">
            <button
              class="theme-option"
              :class="{ active: themeStore.theme === 'light' }"
              @click="themeStore.apply('light')"
            >
              <span class="theme-icon light-icon">☀️</span>
              <div class="theme-label">
                <strong>라이트모드</strong>
                <span>Default light theme</span>
              </div>
            </button>

            <button
              class="theme-option"
              :class="{ active: themeStore.theme === 'dark' }"
              @click="themeStore.apply('dark')"
            >
              <span class="theme-icon dark-icon">🌙</span>
              <div class="theme-label">
                <strong>다크모드</strong>
                <span>Cozy dark theme</span>
              </div>
            </button>
          </div>
        </section>

        <!-- Notifications (UI only) -->
        <section class="card">
          <div class="card-head">
            <div>
              <h2>알림 설정</h2>
              <p>Control your focus and awareness.</p>
            </div>
          </div>

          <ul class="notif-list">
            <li v-for="item in notifItems" :key="item.key" class="notif-row">
              <div class="notif-info">
                <span class="notif-title">{{ item.title }}</span>
                <span class="notif-desc">{{ item.desc }}</span>
              </div>
              <button
                class="toggle"
                :class="{ on: notifState[item.key] }"
                @click="notifState[item.key] = !notifState[item.key]"
              >
                <span class="toggle-knob" />
              </button>
            </li>
          </ul>
          <p class="notif-notice">
            알림 설정은 게시판·문서함 구현 후 적용됩니다.
          </p>
        </section>
      </div>
    </div>

    <!-- 하단 액션 바 -->
    <div class="action-bar">
      <button class="btn-discard" :disabled="!isDirty" @click="discardChanges">
        Discard changes
      </button>
      <button
        class="btn-save"
        :disabled="!isDirty || saving"
        @click="saveChanges"
      >
        {{ saving ? "Saving..." : "Save All Changes" }}
      </button>
    </div>

    <CommonInviteModal v-if="inviteOpen" @close="inviteOpen = false" />
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from "~/stores/auth";
import { useThemeStore } from "~/stores/theme";

const authStore = useAuthStore();
const themeStore = useThemeStore();

interface Member {
  id: string;
  name: string;
  color: string;
  avatar_url: string | null;
  joined_at: string;
}

// ── 프로필 폼 ──
const PRESET_COLORS = [
  "#5dcaa5",
  "#4763e4",
  "#e4634a",
  "#f0a500",
  "#9b5de5",
  "#00b4d8",
  "#e84393",
  "#6b7280",
];

const form = reactive({
  name: authStore.user?.name ?? "",
  color: authStore.user?.color ?? PRESET_COLORS[0],
});

const original = reactive({ ...form });
const isDirty = computed(
  () => form.name !== original.name || form.color !== original.color,
);

// ── 멤버 목록 ──
const members = ref<Member[]>([]);

onMounted(async () => {
  try {
    const data = await $fetch<Member[]>("/api/members");
    members.value = data;
  } catch {}
});

function formatJoinedAt(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return `Member since ${d.toLocaleDateString("en-US", { month: "short", year: "numeric" })}`;
}

// ── 알림 설정 (UI only) ──
const notifItems = [
  {
    key: "realtime",
    title: "Real-time Events",
    desc: "Updates for shared calendar tasks",
  },
  {
    key: "board",
    title: "Board Messages",
    desc: "Alerts for new forum discussions",
  },
  {
    key: "reminder",
    title: "Smart Reminders",
    desc: "AI-driven home maintenance tips",
  },
] as const;

type NotifKey = (typeof notifItems)[number]["key"];
const notifState = reactive<Record<NotifKey, boolean>>({
  realtime: true,
  board: true,
  reminder: false,
});

// ── 초대 모달 ──
const inviteOpen = ref(false);

// ── 저장 / 취소 ──
const saving = ref(false);

async function saveChanges() {
  if (!isDirty.value) return;
  saving.value = true;
  try {
    const updated = await $fetch<{
      id: string;
      name: string;
      color: string;
      avatar_url: string | null;
    }>("/api/profile", {
      method: "PATCH",
      body: { name: form.name, color: form.color },
    });
    authStore.user = { ...authStore.user!, ...updated };
    original.name = form.name;
    original.color = form.color;
  } catch (e: any) {
    alert(e?.data?.message ?? "저장에 실패했습니다.");
  } finally {
    saving.value = false;
  }
}

function discardChanges() {
  form.name = original.name;
  form.color = original.color;
}
</script>

<style scoped lang="scss">
.settings-page {
  max-width: 960px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* ── 헤더 ── */
.page-header {
  h1 {
    font-size: 26px;
    font-weight: 800;
    color: var(--color-text);
    margin: 0 0 4px;
  }
  p {
    font-size: 14px;
    color: var(--color-text-muted);
    margin: 0;
  }
}

/* ── 그리드 ── */
.settings-grid {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 20px;
  align-items: start;
}

.col-left,
.col-right {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ── 카드 공통 ── */
.card {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  padding: 24px;
}

.card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;

  h2 {
    font-size: 16px;
    font-weight: 700;
    color: var(--color-text);
    margin: 0 0 4px;
  }
  p {
    font-size: 13px;
    color: var(--color-text-muted);
    margin: 0;
  }
}

/* ── User Profile ── */
.profile-body {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.avatar-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}

.color-dots {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}

.color-dot {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  padding: 0;
  transition:
    transform 0.12s,
    border-color 0.12s;

  &:hover {
    transform: scale(1.2);
  }
  &.active {
    border-color: var(--color-text);
    transform: scale(1.15);
  }
}

.profile-fields {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;

  label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: var(--color-text-muted);
  }

  input {
    height: 40px;
    padding: 0 12px;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    font-size: 14px;
    color: var(--color-text);
    background: var(--color-bg);
    outline: none;
    transition: border-color 0.15s;

    &:focus {
      border-color: var(--color-primary);
    }
    &.disabled {
      background: var(--color-bg-hover);
      color: var(--color-text-muted);
      cursor: default;
    }
  }
}

/* ── Family Group ── */
.invite-link {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-primary);
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 0;
  white-space: nowrap;
  flex-shrink: 0;

  svg {
    width: 15px;
    height: 15px;
  }
  &:hover {
    opacity: 0.75;
  }
}

.member-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.member-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 8px;
  border-radius: 8px;
  transition: background 0.1s;
  &:hover {
    background: var(--color-bg-hover);
  }
}

.member-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}

.member-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.member-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
}

.member-since {
  font-size: 12px;
  color: var(--color-text-muted);
}

.member-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 20px;
  border: 1.5px solid var(--color-border);
  color: var(--color-text-muted);

  &.me {
    border-color: var(--color-primary);
    color: var(--color-primary);
    background: #f0f3ff;
  }
}

/* ── Atmosphere ── */
.theme-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.theme-option {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 10px;
  border: 1.5px solid var(--color-border);
  background: var(--color-bg);
  cursor: pointer;
  text-align: left;
  transition:
    border-color 0.15s,
    background 0.15s;

  &:hover {
    border-color: var(--color-border-hover);
  }
  &.active {
    border-color: var(--color-primary);
    background: #f0f3ff;
  }
}

.theme-icon {
  font-size: 22px;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &.light-icon {
    background: #fff8e1;
  }
  &.dark-icon {
    background: #1e2330;
  }
}

.theme-label {
  display: flex;
  flex-direction: column;
  gap: 2px;

  strong {
    font-size: 14px;
    font-weight: 700;
    color: var(--color-text);
  }
  span {
    font-size: 12px;
    color: var(--color-text-muted);
  }
}

/* ── Notifications ── */
.notif-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.notif-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--color-border);
  &:last-child {
    border-bottom: none;
  }
}

.notif-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.notif-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
}

.notif-desc {
  font-size: 12px;
  color: var(--color-text-muted);
}

.toggle {
  width: 42px;
  height: 24px;
  border-radius: 12px;
  border: none;
  background: var(--color-border);
  cursor: pointer;
  padding: 3px;
  transition: background 0.2s;
  flex-shrink: 0;
  position: relative;

  &.on {
    background: var(--color-primary);
  }
}

.toggle-knob {
  display: block;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s;
  position: absolute;
  top: 3px;
  left: 3px;

  .on & {
    transform: translateX(18px);
  }
}

.notif-notice {
  margin: 12px 0 0;
  font-size: 11px;
  color: var(--color-text-placeholder);
}

/* ── 하단 액션 바 ── */
.action-bar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
  padding: 16px 0 8px;
  border-top: 1px solid var(--color-border);
}

.btn-discard {
  height: 38px;
  padding: 0 18px;
  background: none;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 14px;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: background 0.15s;

  &:hover:not(:disabled) {
    background: var(--color-bg-hover);
  }
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.btn-save {
  height: 38px;
  padding: 0 22px;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;

  &:hover:not(:disabled) {
    background: var(--color-primary-hover);
  }
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}
</style>
