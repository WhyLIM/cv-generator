<script setup lang="ts">
import { computed, ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import type { CvData, Author, Funding } from '../types';
import { useLocale } from '../composables/useLocale';

const { t } = useLocale();

const props = defineProps<{
  data: CvData;
}>();

const formatAuthor = (author: Author) => {
  return author;
};

// 分页单元：secId 为 section id（含 custom- 前缀），part 为条目序号；part=0 的单元同时渲染该 section 的标题
type PageUnit = { secId: string; part: number };

// 分页块：from/to 为该块渲染的要点切片区间 [from, to)；
// from=0 的块同时渲染 section 标题与条目标题区（至少携带 1 条要点，避免标题孤行）；
// 不可拆分的内容块 from=0, to=0（渲染全部内容）。
type PageChunk = { secId: string; part: number; from: number; to: number };

// 每页包含的块列表；header 固定第 1 页，footer 每页底部显示
const pages = ref<{ chunks: PageChunk[] }[]>([]);
const totalPages = ref(1);
// 预览排列方向：纵向堆叠 / 横向并排（仅屏幕显示，不影响打印）
const layout = ref<'vertical' | 'horizontal'>('vertical');

const wrapperRef = ref<HTMLElement | null>(null);

// 可见 section 列表（与模板 v-if 判定保持一致）
const visibleSectionIds = computed(() => {
  const order = props.data.sectionOrder || ['education', 'employment', 'skills', 'articles', 'conferences', 'academic', 'awards'];
  const s = props.data.sectionSettings || {};
  const vis = (k: string) => s[k]?.visible !== false;
  return order.filter(secId => {
    if (secId === 'education') return props.data.education.length > 0 && vis('education');
    if (secId === 'employment') return props.data.employment.length > 0 && vis('employment');
    if (secId === 'skills') return props.data.skills.length > 0 && vis('skills');
    if (secId === 'articles') return props.data.articles.length > 0 && vis('articles');
    if (secId === 'conferences') return props.data.conferences.length > 0 && vis('conferences');
    if (secId === 'academic') {
      return (props.data.societyServices.length > 0 || props.data.reviews.length > 0 || props.data.contributions.length > 0 || props.data.fundings.length > 0) && vis('academic');
    }
    if (secId === 'awards') return props.data.awards.length > 0 && vis('awards');
    if (secId.startsWith('custom-')) {
      const cs = props.data.customSections?.find(c => 'custom-' + c.id === secId);
      return !!cs && cs.visible && (cs.items?.length || 0) > 0;
    }
    return false;
  });
});

// academic 的子块拆分（与模板渲染分组一致：四个独立子模块，受可见性控制）；
// society/reviews/contributions 各为一个整块单元（idx=-1），fundings 每条目一个单元（idx 为条目序号），
// 使基金条目间可跨页流动而非整块搬移
type AcademicSub = 'society' | 'reviews' | 'contributions' | 'fundings';

const academicUnits = computed<{ sub: AcademicSub; idx: number }[]>(() => {
  const subs = props.data.sectionSettings?.academic?.subsections;
  const out: { sub: AcademicSub; idx: number }[] = [];
  if (props.data.societyServices.length > 0 && subs?.society?.visible !== false) out.push({ sub: 'society', idx: -1 });
  if (props.data.reviews.length > 0 && subs?.reviews?.visible !== false) out.push({ sub: 'reviews', idx: -1 });
  if (props.data.contributions.length > 0 && subs?.contributions?.visible !== false) out.push({ sub: 'contributions', idx: -1 });
  if (props.data.fundings.length > 0 && subs?.fundings?.visible !== false) {
    for (let i = 0; i < props.data.fundings.length; i++) out.push({ sub: 'fundings', idx: i });
  }
  return out;
});

// part 序号 → academic 单元（模板渲染用）
const academicUnitAt = (part: number): { sub: AcademicSub; idx: number } =>
  academicUnits.value[part] || { sub: 'society', idx: -1 };

// fundings 单元对应的条目
const fundingAt = (part: number): Funding => props.data.fundings[academicUnitAt(part).idx];

// 各 section 的条目数量
const itemCount = (secId: string): number => {
  if (secId === 'education') return props.data.education.length;
  if (secId === 'employment') return props.data.employment.length;
  if (secId === 'skills') return props.data.skills.length;
  if (secId === 'articles') return props.data.articles.length;
  if (secId === 'conferences') return props.data.conferences.length;
  if (secId === 'academic') return academicUnits.value.length;
  if (secId === 'awards') return props.data.awards.length;
  if (secId.startsWith('custom-')) {
    const cs = props.data.customSections?.find(c => 'custom-' + c.id === secId);
    return cs?.items?.length || 0;
  }
  return 0;
};

// 全部单元（按可见顺序平铺；part=0 表示标题 + 首条目）
const allUnits = computed<PageUnit[]>(() => {
  const units: PageUnit[] = [];
  for (const sid of visibleSectionIds.value) {
    const n = itemCount(sid);
    for (let i = 0; i < n; i++) units.push({ secId: sid, part: i });
  }
  return units;
});

// 自定义 section 条目
const customItem = (unit: PageUnit) => {
  const cs = props.data.customSections?.find(c => 'custom-' + c.id === unit.secId);
  return cs?.items?.[unit.part];
};

// custom 单元的要点数（用于初始渲染完整块与拆分判断）
const customBulletCount = (unit: PageUnit): number => {
  if (!unit.secId.startsWith('custom-')) return 0;
  return customItem(unit)?.bullets?.length || 0;
};

// 带要点的 custom 单元（隐藏测量区的渲染源）
const splittableCustomUnits = computed(() =>
  allUnits.value.filter(x => x.secId.startsWith('custom-') && customBulletCount(x) > 0)
);

// 当前块与下一块是否属于同一 section：同 section 内条目间用紧凑间距，跨 section 用大间距
const sameSectionGap = <T extends { secId: string }>(list: T[], i: number): boolean => {
  const next = list[i + 1];
  return !!next && next.secId === list[i].secId;
};

// 可拆单元的拆分测量信息；headH 为标题区高度（含 section 标题，不含 ul 上边距与块下边距）
type SplitInfo = {
  splittable: boolean;
  headH: number;
  bullets: number[];
  gap: number;
  ulMt: number;
  mb: number;
};

// 测量 custom 单元的可拆分信息；仅带要点的 custom 条目可拆，其余不可拆
const measureSplit = (node: HTMLElement | null, unit: PageUnit): SplitInfo => {
  const empty: SplitInfo = { splittable: false, headH: 0, bullets: [], gap: 0, ulMt: 0, mb: 0 };
  if (!node || !unit.secId.startsWith('custom-')) return empty;
  const item = customItem(unit);
  const bl = item?.bullets;
  if (!bl || bl.length === 0) return empty;

  const cs = getComputedStyle(node);
  const mb = parseFloat(cs.marginBottom) || 0;
  // 使用 offsetHeight 而非 getBoundingClientRect().height：offsetHeight 不受祖先 transform: scale 影响，
  // 这样预览缩放（previewScale，作用于 .preview-zoom-wrapper 的 transform）不会干扰分页测量
  const total = node.offsetHeight + mb;
  const ul = node.querySelector('ul');
  const ulMt = ul ? (parseFloat(getComputedStyle(ul).marginTop) || 0) : 0;
  const lis = Array.from(node.querySelectorAll('li'));
  const bullets = lis.map(li => li.offsetHeight);
  if (bullets.length === 0) return empty;
  // li 间距：用 computed marginTop + marginBottom 之和（不受 transform: scale 影响）；
  // 兼容 space-y 在不同 Tailwind 版本下的实现差异（v3=margin-top / v4=margin-bottom）
  const liGap = lis.length >= 2
    ? Math.max(0, (parseFloat(getComputedStyle(lis[0]).marginBottom) || 0) + (parseFloat(getComputedStyle(lis[1]).marginTop) || 0))
    : 0;
  const sumB = bullets.reduce((a, b) => a + b, 0);
  const headH = Math.max(0, total - sumB - (bullets.length - 1) * liGap - ulMt - mb);
  return { splittable: true, headH, bullets, gap: liGap, ulMt, mb };
};

// 每页样式：字体缩放通过 font-size 驱动（模板内字号统一用 em），padding 直接用 mm。
// 这样预览与打印表现完全一致，避免了 zoom 在打印时把内容缩小到 A4 左上角的问题。
const pageCss = computed(() => {
  const fontFamily = [
    props.data.fontFamily || 'Inter',
    props.data.fontFamilyZh || "'Noto Sans SC'",
    'ui-sans-serif',
    'system-ui',
    'sans-serif',
  ].join(', ');
  const scale = props.data.fontScale || 1;
  return {
    '--theme-color': props.data.themeColor,
    '--font-scale': scale,
    fontFamily,
    // 14px 为 .page 基准字号；模板内字号一律用 em 相对该值，font-size 变化时整体等比缩放
    fontSize: `${14 * scale}px`,
    padding: 'var(--print-margin-v) var(--print-margin-h)',
  };
});

let resizeObserver: ResizeObserver | null = null;
let measureRaf = 0;

// 测量各单元高度 → 按 A4 页贪心分配（自定义 section 支持要点级跨页拆分）→ 更新 pages
const measureAndAssign = () => {
  const el = wrapperRef.value;
  if (!el) return;
  const units = allUnits.value;

  // 若存在未渲染的可见单元（首次渲染 / 数据新增），先重建单页再测
  const missing = units.some(u => !el.querySelector(`[id="unit-${u.secId}-${u.part}-0"]`));
  if (missing) {
    pages.value = [{ chunks: units.map(u => ({ secId: u.secId, part: u.part, from: 0, to: customBulletCount(u) })) }];
    totalPages.value = 1;
    nextTick(() => requestAnimationFrame(measureAndAssign));
    return;
  }

  // 页面高、padding、页脚 rect 均返回布局 px（.page 固定 210×297mm，padding 为 mm）；
  // 块高度基于不含 paddingTop 的坐标系（内容从 paddingTop 之后开始排布），
  // 内容可用高度 = 页面高 - 上 padding - 下 padding - 页脚高（页脚固定于底部 padding 区域上方）；
  // 额外扣除 20px 安全余量，避免块边界与页脚紧贴导致末行与页脚重叠
  // offsetHeight 不受 transform: scale 影响（previewScale 作用于 .preview-zoom-wrapper），
  // 保证预览缩放时测量仍读真实未缩放尺寸
  const pageEl = el.querySelector('.page') as HTMLElement | null;
  const pageRectH = pageEl ? pageEl.offsetHeight : (297 / 25.4 * 96);
  const pageCs = pageEl ? getComputedStyle(pageEl) : null;
  const padTop = pageCs ? (parseFloat(pageCs.paddingTop) || 0) : 0;
  const padBottom = pageCs ? (parseFloat(pageCs.paddingBottom) || 0) : 0;
  const footerEl = el.querySelector('.cv-footer-block') as HTMLElement | null;
  const footerH = footerEl ? footerEl.offsetHeight : 0;
  const pageContentH = pageRectH - padTop - padBottom - footerH - 20;

  // 块高度 = offsetHeight（不受 transform: scale 影响）+ 下 margin（上 margin 归上一块的下 margin，避免重复计算）
  const measureUnit = (node: HTMLElement | null) => {
    if (!node) return 0;
    const cs = getComputedStyle(node);
    const mb = parseFloat(cs.marginBottom) || 0;
    return node.offsetHeight + mb;
  };

  const headerEl = el.querySelector('#section-personal') as HTMLElement | null;
  const headerH = measureUnit(headerEl);

  const unitHeights = new Map<string, number>();
  const splitInfos = new Map<string, SplitInfo>();
  for (const u of units) {
    const key = u.secId + '-' + u.part;
    const node = el.querySelector(`[id="unit-${u.secId}-${u.part}-0"]`) as HTMLElement | null;
    unitHeights.set(key, measureUnit(node));
    // 可拆单元（带要点的 custom）从隐藏测量区读取完整块：页面块会被 from/to 切片渲染，收敛迭代中不再是完整测量源
    const mvNode = (u.secId.startsWith('custom-') && customBulletCount(u) > 0)
      ? (el.querySelector(`[id="mv-${u.secId}-${u.part}"]`) as HTMLElement | null)
      : node;
    splitInfos.set(key, measureSplit(mvNode, u));
  }

  // 贪心分配：依次放置块；可拆单元放不下时拆出本页能容纳的要点，剩余要点续到下一页；
  // 不可拆单元整体换页；header 固定第一页顶部
  const out: { chunks: PageChunk[] }[] = [];
  let cur: PageChunk[] = [];
  let y = headerH;

  let ui = 0;
  while (ui < units.length) {
    const u = units[ui];
    const key = u.secId + '-' + u.part;
    const si = splitInfos.get(key);

    // 不可拆单元：整体放置
    if (!si || !si.splittable) {
      const h = unitHeights.get(key) || 0;
      if (y + h > pageContentH) {
        if (cur.length > 0) { out.push({ chunks: cur }); cur = []; y = 0; }
      }
      cur.push({ secId: u.secId, part: u.part, from: 0, to: 0 });
      y += h;
      ui++;
      continue;
    }

    // 可拆单元：从 from 起逐块放置；from=0 的块含标题区且至少携带 1 条要点（避免标题孤行）
    const n = si.bullets.length;
    let from = 0;
    while (from < n) {
      // 本页从 from 起能容纳的要点数 [from, b)
      let acc = si.ulMt + (from === 0 ? si.headH : 0) + si.mb;
      let b = from;
      for (; b < n; b++) {
        const add = si.bullets[b] + (b > from ? si.gap : 0);
        if (acc + add > pageContentH - y) break;
        acc += add;
      }
      if (b === from) {
        // 一条都放不下：先换页再试；空页仍放不下则强制放置（允许该页溢出）
        if (cur.length > 0) { out.push({ chunks: cur }); cur = []; y = 0; continue; }
        const h1 = si.ulMt + (from === 0 ? si.headH : 0) + si.mb + si.bullets[from];
        cur.push({ secId: u.secId, part: u.part, from, to: from + 1 });
        y = h1;
        from += 1;
        if (from < n) { out.push({ chunks: cur }); cur = []; y = 0; }
        continue;
      }
      cur.push({ secId: u.secId, part: u.part, from, to: b });
      y += acc;
      from = b;
      if (from < n) { out.push({ chunks: cur }); cur = []; y = 0; }
    }
    ui++;
  }
  out.push({ chunks: cur });
  if (out.length === 0) out.push({ chunks: [] });

  const next = JSON.stringify(out);
  if (next !== JSON.stringify(pages.value.map(p => ({ chunks: p.chunks })))) {
    pages.value = out;
    totalPages.value = out.length;
    // 页数变化后块高应稳定，再测一次确认收敛
    nextTick(() => requestAnimationFrame(measureAndAssign));
  }
};

const scheduleMeasure = () => {
  cancelAnimationFrame(measureRaf);
  measureRaf = requestAnimationFrame(measureAndAssign);
};

watch(() => props.data, () => {
  nextTick(scheduleMeasure);
}, { deep: true });

// 排列方向变化后容器尺寸变化，重新测量
watch(layout, () => {
  nextTick(scheduleMeasure);
});

onMounted(() => {
  resizeObserver = new ResizeObserver(scheduleMeasure);
  if (wrapperRef.value) resizeObserver.observe(wrapperRef.value);
  if (document.fonts?.ready) document.fonts.ready.then(scheduleMeasure);
  nextTick(scheduleMeasure);
});

onBeforeUnmount(() => {
  if (resizeObserver) resizeObserver.disconnect();
  cancelAnimationFrame(measureRaf);
});
</script>

<template>
  <div ref="wrapperRef" class="cv-pages flex flex-col items-center gap-8">

    <!-- 排列方向切换（仅屏幕显示；固定在页面上方，横向滚动时仍可见） -->
    <div class="no-print w-full flex justify-center gap-2 pb-1 shrink-0">
      <button @click="layout = 'vertical'" :title="t('verticalLayout')"
        :class="layout === 'vertical' ? 'bg-[#01a3a4] text-white border-[#01a3a4]' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'"
        class="w-8 h-8 rounded-lg border flex items-center justify-center text-[1em] transition-colors shadow-sm">
        <i class="fa-solid fa-arrows-up-down"></i>
      </button>
      <button @click="layout = 'horizontal'" :title="t('horizontalLayout')"
        :class="layout === 'horizontal' ? 'bg-[#01a3a4] text-white border-[#01a3a4]' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'"
        class="w-8 h-8 rounded-lg border flex items-center justify-center text-[1em] transition-colors shadow-sm">
        <i class="fa-solid fa-arrows-left-right"></i>
      </button>
    </div>

    <!-- 页面条：纵向堆叠 / 横向并排；横向溢出时使用外层预览窗口的滚动条 -->
    <div class="pages-strip w-full flex gap-8"
      :class="layout === 'horizontal' ? 'flex-row flex-nowrap items-start justify-start px-4' : 'flex-col items-center'">

      <div v-for="(page, pi) in pages" :key="pi"
        class="page relative bg-white text-slate-800 w-[210mm] h-[297mm] shrink-0 block leading-relaxed overflow-hidden shadow-xl print:shadow-none"
        :class="{ 'page-last': pi === pages.length - 1 }" :style="pageCss">

        <!-- PROFILE PHOTO (Floated Top-Right) -->
        <div v-if="pi === 0 && data.personal.showPhoto && data.personal.photoUrl"
          class="float-right ml-6 mb-2 mt-2 w-[26mm] h-[36mm] shrink-0 border border-slate-200 p-0.5 bg-white shadow-sm relative z-10">
          <img :src="data.personal.photoUrl" class="w-full h-full object-cover block" />
        </div>

        <!-- HEADER -->
        <header v-if="pi === 0" id="section-personal" class="mb-5 pb-3 border-b-2 flex justify-between items-end gap-4"
          style="border-color: var(--theme-color);">
          <div class="pb-1">
            <h1 class="text-[2.1429em] font-bold text-slate-900 leading-none mb-2">
              {{ data.personal.name }} <span v-if="data.personal.nameZh" class="ml-1 font-semibold">({{
                data.personal.nameZh }})</span>
            </h1>
            <p v-if="data.personal.showDocumentTitle !== false" class="font-medium" style="color: var(--theme-color)">{{
              data.personal.documentTitle || 'Curriculum Vitae' }}</p>
          </div>

          <div class="flex flex-col text-[0.7857em] text-slate-500 space-y-1 text-right pb-1">
            <template
              v-for="link in (data.personal.contactLinks || []).filter(l => l.visible !== false && (l.label || l.url))"
              :key="link.id">
              <p class="flex gap-1 items-center justify-end">
                <i :class="(link.icon || 'fa-solid fa-link') + ' text-[0.7143em] w-3 text-center'"></i>
                <a v-if="link.url" :href="link.url" target="_blank" rel="noopener" class="hover:underline">{{ link.label
                  || link.url.replace(/^(tel:|mailto:|https?:\/\/)/, '') }}</a>
                <span v-else>{{ link.label }}</span>
              </p>
            </template>
          </div>
        </header>

        <!-- 分页块：part=0 且 from=0 的块渲染标题 + 首条目；from>0 为续页块（仅渲染剩余要点） -->
        <template v-for="(unit, ui) in page.chunks" :key="unit.secId + '-' + unit.part + '-' + unit.from">
          <!-- UNIT: EDUCATION -->
          <template v-if="unit.secId === 'education'">
            <div :id="'unit-education-' + unit.part + '-' + unit.from" class="page-unit"
              :class="sameSectionGap(page.chunks, ui) ? 'mb-2.5' : 'mb-6'">
              <h2 v-if="unit.part === 0"
                class="text-[1em] font-bold uppercase tracking-widest border-l-4 pl-3 mb-4 flex items-center gap-2"
                style="color: var(--theme-color); border-color: var(--theme-color);">
                {{ data.sectionSettings?.education?.title || data.customTitles?.education || 'EDUCATION' }}
              </h2>
              <div class="pl-1">
                <div class="flex justify-between items-baseline mb-1">
                  <p class="text-[0.8571em] text-slate-600 leading-snug">
                    <span class="font-semibold text-slate-900 text-[1em]">{{ data.education[unit.part].institution
                      }}</span><br />
                    {{ data.education[unit.part].degree }}, {{ data.education[unit.part].location }}
                  </p>
                  <span class="text-[0.7857em] text-slate-500 whitespace-nowrap">{{ data.education[unit.part].startDate
                    }} – {{ data.education[unit.part].endDate }}</span>
                </div>
              </div>
            </div>
          </template>

          <!-- UNIT: EMPLOYMENT -->
          <template v-else-if="unit.secId === 'employment'">
            <div :id="'unit-employment-' + unit.part + '-' + unit.from" class="page-unit"
              :class="sameSectionGap(page.chunks, ui) ? 'mb-2.5' : 'mb-6'">
              <h2 v-if="unit.part === 0"
                class="text-[1em] font-bold uppercase tracking-widest border-l-4 pl-3 mb-4 flex items-center gap-2"
                style="color: var(--theme-color); border-color: var(--theme-color);">
                {{ data.sectionSettings?.employment?.title || data.customTitles?.employment || 'EMPLOYMENT' }}
              </h2>
              <div class="pl-1">
                <div class="flex justify-between items-baseline mb-1">
                  <h3 class="text-[1em] font-bold text-slate-900">{{ data.employment[unit.part].role }}</h3>
                  <span class="text-[0.7857em] text-slate-500 whitespace-nowrap">{{ data.employment[unit.part].startDate
                    }} – {{ data.employment[unit.part].endDate }}</span>
                </div>
                <p class="text-[0.8571em] text-slate-600">
                  {{ data.employment[unit.part].institution }}, {{ data.employment[unit.part].location }}
                </p>
                <p v-if="data.employment[unit.part].description"
                  class="text-[0.8571em] text-slate-600 leading-relaxed mt-1">
                  {{ data.employment[unit.part].description }}
                </p>
              </div>
            </div>
          </template>

          <!-- UNIT: SKILLS -->
          <template v-else-if="unit.secId === 'skills'">
            <div :id="'unit-skills-' + unit.part + '-' + unit.from" class="page-unit"
              :class="sameSectionGap(page.chunks, ui) ? 'mb-2.5' : 'mb-6'">
              <h2 v-if="unit.part === 0"
                class="text-[1em] font-bold uppercase tracking-widest border-l-4 pl-3 mb-4 flex items-center gap-2"
                style="color: var(--theme-color); border-color: var(--theme-color);">
                {{ data.sectionSettings?.skills?.title || data.customTitles?.skills || 'SKILLS' }}
              </h2>
              <ul class="pl-1">
                <li class="text-[0.8571em] text-slate-700 leading-relaxed">
                  <span class="font-semibold text-slate-900 pr-2 mr-2 border-r border-slate-300">
                    <i v-if="data.skills[unit.part].icon" :class="data.skills[unit.part].icon"
                      class="w-4 text-center mr-1 text-slate-500"></i>
                    {{ data.skills[unit.part].category }}
                  </span>
                  <template v-for="(item, idx) in data.skills[unit.part].items" :key="idx">
                    {{ item }}{{ idx < data.skills[unit.part].items.length - 1 ? ', ' : '' }} </template>
                </li>
              </ul>
            </div>
          </template>

          <!-- UNIT: ARTICLES -->
          <template v-else-if="unit.secId === 'articles'">
            <div :id="'unit-articles-' + unit.part + '-' + unit.from" class="page-unit"
              :class="sameSectionGap(page.chunks, ui) ? 'mb-2.5' : 'mb-6'">
              <h2 v-if="unit.part === 0"
                class="text-[1em] font-bold uppercase tracking-widest border-l-4 pl-3 mb-4 flex items-center gap-2"
                style="color: var(--theme-color); border-color: var(--theme-color);">
                {{ data.sectionSettings?.articles?.title || data.customTitles?.articles || 'PEER-REVIEWED ARTICLES' }}
              </h2>
              <div class="pl-1">
                <div class="flex">
                  <span class="text-[1em] text-slate-500 w-5 shrink-0 leading-snug">{{ unit.part + 1 }}.</span>
                  <div>
                    <p class="text-[1em] text-slate-900 leading-snug">
                      <!-- Author list -->
                      <template v-for="(au, idx) in data.articles[unit.part].authors" :key="idx">
                        <span
                          :class="{ 'font-semibold underline decoration-2': au.isMe, 'decoration-[#01a3a4]': au.isMe }"
                          :style="au.isMe ? `text-decoration-color: var(--theme-color)` : ''">{{ au.name }}</span>
                        <sup v-if="au.isFirst">#</sup><sup v-if="au.isCorresponding">*</sup>
                        <span v-if="idx < data.articles[unit.part].authors.length - 1">, </span>
                      </template>

                      <!-- Title and Journal Details -->
                      <span class="text-slate-600 italic ml-1">"{{ data.articles[unit.part].title }}"</span>
                      <span class="font-semibold ml-1">{{ data.articles[unit.part].journal }}</span> <template
                        v-if="data.articles[unit.part].year">{{ data.articles[unit.part].year }}.</template>
                      <template v-if="data.articles[unit.part].volumeAndIssue">{{
                        data.articles[unit.part].volumeAndIssue }}.</template>
                      <span v-if="data.articles[unit.part].doi"
                        class="text-[0.7857em] text-slate-500 ml-1 break-all">
                        DOI: <a :href="'https://doi.org/' + data.articles[unit.part].doi" target="_blank" rel="noopener"
                          class="hover:underline">{{ data.articles[unit.part].doi }}</a>
                      </span>
                      <span v-if="data.articles[unit.part].impactFactor > 0"
                        class="inline-block ml-1 px-1.5 py-0.5 text-[0.7143em] font-bold rounded"
                        style="color: var(--theme-color); background-color: color-mix(in srgb, var(--theme-color) 12%, transparent);">
                        IF: {{ data.articles[unit.part].impactFactor.toFixed(1) }}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- UNIT: CONFERENCES -->
          <template v-else-if="unit.secId === 'conferences'">
            <div :id="'unit-conferences-' + unit.part + '-' + unit.from" class="page-unit"
              :class="sameSectionGap(page.chunks, ui) ? 'mb-2.5' : 'mb-6'">
              <h2 v-if="unit.part === 0"
                class="text-[1em] font-bold uppercase tracking-widest border-l-4 pl-3 mb-4 flex items-center gap-2"
                style="color: var(--theme-color); border-color: var(--theme-color);">
                {{ data.sectionSettings?.conferences?.title || data.customTitles?.conferences || 'CONFERENCE PROCEEDINGS' }}
              </h2>
              <div class="pl-1">
                <div class="flex justify-between items-baseline mb-1">
                  <div>
                    <h3 class="text-[1em] font-bold text-slate-900">{{ data.conferences[unit.part].name }}</h3>
                    <p class="text-[0.8571em] text-slate-600">{{ data.conferences[unit.part].location }} — <strong>{{
                      data.conferences[unit.part].type }}</strong></p>
                  </div>
                  <span class="text-[0.7857em] text-slate-500 whitespace-nowrap ml-4">{{
                    data.conferences[unit.part].dateStr }}</span>
                </div>
              </div>
            </div>
          </template>

          <!-- UNIT: ACADEMIC (按子块拆分) -->
          <template v-else-if="unit.secId === 'academic'">
            <div :id="'unit-academic-' + unit.part + '-' + unit.from" class="page-unit"
              :class="sameSectionGap(page.chunks, ui) ? 'mb-2.5' : 'mb-6'">
              <h2 v-if="unit.part === 0"
                class="text-[1em] font-bold uppercase tracking-widest border-l-4 pl-3 mb-4 flex items-center gap-2"
                style="color: var(--theme-color); border-color: var(--theme-color);">
                {{ data.sectionSettings?.academic?.title || data.customTitles?.academic || 'ACADEMIC CONTRIBUTIONS' }}
              </h2>
              <div class="pl-1">
                <!-- 学术团体 -->
                <template v-if="academicUnitAt(unit.part).sub === 'society'">
                  <h3 class="font-bold text-slate-900 text-[0.8571em] mb-1">{{
                    data.sectionSettings?.academic?.subsections?.society?.title || 'Societies and Associations' }}</h3>
                  <div v-for="item in data.societyServices" :key="item.id" class="mb-2">
                    <div v-if="item.title" class="flex justify-between items-baseline mb-0.5">
                      <h4 class="text-[0.9286em] font-bold text-slate-900">{{ item.title }}</h4>
                      <span v-if="item.dateStr" class="text-[0.7857em] text-slate-500 whitespace-nowrap ml-4">{{
                        item.dateStr }}</span>
                    </div>
                    <p v-if="item.subtitle || item.location"
                      class="text-[0.8571em] font-semibold text-slate-800 mb-0.5">
                      {{ item.subtitle }}<span v-if="item.subtitle && item.location">, </span>{{ item.location }}
                    </p>
                    <p v-if="item.description" class="text-[0.8571em] text-slate-600 leading-snug mb-1 text-justify">
                      {{ item.description }}</p>
                    <ul v-if="item.bullets && item.bullets.length > 0" class="space-y-1 mt-1 list-none">
                      <li v-for="(bullet, bIdx) in item.bullets" :key="bIdx"
                        class="text-[0.8571em] text-slate-600 grid grid-cols-[1.5em_1fr] gap-0">
                        <span class="text-center text-slate-500">{{ item.bulletListType === 'ordered' ? (bIdx + 1) + '.'
                          : '•' }}</span>
                        <span class="text-justify">{{ bullet }}</span>
                      </li>
                    </ul>
                  </div>
                </template>
                <!-- 审稿 -->
                <template v-else-if="academicUnitAt(unit.part).sub === 'reviews'">
                  <h3 class="font-bold text-slate-900 text-[0.8571em] mb-1">{{
                    data.sectionSettings?.academic?.subsections?.reviews?.title || 'Research Services' }}</h3>
                  <div v-for="item in data.reviews" :key="item.id" class="mb-2">
                    <div v-if="item.title" class="flex justify-between items-baseline mb-0.5">
                      <h4 class="text-[0.9286em] font-bold text-slate-900">{{ item.title }}</h4>
                      <span v-if="item.dateStr" class="text-[0.7857em] text-slate-500 whitespace-nowrap ml-4">{{
                        item.dateStr }}</span>
                    </div>
                    <p v-if="item.subtitle || item.location"
                      class="text-[0.8571em] font-semibold text-slate-800 mb-0.5">
                      {{ item.subtitle }}<span v-if="item.subtitle && item.location">, </span>{{ item.location }}
                    </p>
                    <p v-if="item.description" class="text-[0.8571em] text-slate-600 leading-snug mb-1 text-justify">
                      {{ item.description }}</p>
                    <ul v-if="item.bullets && item.bullets.length > 0" class="space-y-1 mt-1 list-none">
                      <li v-for="(bullet, bIdx) in item.bullets" :key="bIdx"
                        class="text-[0.8571em] text-slate-600 grid grid-cols-[1.5em_1fr] gap-0">
                        <span class="text-center text-slate-500">{{ item.bulletListType === 'ordered' ? (bIdx + 1) + '.'
                          : '•' }}</span>
                        <span class="text-justify">{{ bullet }}</span>
                      </li>
                    </ul>
                  </div>
                </template>
                <!-- 学术贡献 -->
                <template v-else-if="academicUnitAt(unit.part).sub === 'contributions'">
                  <h3 class="font-bold text-slate-900 text-[0.8571em] mb-1">{{
                    data.sectionSettings?.academic?.subsections?.contributions?.title || 'Academic Contributions' }}
                  </h3>
                  <div v-for="item in data.contributions" :key="item.id" class="mb-2">
                    <div v-if="item.title" class="flex justify-between items-baseline mb-0.5">
                      <h4 class="text-[0.9286em] font-bold text-slate-900">{{ item.title }}</h4>
                      <span v-if="item.dateStr" class="text-[0.7857em] text-slate-500 whitespace-nowrap ml-4">{{
                        item.dateStr }}</span>
                    </div>
                    <p v-if="item.subtitle || item.location"
                      class="text-[0.8571em] font-semibold text-slate-800 mb-0.5">
                      {{ item.subtitle }}<span v-if="item.subtitle && item.location">, </span>{{ item.location }}
                    </p>
                    <p v-if="item.description" class="text-[0.8571em] text-slate-600 leading-snug mb-1 text-justify">
                      {{ item.description }}</p>
                    <ul v-if="item.bullets && item.bullets.length > 0" class="space-y-1 mt-1 list-none">
                      <li v-for="(bullet, bIdx) in item.bullets" :key="bIdx"
                        class="text-[0.8571em] text-slate-600 grid grid-cols-[1.5em_1fr] gap-0">
                        <span class="text-center text-slate-500">{{ item.bulletListType === 'ordered' ? (bIdx + 1) + '.'
                          : '•' }}</span>
                        <span class="text-justify">{{ bullet }}</span>
                      </li>
                    </ul>
                  </div>
                </template>
                <!-- 基金项目（条目级分页单元：每条目独立，可跨页流动；子模块标题跟随第一个条目） -->
                <template v-else-if="academicUnitAt(unit.part).sub === 'fundings'">
                  <h3 v-if="academicUnitAt(unit.part).idx === 0" class="font-bold text-slate-900 text-[0.8571em] mb-1">
                    {{
                      data.sectionSettings?.academic?.subsections?.fundings?.title || 'Research Fundings' }}</h3>
                  <p class="text-[0.8571em] text-slate-600 leading-relaxed">
                    <strong>{{ fundingAt(unit.part).source }}</strong>, Grant No. <strong>{{
                      fundingAt(unit.part).grantNo }}</strong> ({{ fundingAt(unit.part).period }})<br />
                    <span class="italic">{{ fundingAt(unit.part).title }}</span> — <strong>{{
                      fundingAt(unit.part).role }}</strong>
                  </p>
                </template>
              </div>
            </div>
          </template>

          <!-- UNIT: AWARDS -->
          <template v-else-if="unit.secId === 'awards'">
            <div :id="'unit-awards-' + unit.part + '-' + unit.from" class="page-unit"
              :class="sameSectionGap(page.chunks, ui) ? 'mb-2.5' : 'mb-6'">
              <h2 v-if="unit.part === 0"
                class="text-[1em] font-bold uppercase tracking-widest border-l-4 pl-3 mb-4 flex items-center gap-2"
                style="color: var(--theme-color); border-color: var(--theme-color);">
                {{ data.sectionSettings?.awards?.title || data.customTitles?.awards || 'AWARDS & HONORS' }}
              </h2>
              <div class="pl-1">
                <div class="flex justify-between items-baseline mb-0.5">
                  <h3 class="text-[1em] font-bold text-slate-900">{{ data.awards[unit.part].title }}</h3>
                  <span class="text-[0.7857em] text-slate-500 whitespace-nowrap ml-4">{{ data.awards[unit.part].dateStr
                    }}</span>
                </div>
                <p class="text-[0.8571em] text-slate-600 leading-snug">
                  <strong style="color: var(--theme-color)">{{ data.awards[unit.part].issuer }}</strong> — {{
                    data.awards[unit.part].description }}
                  <span v-if="data.awards[unit.part].links && data.awards[unit.part].links.length > 0"
                    class="inline-flex gap-2 ml-1">
                    <template v-for="(link, i) in data.awards[unit.part].links" :key="i">
                      <a :href="link.url" target="_blank" rel="noopener"
                        class="text-[0.7857em] underline decoration-dotted">{{ link.label }}</a>
                    </template>
                  </span>
                </p>
              </div>
            </div>
          </template>

          <!-- UNIT: CUSTOM SECTION（from>0 为续页块，仅渲染剩余要点，不重复标题） -->
          <template v-else-if="unit.secId.startsWith('custom-')">
            <div :id="'unit-' + unit.secId + '-' + unit.part + '-' + unit.from" class="page-unit"
              :class="sameSectionGap(page.chunks, ui) ? 'mb-2.5' : 'mb-6'">
              <h2 v-if="unit.part === 0 && unit.from === 0"
                class="text-[1em] font-bold uppercase tracking-widest border-l-4 pl-3 mb-4 flex items-center gap-2"
                style="color: var(--theme-color); border-color: var(--theme-color);">
                {{data.customSections?.find(c => 'custom-' + c.id === unit.secId)?.title || 'CUSTOM SECTION'}}
              </h2>
              <div class="pl-1">
                <template v-if="customItem(unit)">
                  <template v-if="unit.from === 0">
                    <div class="flex justify-between items-baseline mb-0.5">
                      <h3 class="text-[1em] font-bold text-slate-900">{{ customItem(unit).title }}</h3>
                      <span class="text-[0.7857em] text-slate-500 whitespace-nowrap ml-4">{{ customItem(unit).dateStr
                        }}</span>
                    </div>
                    <p v-if="customItem(unit).subtitle || customItem(unit).location"
                      class="text-[0.8571em] font-semibold text-slate-800 mb-0.5">
                      {{ customItem(unit).subtitle }}<span
                        v-if="customItem(unit).subtitle && customItem(unit).location">, </span>{{
                          customItem(unit).location }}
                    </p>
                    <p v-if="customItem(unit).description"
                      class="text-[0.8571em] text-slate-600 leading-snug mb-1 text-justify">{{
                        customItem(unit).description }}</p>
                  </template>
                  <ul v-if="customItem(unit).bullets && customItem(unit).bullets.length > 0 && unit.to > unit.from"
                    class="space-y-1 mt-1 list-none">
                    <li v-for="(bullet, bIdx) in customItem(unit).bullets.slice(unit.from, unit.to)" :key="bIdx"
                      class="text-[0.8571em] text-slate-600 grid grid-cols-[1.5em_1fr] gap-0">
                      <span class="text-center text-slate-500">{{ customItem(unit).bulletListType === 'ordered' ?
                        (unit.from + bIdx + 1) +
                        '.' : '•' }}</span>
                      <span class="text-justify">{{ bullet }}</span>
                    </li>
                  </ul>
                </template>
              </div>
            </div>
          </template>
        </template>

        <!-- FOOTER (每页底部)；两个开关均关闭时不渲染，避免残留分隔线 -->
        <footer v-if="data.personal.showFooterTitle !== false || data.personal.showLastModified !== false"
          class="cv-footer-block absolute pt-4 border-t border-slate-200"
          style="bottom: var(--print-margin-v); left: var(--print-margin-h); right: var(--print-margin-h);">
          <div class="flex justify-between items-center gap-4">
            <span v-if="data.personal.showFooterTitle !== false"
              class="text-[0.6429em] text-slate-400 uppercase tracking-widest">
              {{ t('page', { n: pi + 1 }) }}
            </span>
            <span v-if="data.personal.showLastModified !== false" class="text-[0.6429em] text-slate-400 ml-auto">
              {{ data.personal.lastModifiedText }}
            </span>
          </div>
        </footer>

        <!-- 页码（仅屏幕显示） -->
        <div class="page-num no-print absolute bottom-2 right-3 text-[9px] text-slate-300 font-medium select-none">
          {{ t('page', { n: pi + 1 }) }}
        </div>
      </div>

      <!-- 总页数（仅屏幕显示） -->
      <div v-if="pages.length > 0" class="no-print text-center py-3 shrink-0"
        :class="layout === 'vertical' ? 'w-full' : 'self-center'">
        <span
          class="inline-block px-3 py-1 text-[0.7857em] font-medium text-slate-500 bg-white border border-slate-200 rounded-full shadow-sm">
          {{ t('totalPages', { n: totalPages }) }}
        </span>
      </div>
    </div>

    <!-- 测量区（隐藏）：渲染 custom 完整单元（含全部要点），作为要点级拆分的稳定测量源。
         页面块按 from/to 切片渲染后会破坏测量源，故 measureSplit 一律基于此区测量 -->
    <div class="cv-measure-stage" aria-hidden="true"
      :style="[pageCss, { position: 'absolute', visibility: 'hidden', left: '-99999px', top: '0', width: '210mm' }]">
      <template v-for="(u, ui) in splittableCustomUnits" :key="'mv-' + u.secId + '-' + u.part">
        <div :id="'mv-' + u.secId + '-' + u.part" class="page-unit"
          :class="sameSectionGap(splittableCustomUnits, ui) ? 'mb-2.5' : 'mb-6'">
          <h2 v-if="u.part === 0"
            class="text-[1em] font-bold uppercase tracking-widest border-l-4 pl-3 mb-4 flex items-center gap-2"
            style="color: var(--theme-color); border-color: var(--theme-color);">
            {{data.customSections?.find(c => 'custom-' + c.id === u.secId)?.title || 'CUSTOM SECTION'}}
          </h2>
          <div class="pl-1">
            <template v-if="customItem(u)">
              <div class="flex justify-between items-baseline mb-0.5">
                <h3 class="text-[1em] font-bold text-slate-900">{{ customItem(u).title }}</h3>
                <span class="text-[0.7857em] text-slate-500 whitespace-nowrap ml-4">{{ customItem(u).dateStr }}</span>
              </div>
              <p v-if="customItem(u).subtitle || customItem(u).location"
                class="text-[0.8571em] font-semibold text-slate-800 mb-0.5">
                {{ customItem(u).subtitle }}<span v-if="customItem(u).subtitle && customItem(u).location">, </span>{{
                  customItem(u).location }}
              </p>
              <p v-if="customItem(u).description" class="text-[0.8571em] text-slate-600 leading-snug mb-1 text-justify">
                {{ customItem(u).description }}</p>
              <ul v-if="customItem(u).bullets && customItem(u).bullets.length > 0" class="space-y-1 mt-1 list-none">
                <li v-for="(bullet, bIdx) in customItem(u).bullets" :key="bIdx"
                  class="text-[0.8571em] text-slate-600 grid grid-cols-[1.5em_1fr] gap-0">
                  <span class="text-center text-slate-500">{{ customItem(u).bulletListType === 'ordered' ? (bIdx + 1) +
                    '.' : '•' }}</span>
                  <span class="text-justify">{{ bullet }}</span>
                </li>
              </ul>
            </template>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>