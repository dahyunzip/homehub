<template>
  <aside class="sidebar">
    <div class="sidebar-logo">
      <span class="logo-text">HomeHub</span>
    </div>

    <nav class="sidebar-nav">
      <NuxtLink to="/" class="nav-item" :class="{ active: route.path === '/' }">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
        >
          <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
          <path d="M9 21V12h6v9" />
        </svg>
        <span>홈</span>
      </NuxtLink>

      <NuxtLink
        to="/calendar"
        class="nav-item"
        :class="{ active: route.path.startsWith('/calendar') }"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
        <span>캘린더</span>
      </NuxtLink>

      <NuxtLink
        to="/docs"
        class="nav-item"
        :class="{ active: route.path.startsWith('/docs') }"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
        >
          <path d="M4 4h16v16H4z" rx="2" />
          <path d="M9 9h6M9 13h6M9 17h4" />
        </svg>
        <span>문서함</span>
      </NuxtLink>

      <NuxtLink
        to="/board"
        class="nav-item"
        :class="{ active: route.path.startsWith('/board') }"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
        >
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
        <span>게시판</span>
      </NuxtLink>

      <NuxtLink
        to="/settings"
        class="nav-item"
        :class="{ active: route.path.startsWith('/settings') }"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
        >
          <circle cx="12" cy="12" r="3" />
          <path
            d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
          />
        </svg>
        <span>설정</span>
      </NuxtLink>
    </nav>

    <div class="sidebar-bottom">
      <button class="btn-invite" @click="inviteOpen = true">
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
      <button class="btn-signout" @click="handleLogout">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
        >
          <path
            d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
          />
        </svg>
        Sign Out
      </button>
    </div>
  </aside>

  <CommonInviteModal v-if="inviteOpen" @close="inviteOpen = false" />
</template>

<script setup lang="ts">
import { useAuthStore } from "~/stores/auth";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const inviteOpen = ref(false);

async function handleLogout() {
  await authStore.logout();
  router.push("/login");
}
</script>

<style scoped lang="scss">
.sidebar {
  width: 220px;
  min-height: 100vh;
  background: #fff;
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  padding: 0;
  flex-shrink: 0;
}

.sidebar-logo {
  padding: 24px 20px 20px;

  .logo-text {
    font-size: 20px;
    font-weight: 700;
    color: var(--color-primary);
    letter-spacing: -0.5px;
  }
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 16px 12px;
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-muted);
  text-decoration: none;
  transition:
    background 0.15s,
    color 0.15s;

  svg {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }

  &:hover {
    background: var(--color-bg-hover);
    color: var(--color-text);
  }

  &.active {
    background: #eef0fd;
    color: var(--color-primary);
    font-weight: 600;
  }
}

.sidebar-bottom {
  padding: 16px 12px;
  border-top: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.btn-invite {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px 12px;
  background: var(--color-primary);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;

  svg {
    width: 16px;
    height: 16px;
  }

  &:hover {
    background: var(--color-primary-hover);
  }
}

.btn-signout {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px 12px;
  background: none;
  color: var(--color-text-muted);
  font-size: 13px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s;

  svg {
    width: 16px;
    height: 16px;
  }

  &:hover {
    background: var(--color-bg-hover);
    color: var(--color-text);
  }
}
</style>
