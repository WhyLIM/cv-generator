<script setup lang="ts">
import LineNumberedTextarea from './LineNumberedTextarea.vue';
import type { CustomItem } from '../types';
import { useLocale } from '../composables/useLocale';

const { t } = useLocale();

const props = defineProps<{
  item: CustomItem;
  list: CustomItem[];
  index: number;
}>();

// 上移 / 下移
const moveItem = (direction: number) => {
  const newIdx = props.index + direction;
  if (newIdx < 0 || newIdx >= props.list.length) return;
  [props.list[props.index], props.list[newIdx]] = [props.list[newIdx], props.list[props.index]];
};
</script>

<template>
  <div class="p-3 border border-slate-200 bg-slate-50/50 rounded relative group">
    <!-- Collapsible header -->
    <div class="flex items-center justify-between gap-2">
      <div class="flex-1 font-bold text-xs text-slate-700 cursor-pointer flex items-center min-w-0"
        @click="item._collapsed = !item._collapsed">
        <i class="fa-solid fa-chevron-right mr-1 transition-transform inline-block shrink-0"
          :class="{ 'rotate-90': !item._collapsed }"></i>
        <span class="truncate">{{ item.title || t('untitledItem') }}</span>
      </div>
      <div class="flex items-center gap-1 shrink-0">
        <button @click.stop="moveItem(-1)" :disabled="index === 0"
          class="w-6 h-6 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 disabled:opacity-30 disabled:hover:bg-white shadow-sm flex items-center justify-center"><i
            class="fa-solid fa-arrow-up text-[10px]"></i></button>
        <button @click.stop="moveItem(1)" :disabled="index === list.length - 1"
          class="w-6 h-6 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 disabled:opacity-30 disabled:hover:bg-white shadow-sm flex items-center justify-center"><i
            class="fa-solid fa-arrow-down text-[10px]"></i></button>
        <button @click.stop="list.splice(index, 1)"
          class="w-6 h-6 rounded bg-white hover:bg-red-50 border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 shadow-sm ml-1 flex items-center justify-center"><i
            class="fa-solid fa-trash text-[10px]"></i></button>
      </div>
    </div>

    <!-- Collapsible body -->
    <div v-show="!item._collapsed" class="mt-3 pt-3 border-t border-slate-200">
      <div class="grid grid-cols-2 gap-3 mb-2">
        <div class="col-span-2"><label class="block text-[10px] text-slate-500 font-bold mb-1">{{
          t('itemTitle') }}</label><input v-model="item.title" :placeholder="t('projectName')"
            class="w-full font-medium text-xs border border-slate-200 rounded p-1.5 outline-none focus:border-[#01a3a4] bg-white">
        </div>
        <div><label class="block text-[10px] text-slate-500 font-bold mb-1">{{ t('subtitle')
            }}</label><input v-model="item.subtitle"
            class="w-full text-xs border border-slate-200 rounded p-1.5 outline-none focus:border-[#01a3a4] bg-white">
        </div>
        <div><label class="block text-[10px] text-slate-500 font-bold mb-1">{{ t('date') }}</label><input
            v-model="item.dateStr"
            class="w-full text-xs border border-slate-200 rounded p-1.5 outline-none focus:border-[#01a3a4] bg-white">
        </div>
        <div><label class="block text-[10px] text-slate-500 font-bold mb-1">{{ t('location')
            }}</label><input v-model="item.location"
            class="w-full text-xs border border-slate-200 rounded p-1.5 outline-none focus:border-[#01a3a4] bg-white">
        </div>
        <div class="col-span-2">
          <label class="block text-[10px] text-slate-500 font-bold mb-1">{{ t('description') }}</label>
          <LineNumberedTextarea v-model="item.description" :rows="2" />
        </div>
      </div>
      <div class="mt-2 border-t border-slate-200 pt-2">
        <div class="flex items-center justify-between mb-1">
          <label class="block text-[10px] text-slate-500 font-bold">
            {{ t('bulletPoints') }} <span class="font-normal">{{ t('bulletPointsHint') }}</span>
          </label>
          <div class="inline-flex border border-slate-200 rounded overflow-hidden text-[10px]">
            <button type="button" @click="item.bulletListType = 'unordered'"
              :class="item.bulletListType !== 'ordered' ? 'bg-[#01a3a4] text-white' : 'bg-white text-slate-500 hover:bg-slate-50'"
              class="px-2 py-0.5 transition-colors" :title="t('unorderedList')">
              <i class="fa-solid fa-list-ul"></i>
            </button>
            <button type="button" @click="item.bulletListType = 'ordered'"
              :class="item.bulletListType === 'ordered' ? 'bg-[#01a3a4] text-white' : 'bg-white text-slate-500 hover:bg-slate-50'"
              class="px-2 py-0.5 transition-colors border-l border-slate-200" :title="t('orderedList')">
              <i class="fa-solid fa-list-ol"></i>
            </button>
          </div>
        </div>
        <LineNumberedTextarea :model-value="item.bullets?.join('\n')"
          @update:model-value="(v: string) => item.bullets = v.split('\n').map(s => s.trim()).filter(s => s)"
          :rows="3" />
      </div>
    </div>
  </div>
</template>
