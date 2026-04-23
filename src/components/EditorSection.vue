<script setup lang="ts">
import { ref, watch } from 'vue';
import type { SectionConfig } from '../types';

const props = defineProps<{
  title: string;
  data: any;
  settings?: SectionConfig;
}>();

const emit = defineEmits<{
  (e: 'update', value: any): void;
  (e: 'update:settings', value: SectionConfig): void;
}>();

const mode = ref<'visual' | 'json'>('visual');
const jsonStr = ref(JSON.stringify(props.data, null, 2));
const error = ref('');

// Automatically update JSON string when data prop changes from outside (e.g. via visual editor)
watch(() => props.data, (newVal) => {
  if (mode.value === 'visual') {
    jsonStr.value = JSON.stringify(newVal, null, 2);
  }
}, { deep: true });

const applyJson = () => {
  try {
    const parsed = JSON.parse(jsonStr.value);
    emit('update', parsed);
    error.value = '';
  } catch(e: any) {
    error.value = e.message;
  }
};

// When switching to visual mode, auto-apply JSON if valid
const toggleMode = (newMode: 'visual' | 'json') => {
  if (newMode === 'visual' && mode.value === 'json') {
    applyJson();
    if (error.value) return; // prevent switching if error
  }
  mode.value = newMode;
};

const handleSettingsChange = () => {
  if (props.settings) {
    emit('update:settings', props.settings);
  }
};
</script>

<template>
  <div class="mb-8 border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm">
    <div class="px-3 py-2 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:justify-between md:items-center gap-2">
      <div v-if="settings" class="flex items-center gap-2 flex-1">
         <input type="checkbox" v-model="settings.visible" @change="handleSettingsChange" title="Toggle section visibility" class="accent-[#01a3a4] cursor-pointer w-3.5 h-3.5 rounded shrink-0">
         <input v-model="settings.title" @input="handleSettingsChange" class="text-[11px] font-bold text-slate-700 uppercase tracking-wider bg-transparent border-b border-dashed border-slate-300 hover:border-slate-400 focus:border-[#01a3a4] focus:border-solid outline-none px-1 py-0.5 w-full max-w-[200px]" placeholder="Section Title">
      </div>
      <h3 v-else class="text-xs font-bold text-slate-700 uppercase tracking-wider">{{ title }}</h3>
      <div class="flex bg-white border border-slate-200 rounded overflow-hidden shrink-0">
        <button @click="toggleMode('visual')" :class="mode === 'visual' ? 'bg-[#01a3a4]/10 text-[#01a3a4] font-medium' : 'text-slate-500 hover:bg-slate-50'" class="px-3 py-1 text-[10px] transition-colors">Visual</button>
        <button @click="toggleMode('json')" :class="mode === 'json' ? 'bg-[#01a3a4]/10 text-[#01a3a4] font-medium' : 'text-slate-500 hover:bg-slate-50'" class="px-3 py-1 text-[10px] border-l border-slate-200 transition-colors">JSON</button>
      </div>
    </div>
    
    <div v-show="mode === 'visual'" class="p-4 bg-white" :class="{'opacity-50 grayscale transition-all duration-300': settings && !settings.visible}">
      <slot></slot>
    </div>

    <div v-show="mode === 'json'" class="flex flex-col relative bg-slate-50" :class="{'opacity-50 grayscale transition-all duration-300': settings && !settings.visible}">
      <div v-if="error" class="bg-red-50 text-red-600 px-4 py-2 text-xs border-b border-red-100 font-mono">
        <i class="fa-solid fa-triangle-exclamation mr-1"></i> {{ error }}
      </div>
      <textarea 
        v-model="jsonStr" 
        class="w-full h-[350px] p-4 text-[11px] font-mono outline-none resize-y custom-scrollbar text-slate-700 bg-transparent"
        spellcheck="false"
      ></textarea>
      <div class="absolute bottom-4 right-4">
         <button @click="applyJson" class="px-4 py-1.5 bg-[#01a3a4] text-white rounded shadow-sm text-xs hover:bg-[#01a3a4]/90 transition font-medium">Apply JSON</button>
      </div>
    </div>
  </div>
</template>
