<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useLocale } from '../composables/useLocale';

const { t } = useLocale();

defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

// Grouped icons: key is category id (used for translation lookup), value is icon list
// Verified against FontAwesome 6.5.1 free (https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css)
const commonIconGroups: Record<string, string[]> = {
  development: [
    'fa-solid fa-code', 'fa-solid fa-laptop-code', 'fa-solid fa-database', 'fa-solid fa-server', 'fa-solid fa-cloud', 'fa-solid fa-microchip', 'fa-solid fa-bug', 'fa-solid fa-terminal',
    'fa-solid fa-cube', 'fa-solid fa-code-branch', 'fa-solid fa-file-code', 'fa-solid fa-sitemap', 'fa-solid fa-gears', 'fa-solid fa-gear', 'fa-solid fa-screwdriver-wrench',
    'fa-solid fa-key', 'fa-solid fa-lock', 'fa-solid fa-shield-halved', 'fa-solid fa-network-wired', 'fa-solid fa-laptop', 'fa-solid fa-mobile-screen',
  ],
  science: [
    'fa-solid fa-microscope', 'fa-solid fa-vial', 'fa-solid fa-dna', 'fa-solid fa-book', 'fa-solid fa-graduation-cap', 'fa-solid fa-language', 'fa-solid fa-atom',
    'fa-solid fa-flask', 'fa-solid fa-capsules', 'fa-solid fa-syringe', 'fa-solid fa-heart-pulse', 'fa-solid fa-seedling', 'fa-solid fa-leaf', 'fa-solid fa-bacteria', 'fa-solid fa-viruses',
    'fa-solid fa-pills', 'fa-solid fa-magnet', 'fa-solid fa-bolt', 'fa-solid fa-fire',
  ],
  charts: [
    'fa-solid fa-chart-line', 'fa-solid fa-chart-column', 'fa-solid fa-chart-bar', 'fa-solid fa-chart-pie', 'fa-solid fa-chart-simple', 'fa-solid fa-table', 'fa-solid fa-magnifying-glass-chart', 'fa-solid fa-magnifying-glass',
  ],
  business: [
    'fa-solid fa-briefcase', 'fa-solid fa-users', 'fa-solid fa-lightbulb', 'fa-solid fa-pen-nib', 'fa-solid fa-globe', 'fa-solid fa-star', 'fa-solid fa-trophy', 'fa-solid fa-handshake',
    'fa-solid fa-award', 'fa-solid fa-medal', 'fa-solid fa-certificate', 'fa-solid fa-flag', 'fa-solid fa-bullseye', 'fa-solid fa-rocket', 'fa-solid fa-compass', 'fa-solid fa-route',
  ],
  media: [
    'fa-solid fa-image', 'fa-solid fa-camera', 'fa-solid fa-video', 'fa-solid fa-music', 'fa-solid fa-palette', 'fa-solid fa-paintbrush', 'fa-solid fa-file-lines', 'fa-solid fa-folder',
    'fa-solid fa-folder-open', 'fa-solid fa-file-pdf', 'fa-solid fa-file-word', 'fa-solid fa-file-image', 'fa-solid fa-paperclip', 'fa-solid fa-bookmark', 'fa-solid fa-newspaper', 'fa-solid fa-quote-left',
  ],
  contact: [
    'fa-solid fa-phone', 'fa-solid fa-envelope', 'fa-solid fa-link', 'fa-solid fa-location-dot', 'fa-solid fa-house', 'fa-solid fa-building', 'fa-solid fa-bell', 'fa-solid fa-bell-concierge',
    'fa-solid fa-at', 'fa-solid fa-hashtag', 'fa-solid fa-share-nodes', 'fa-solid fa-comments', 'fa-solid fa-comment', 'fa-solid fa-comment-dots', 'fa-solid fa-calendar', 'fa-solid fa-clock',
    'fa-solid fa-circle-info', 'fa-solid fa-circle-question', 'fa-solid fa-circle-check', 'fa-solid fa-circle-exclamation', 'fa-solid fa-address-card', 'fa-solid fa-id-card', 'fa-solid fa-id-badge', 'fa-solid fa-user',
    'fa-solid fa-user-graduate', 'fa-solid fa-user-tie', 'fa-solid fa-user-doctor', 'fa-solid fa-user-secret', 'fa-solid fa-user-pen', 'fa-solid fa-circle-user',
  ],
  brandsTech: [
    'fa-brands fa-python', 'fa-brands fa-js', 'fa-brands fa-java', 'fa-brands fa-html5', 'fa-brands fa-css3-alt', 'fa-brands fa-react', 'fa-brands fa-vuejs', 'fa-brands fa-node-js',
    'fa-brands fa-linux', 'fa-brands fa-docker', 'fa-brands fa-aws', 'fa-brands fa-github',
    'fa-brands fa-git-alt', 'fa-brands fa-stack-overflow', 'fa-brands fa-npm', 'fa-brands fa-yarn', 'fa-brands fa-chrome', 'fa-brands fa-firefox', 'fa-brands fa-windows', 'fa-brands fa-apple',
    'fa-brands fa-android', 'fa-brands fa-ubuntu', 'fa-brands fa-debian', 'fa-brands fa-redhat', 'fa-brands fa-stack-exchange',
  ],
  brandsSocial: [
    'fa-brands fa-twitter', 'fa-brands fa-linkedin', 'fa-brands fa-weixin', 'fa-brands fa-weibo', 'fa-brands fa-orcid', 'fa-brands fa-google-scholar', 'fa-brands fa-researchgate', 'fa-brands fa-medium',
    'fa-brands fa-telegram', 'fa-brands fa-discord', 'fa-brands fa-instagram', 'fa-brands fa-facebook', 'fa-brands fa-tiktok', 'fa-brands fa-mastodon', 'fa-brands fa-bilibili', 'fa-brands fa-quora',
    'fa-brands fa-reddit', 'fa-brands fa-youtube', 'fa-brands fa-threads', 'fa-brands fa-behance', 'fa-brands fa-dribbble', 'fa-brands fa-x-twitter', 'fa-brands fa-pinterest', 'fa-brands fa-vk',
    'fa-brands fa-slack', 'fa-brands fa-google', 'fa-brands fa-google-drive', 'fa-brands fa-edge', 'fa-brands fa-codepen',
  ],
  misc: [
    'fa-solid fa-icons', 'fa-solid fa-thumbtack', 'fa-solid fa-tag', 'fa-solid fa-tags', 'fa-solid fa-heart',
  ],
};

