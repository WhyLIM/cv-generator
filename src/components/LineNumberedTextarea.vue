<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';

const props = withDefaults(defineProps<{
  modelValue: string;
  rows?: number;
}>(), {
  rows: 3
});
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const textareaRef = ref<HTMLTextAreaElement | null>(null);
const numbersRef = ref<HTMLDivElement | null>(null);

let ro: ResizeObserver | null = null;
let canvas: HTMLCanvasElement | null = null;
let context: CanvasRenderingContext2D | null = null;

// 仅用于响应式触发重算
const visualLineCount = ref(1);

const calcStringLines = (sentence: string, width: number): number => {
  if (!width || !context) return 1;
  const chars = Array.from(sentence);
  let lineCount = 0;
  let currentLine = '';
  for (let i = 0; i < chars.length; i++) {
    const wordWidth = context.measureText(chars[i]).width;
    const lineWidth = context.measureText(currentLine).width;
    if (lineWidth + wordWidth > width) {
      lineCount++;
      currentLine = chars[i];
    } else {
      currentLine += chars[i];
    }
  }
  if (currentLine.trim() !== '') lineCount++;
  return lineCount;
};

const calcLines = (): Array<number | ''> => {
  if (!textareaRef.value) return [];
  const ta = textareaRef.value;
  const taStyles = window.getComputedStyle(ta);
  const lines = (props.modelValue ?? '').split('\n');

  const rect = ta.getBoundingClientRect();
  const taWidth = rect.width;
  const scrollBarW = taWidth - ta.clientWidth;
  const parsePx = (v: string) => v.endsWith('px') ? parseInt(v.slice(0, -2), 10) : 0;
  const padLeft = parsePx(taStyles.paddingLeft);
  const padRight = parsePx(taStyles.paddingRight);
  const contentWidth = taWidth - padLeft - padRight - scrollBarW;

  const numLines = lines.map(line => Math.max(1, calcStringLines(line, contentWidth || 0)));

  const result: Array<number | ''> = [];
  let i = 1;
  while (numLines.length > 0) {
    const n = numLines.shift() ?? 1;
    result.push(i);
    for (let k = 1; k < n; k++) result.push('');
    i++;
  }
  return result;
};

const syncStyles = () => {
  if (!textareaRef.value || !numbersRef.value) return;
  const taStyles = window.getComputedStyle(textareaRef.value);
  const keys = ['fontFamily', 'fontSize', 'fontWeight', 'letterSpacing', 'lineHeight', 'padding'];
  keys.forEach(k => {
    (numbersRef.value!.style as any)[k] = (taStyles as any)[k];
  });
  if (canvas && context) {
    context.font = `${taStyles.fontSize} ${taStyles.fontFamily}`;
  }
};

const syncHeight = () => {
  if (!textareaRef.value || !numbersRef.value) return;
  const rect = textareaRef.value.getBoundingClientRect();
  numbersRef.value.style.height = `${rect.height}px`;
};

const renderLineNumbers = () => {
  if (!numbersRef.value) return;
  const lines = calcLines();
  visualLineCount.value = lines.length || 1;
  numbersRef.value.innerHTML = lines
    .map(n => `<div>${n === '' ? '&nbsp;' : n}</div>`)
    .join('');
};

const onScroll = () => {
  if (textareaRef.value && numbersRef.value) {
    numbersRef.value.scrollTop = textareaRef.value.scrollTop;
  }
};

const onInput = (e: Event) => {
  emit('update:modelValue', (e.target as HTMLTextAreaElement).value);
};

const init = () => {
  if (!textareaRef.value) return;
  canvas = document.createElement('canvas');
  context = canvas.getContext('2d');
  syncStyles();
  syncHeight();
  renderLineNumbers();
  if (ro) ro.disconnect();
  ro = new ResizeObserver(() => {
    syncStyles();
    syncHeight();
    renderLineNumbers();
  });
  ro.observe(textareaRef.value);
};

onMounted(() => {
  nextTick(init);
});

onBeforeUnmount(() => {
  if (ro) ro.disconnect();
  ro = null;
  canvas = null;
  context = null;
});

watch(() => props.modelValue, () => {
  nextTick(() => {
    renderLineNumbers();
  });
});

watch(() => props.rows, () => {
  nextTick(() => {
    syncHeight();
    renderLineNumbers();
  });
});
</script>

<template>
  <div class="container flex border border-slate-200 rounded overflow-hidden bg-white">
    <div
      ref="numbersRef"
      class="numbers border-r border-slate-200 overflow-hidden text-center text-slate-400 box-border bg-slate-50"
    ></div>
    <textarea
      ref="textareaRef"
      :value="modelValue"
      @input="onInput"
      @scroll="onScroll"
      :rows="rows"
      class="textarea border-none outline-none w-full text-xs px-2 py-1 box-border resize-y custom-scrollbar"
      style="font-size: 0.75rem; line-height: 1.5rem; min-height: 4rem; max-height: 30rem; overflow-x: hidden;"
    ></textarea>
  </div>
</template>

<style scoped>
.numbers {
  flex: 0 0 2rem;
  user-select: none;
  pointer-events: none;
}
.numbers > div {
  white-space: nowrap;
}
</style>
