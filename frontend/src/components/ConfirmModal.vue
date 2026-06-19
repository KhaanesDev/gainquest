<template>
  <Teleport to="body">
    <div class="overlay" @click.self="emit('cancel')">
      <div class="dialog" role="alertdialog" aria-modal="true">
        <h3 class="dialog-title">{{ title }}</h3>
        <p class="dialog-message">{{ message }}</p>
        <div class="dialog-actions">
          <button class="btn-cancel" @click="emit('cancel')">{{ cancelLabel }}</button>
          <button class="btn-confirm" :class="{ danger }" @click="emit('confirm')">{{ confirmLabel }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}>(), {
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  danger: false,
})

const emit = defineEmits<{ confirm: []; cancel: [] }>()
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 400;
  padding: 20px;
  padding-bottom: max(20px, env(safe-area-inset-bottom));
}

.dialog {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 380px;
  padding: 22px;
  animation: pop-in 0.18s ease;
}

@keyframes pop-in {
  from { opacity: 0; transform: scale(0.96); }
  to   { opacity: 1; transform: scale(1); }
}

.dialog-title {
  font-size: 17px;
  font-weight: 800;
  margin: 0 0 8px;
}

.dialog-message {
  font-size: 14px;
  line-height: 1.5;
  color: var(--color-text-muted);
  margin: 0 0 20px;
}

.dialog-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.btn-cancel,
.btn-confirm {
  padding: 9px 16px;
  border-radius: var(--radius);
  font-size: 13px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-cancel {
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  color: var(--color-text-muted);
}
.btn-cancel:hover { color: var(--color-text); border-color: var(--color-text-muted); }

.btn-confirm {
  background: var(--color-primary);
  border: 1px solid var(--color-primary);
  color: white;
}
.btn-confirm:hover { opacity: 0.9; }

.btn-confirm.danger {
  background: #ef4444;
  border-color: #ef4444;
}
</style>
