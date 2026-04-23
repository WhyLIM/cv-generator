<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const isOpen = ref(false);
const containerRef = ref<HTMLElement | null>(null);

const commonIcons = [
  // Development
  'fa-solid fa-code', 'fa-solid fa-laptop-code', 'fa-solid fa-database', 'fa-solid fa-server', 'fa-solid fa-cloud', 'fa-solid fa-microchip', 'fa-solid fa-bug', 'fa-solid fa-terminal',
  // Science / Academic
  'fa-solid fa-microscope', 'fa-solid fa-vial', 'fa-solid fa-dna', 'fa-solid fa-book', 'fa-solid fa-graduation-cap', 'fa-solid fa-language', 'fa-solid fa-atom', 'fa-solid fa-chart-pie',
  // General
  'fa-solid fa-chart-line', 'fa-solid fa-briefcase', 'fa-solid fa-users', 'fa-solid fa-lightbulb', 'fa-solid fa-pen-nib', 'fa-solid fa-globe', 'fa-solid fa-star', 'fa-solid fa-trophy',
  // Brands
  'fa-brands fa-python', 'fa-brands fa-js', 'fa-brands fa-java', 'fa-brands fa-html5', 'fa-brands fa-css3-alt', 'fa-brands fa-react', 'fa-brands fa-vuejs', 'fa-brands fa-node-js', 'fa-brands fa-linux', 'fa-brands fa-docker', 'fa-brands fa-aws', 'fa-brands fa-github'
];

const toggle = () => isOpen.value = !isOpen.value;
const selectIcon = (icon: string) => {
  emit('update:modelValue', icon);
  isOpen.value = false;
};

// Close on outside click
const handleClickOutside = (e: MouseEvent) => {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    isOpen.value = false;
  }
};

onMounted(() => document.addEventListener('click', handleClickOutside));
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside));
</script>

<template>
  <div class="relative" ref="containerRef">
    <div class="flex">
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

    <!-- Dropdown Panel -->
    <div v-if="isOpen" class="absolute z-50 top-full right-0 mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-xl p-3">
      <div class="text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wide">Common Icons</div>
      <div class="grid grid-cols-6 gap-2 h-48 overflow-y-auto custom-scrollbar">
        <button 
          v-for="icon in commonIcons" 
          :key="icon"
          @click="selectIcon(icon)"
          class="w-8 h-8 rounded border border-slate-100 flex items-center justify-center text-slate-600 hover:bg-[#01a3a4] hover:text-white hover:border-[#01a3a4] transition-all bg-slate-50"
          :title="icon"
          type="button"
        >
          <i :class="icon"></i>
        </button>
      </div>
    </div>
  </div>
</template>