const isOpen = ref(false);
const triggerRef = ref<HTMLElement | null>(null);
const panelStyle = ref({ top: '0px', left: '0px', width: '256px' });

const updatePanelPosition = async () => {
  await nextTick();
  if (!triggerRef.value) return;
  const rect = triggerRef.value.getBoundingClientRect();
  const panelWidth = 320; // matches w-80 below
  // Default: place panel just below the button, right-aligned to it
  let left = rect.right - panelWidth;
  // Keep on-screen horizontally
  if (left < 8) left = 8;
  if (left + panelWidth > window.innerWidth - 8) {
    left = window.innerWidth - 8 - panelWidth;
  }
  const top = rect.bottom + 4;
  panelStyle.value = { top: `${top}px`, left: `${left}px`, width: `${panelWidth}px` };
};

const toggle = async () => {
  if (isOpen.value) {
    isOpen.value = false;
    return;
  }
  await updatePanelPosition();
  isOpen.value = true;
};

const selectIcon = (icon: string) => {
  emit('update:modelValue', icon);
  isOpen.value = false;
};

const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as Node;
  if (triggerRef.value && triggerRef.value.contains(target)) return;
  // panel is teleported to body, check it explicitly
  const panel = document.getElementById('icon-picker-panel');
  if (panel && panel.contains(target)) return;
  isOpen.value = false;
};

const handleScrollOrResize = () => {
  if (isOpen.value) updatePanelPosition();
};

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside);
  window.addEventListener('scroll', handleScrollOrResize, true);
  window.addEventListener('resize', handleScrollOrResize);
});
onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleClickOutside);
  window.removeEventListener('scroll', handleScrollOrResize, true);
  window.removeEventListener('resize', handleScrollOrResize);
});
</script>

<template>
  <div class="relative">
    <div class="flex" ref="triggerRef">
      <input 
        :value="modelValue"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        placeholder="e.g., fa-solid fa-star"
        class="w-full text-xs box-border border border-slate-200 rounded-l p-1.5 outline-none focus:border-[#01a3a4] transition-colors bg-white"
      />
      <button 
        @click="toggle"
        class="bg-slate-100 hover:bg-slate-200 border border-l-0 border-slate-200 rounded-r px-3 text-slate-600 transition-colors flex items-center justify-center shrink-0 w-10"
        type="button"
      >
        <i :class="modelValue || 'fa-solid fa-icons'"></i>
      </button>
    </div>

    <!-- Teleported dropdown panel so it escapes any overflow:hidden ancestor -->
    <Teleport to="body">
      <div v-if="isOpen"
        id="icon-picker-panel"
        :style="{ position: 'fixed', top: panelStyle.top, left: panelStyle.left, width: panelStyle.width, zIndex: 9999 }"
        class="bg-white border border-slate-200 rounded-lg shadow-xl p-3"
        @mousedown.stop
      >
        <div class="text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wide">{{ t('commonIcons') }}</div>
        <div class="max-h-72 overflow-y-auto custom-scrollbar pr-1 space-y-3">
          <div v-for="(icons, group) in commonIconGroups" :key="group">
            <div class="text-[9px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider flex items-center gap-1.5 sticky top-0 bg-white py-0.5">
              <span class="inline-block w-1 h-1 rounded-full bg-slate-300"></span>
              {{ t('iconGroup_' + group) }}
              <span class="text-slate-300 font-normal normal-case">({{ icons.length }})</span>
            </div>
            <div class="grid grid-cols-7 gap-1.5">
              <button
                v-for="icon in icons"
                :key="icon"
                @click="selectIcon(icon)"
                class="w-9 h-9 rounded border border-slate-100 flex items-center justify-center text-slate-600 hover:bg-[#01a3a4] hover:text-white hover:border-[#01a3a4] transition-all bg-slate-50"
                :title="icon"
                type="button"
              >
                <i :class="icon"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
