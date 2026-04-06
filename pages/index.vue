<template>
  <div>zzz</div>
</template>

<!-- pages/index.vue 에서 연동 테스트 -->
<script setup lang="ts">
const supabase = useSupabaseClient();

const { data, error } = await supabase.auth.getSession();
console.log("session:", data);
console.log("error:", error);
</script>

<style scoped></style>
