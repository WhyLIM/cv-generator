<script setup lang="ts">
import { computed } from 'vue';
import type { CvData, Author } from '../types';

const props = defineProps<{
  data: CvData;
}>();

const formatAuthor = (author: Author) => {
  return author;
};

// Generate CSS variable for the theme color and font scale dynamically
const cssVars = computed(() => {
  return {
    '--theme-color': props.data.themeColor,
    '--font-scale': props.data.fontScale || 1,
  };
});
</script>

<template>
  <div
    class="print-container bg-white text-slate-800 w-[210mm] min-h-[297mm] mx-auto p-10 md:p-14 block text-[13px] md:text-[14px] leading-relaxed"
    :style="cssVars">

    <!-- PROFILE PHOTO (Floated Top-Right) -->
    <div v-if="data.personal.showPhoto && data.personal.photoUrl"
      class="float-right ml-6 mb-2 mt-2 w-[26mm] h-[36mm] shrink-0 border border-slate-200 p-0.5 bg-white shadow-sm relative z-10">
      <img :src="data.personal.photoUrl" class="w-full h-full object-cover block" />
    </div>

    <!-- HEADER -->
    <header id="section-personal" class="mb-5 pb-3 border-b-2 flex justify-between items-end gap-4"
      style="border-color: var(--theme-color);">
      <div class="pb-1">
        <h1 class="text-3xl font-bold text-slate-900 leading-none mb-2">
          {{ data.personal.name }} <span v-if="data.personal.nameZh" class="font-sans ml-1 text-2xl font-semibold">({{
            data.personal.nameZh }})</span>
        </h1>
        <p v-if="data.personal.showDocumentTitle !== false" class="font-medium" style="color: var(--theme-color)">{{
          data.personal.documentTitle || 'Curriculum Vitae' }}</p>
      </div>

      <div class="flex flex-col text-[11px] text-slate-500 space-y-1 text-right pb-1">
        <p v-if="data.personal.phone" class="flex gap-1.5 items-center justify-end"><i
            class="fa-solid fa-phone text-[10px] w-3 text-center"></i> {{ data.personal.phone }}</p>
        <p v-if="data.personal.email" class="flex gap-1.5 items-center justify-end"><i
            class="fa-solid fa-envelope text-[10px] w-3 text-center"></i> <a :href="'mailto:' + data.personal.email"
            class="hover:underline">{{ data.personal.email }}</a></p>
        <p v-if="data.personal.github" class="flex gap-1.5 items-center justify-end"><i
            class="fa-brands fa-github text-[11px] w-3 text-center"></i> <a :href="data.personal.githubUrl"
            target="_blank" class="hover:underline">{{ data.personal.githubUrl.replace('https://', '') }}</a></p>
        <p v-if="data.personal.website" class="flex gap-1.5 items-center justify-end"><i
            class="fa-solid fa-link text-[10px] w-3 text-center"></i> <a :href="data.personal.websiteUrl"
            target="_blank" class="hover:underline">{{ data.personal.websiteUrl.replace('https://', '') }}</a></p>
      </div>
    </header>

    <template
      v-for="secId in (data.sectionOrder || ['education', 'employment', 'skills', 'articles', 'conferences', 'academic', 'awards'])"
      :key="secId">
      <!-- SECTION: EDUCATION -->
      <section :id="'section-' + secId"
        v-if="secId === 'education' && data.education.length > 0 && data.sectionSettings?.education?.visible !== false"
        class="mb-6">
        <h2 class="text-xs font-bold uppercase tracking-widest border-l-4 pl-3 mb-4 flex items-center gap-2"
          style="color: var(--theme-color); border-color: var(--theme-color);">
          {{ data.sectionSettings?.education?.title || data.customTitles?.education || 'EDUCATION' }}
        </h2>
        <div class="space-y-3 pl-1">
          <div v-for="ed in data.education" :key="ed.id" class="flex justify-between items-baseline mb-1">
            <p class="text-xs text-slate-600 leading-snug">
              <span class="font-semibold text-slate-900 text-sm">{{ ed.institution }}</span><br />
              {{ ed.degree }}, {{ ed.location }}
            </p>
            <span class="text-[11px] text-slate-500 whitespace-nowrap">{{ ed.startDate }} – {{ ed.endDate }}</span>
          </div>
        </div>
      </section>

      <!-- SECTION: EMPLOYMENT -->
      <section :id="'section-' + secId"
        v-else-if="secId === 'employment' && data.employment.length > 0 && data.sectionSettings?.employment?.visible !== false"
        class="mb-6">
        <h2 class="text-xs font-bold uppercase tracking-widest border-l-4 pl-3 mb-4 flex items-center gap-2"
          style="color: var(--theme-color); border-color: var(--theme-color);">
          {{ data.sectionSettings?.employment?.title || data.customTitles?.employment || 'EMPLOYMENT' }}
        </h2>
        <div class="space-y-3 pl-1">
          <div v-for="em in data.employment" :key="em.id">
            <div class="flex justify-between items-baseline mb-1">
              <h3 class="text-sm font-bold text-slate-900">{{ em.role }}</h3>
              <span class="text-[11px] text-slate-500 whitespace-nowrap">{{ em.startDate }} – {{ em.endDate }}</span>
            </div>
            <p class="text-[12px] text-slate-600">
              {{ em.institution }}, {{ em.location }}
            </p>
          </div>
        </div>
      </section>

      <!-- SECTION: SKILLS -->
      <section :id="'section-' + secId"
        v-else-if="secId === 'skills' && data.skills.length > 0 && data.sectionSettings?.skills?.visible !== false"
        class="mb-6 break-inside-avoid">
        <h2 class="text-xs font-bold uppercase tracking-widest border-l-4 pl-3 mb-4 flex items-center gap-2"
          style="color: var(--theme-color); border-color: var(--theme-color);">
          {{ data.sectionSettings?.skills?.title || data.customTitles?.skills || 'SKILLS' }}
        </h2>
        <ul class="space-y-1.5 pl-1">
          <li v-for="sk in data.skills" :key="sk.id" class="text-xs text-slate-700 leading-relaxed">
            <span class="font-semibold text-slate-900 pr-2 mr-2 border-r border-slate-300">
              <i v-if="sk.icon" :class="sk.icon" class="w-4 text-center mr-1 text-slate-500"></i>
              {{ sk.category }}
            </span>
            <template v-for="(item, idx) in sk.items" :key="idx">
              {{ item }}{{ idx < sk.items.length - 1 ? ', ' : '' }} </template>
          </li>
        </ul>
      </section>

      <!-- SECTION: ARTICLES -->
      <section :id="'section-' + secId"
        v-else-if="secId === 'articles' && data.articles.length > 0 && data.sectionSettings?.articles?.visible !== false"
        class="mb-6 break-inside-avoid">
        <h2 class="text-xs font-bold uppercase tracking-widest border-l-4 pl-3 mb-4 flex items-center gap-2"
          style="color: var(--theme-color); border-color: var(--theme-color);">
          {{ data.sectionSettings?.articles?.title || data.customTitles?.articles || 'PEER-REVIEWED ARTICLES' }}
        </h2>
        <div class="space-y-3 pl-1">
          <div v-for="(ar, i) in data.articles" :key="ar.id">
            <div class="flex">
              <span class="text-sm text-slate-500 w-5 font-mono">{{ i + 1 }}.</span>
              <div>
                <p class="text-sm text-slate-900 leading-snug">
                  <!-- Author list -->
                  <template v-for="(au, idx) in ar.authors" :key="idx">
                    <span :class="{ 'font-semibold underline decoration-2': au.isMe, 'decoration-[#01a3a4]': au.isMe }"
                      :style="au.isMe ? `text-decoration-color: var(--theme-color)` : ''">{{ au.name }}</span>
                    <sup v-if="au.isFirst">#</sup><sup v-if="au.isCorresponding">*</sup>
                    <span v-if="idx < ar.authors.length - 1">, </span>
                  </template>

                  <!-- Title and Journal Details -->
                  <span class="text-slate-600 italic ml-1">"{{ ar.title }}"</span>
                  <span class="font-semibold ml-1">{{ ar.journal }}</span> <template v-if="ar.year">{{ ar.year
                  }}.</template>
                  <template v-if="ar.volumeAndIssue"> {{ ar.volumeAndIssue }}</template><template v-if="ar.pages">, {{
                    ar.pages }}.</template>

                  <!-- Inline links and badges -->
                  <span class="inline-flex items-center gap-1.5 ml-1.5 align-middle">
                    <a v-if="ar.doi" :href="'https://doi.org/' + ar.doi" target="_blank"
                      class="text-[10px] text-blue-600 hover:underline">doi:{{ ar.doi }}</a>
                    <span v-if="ar.impactFactor !== undefined" class="inline-flex items-center relative">
                      <img
                        :src="`https://img.shields.io/badge/${ar.impactFactor === 0 ? 'Chapter' : 'IF-' + ar.impactFactor.toFixed(1)}-%235A8693?style=flat-square&logoColor=white&color=%23${ar.impactFactor === 0 ? '0A203F' : 'F46A6A'}`"
                        alt="Impact Factor" class="h-[14px] pointer-events-none" />
                    </span>
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- SECTION: CONFERENCE PROCEEDINGS -->
      <section :id="'section-' + secId"
        v-else-if="secId === 'conferences' && data.conferences.length > 0 && data.sectionSettings?.conferences?.visible !== false"
        class="mb-6 break-inside-avoid">
        <h2 class="text-xs font-bold uppercase tracking-widest border-l-4 pl-3 mb-4 flex items-center gap-2"
          style="color: var(--theme-color); border-color: var(--theme-color);">
          {{ data.sectionSettings?.conferences?.title || data.customTitles?.conferences || 'CONFERENCE PROCEEDINGS' }}
        </h2>
        <div class="space-y-3 pl-1">
          <div v-for="cf in data.conferences" :key="cf.id" class="flex justify-between items-baseline mb-1">
            <div>
              <h3 class="text-sm font-bold text-slate-900">{{ cf.name }}</h3>
              <p class="text-[12px] text-slate-600">{{ cf.location }} — <strong>{{ cf.type }}</strong></p>
            </div>
            <span class="text-[11px] text-slate-500 whitespace-nowrap ml-4">{{ cf.dateStr }}</span>
          </div>
        </div>
      </section>

      <!-- SECTION: ACADEMIC CONTRIBUTIONS -->
      <section :id="'section-' + secId"
        v-else-if="secId === 'academic' && (data.societyServices.length > 0 || data.reviews.length > 0 || data.contributions.length > 0 || data.fundings.length > 0) && data.sectionSettings?.academic?.visible !== false"
        class="mb-6">
        <h2 class="text-xs font-bold uppercase tracking-widest border-l-4 pl-3 mb-4 flex items-center gap-2"
          style="color: var(--theme-color); border-color: var(--theme-color);">
          {{ data.sectionSettings?.academic?.title || data.customTitles?.academic || 'ACADEMIC CONTRIBUTIONS' }}
        </h2>

        <div v-if="data.societyServices.length > 0" class="mb-4 pl-1">
          <h3 class="font-bold text-slate-900 text-xs mb-1">Societies and Associations</h3>
          <ul class="space-y-1">
            <li v-for="(ss, idx) in data.societyServices" :key="idx"
              class="text-xs text-slate-600 pl-[1em] -indent-[1em]">
              <span class="inline-block w-[1em] text-center !indent-0">•</span> {{ ss }}
            </li>
          </ul>
        </div>

        <div v-if="data.reviews.length > 0 || data.contributions.length > 0" class="mb-4 pl-1">
          <h3 class="font-bold text-slate-900 text-xs mb-1">Research Services</h3>
          <ul class="space-y-1">
            <li v-for="(rv, idx) in data.reviews" :key="'rv' + idx"
              class="text-xs text-slate-600 pl-[1em] -indent-[1em]">
              <span class="inline-block w-[1em] text-center !indent-0">•</span> {{ rv }}
            </li>
            <li v-for="(ct, idx) in data.contributions" :key="'ct' + idx"
              class="text-xs text-slate-600 pl-[1em] -indent-[1em]">
              <span class="inline-block w-[1em] text-center !indent-0">•</span> <span v-html="ct"></span>
            </li>
          </ul>
        </div>

        <div v-if="data.fundings.length > 0" class="pl-1">
          <h3 class="font-bold text-slate-900 text-xs mb-1">Fundings</h3>
          <ul class="space-y-2">
            <li v-for="fd in data.fundings" :key="fd.id" class="text-xs text-slate-600">
              <strong>{{ fd.source }}</strong>, Grant No. <strong>{{ fd.grantNo }}</strong> ({{ fd.period }})<br />
              <span class="italic">{{ fd.title }}</span> — <strong>{{ fd.role }}</strong>
            </li>
          </ul>
        </div>
      </section>

      <!-- SECTION: AWARDS -->
      <section :id="'section-' + secId"
        v-else-if="secId === 'awards' && data.awards.length > 0 && data.sectionSettings?.awards?.visible !== false"
        class="mb-6">
        <h2 class="text-xs font-bold uppercase tracking-widest border-l-4 pl-3 mb-4 flex items-center gap-2"
          style="color: var(--theme-color); border-color: var(--theme-color);">
          {{ data.sectionSettings?.awards?.title || data.customTitles?.awards || 'AWARDS & HONORS' }}
        </h2>
        <div class="space-y-3 pl-1">
          <div v-for="aw in data.awards" :key="aw.id">
            <div class="flex justify-between items-baseline mb-0.5">
              <h3 class="text-sm font-bold text-slate-900">{{ aw.title }}</h3>
              <span class="text-[11px] text-slate-500 whitespace-nowrap ml-4">{{ aw.dateStr }}</span>
            </div>
            <p class="text-xs text-slate-600 leading-snug">
              <strong style="color: var(--theme-color)">{{ aw.issuer }}</strong> — {{ aw.description }}
              <span v-if="aw.links && aw.links.length > 0" class="inline-flex gap-2 ml-1">
                <template v-for="(link, i) in aw.links" :key="i">
                  <a :href="link.url" target="_blank"
                    class="text-blue-600 hover:underline border-b border-transparent hover:border-blue-600 text-[10px]">[{{
                      link.label }}]</a>
                </template>
              </span>
            </p>
          </div>
        </div>
      </section>

      <!-- SECTION: CUSTOM SECTIONS -->
      <section :id="'section-' + secId"
        v-else-if="secId.startsWith('custom-') && data.customSections?.find(c => 'custom-' + c.id === secId)?.visible && (data.customSections?.find(c => 'custom-' + c.id === secId)?.items?.length || 0) > 0"
        class="mb-6">
        <h2 class="text-xs font-bold uppercase tracking-widest border-l-4 pl-3 mb-4 flex items-center gap-2"
          style="color: var(--theme-color); border-color: var(--theme-color);">
          {{data.customSections?.find(c => 'custom-' + c.id === secId)?.title || 'CUSTOM SECTION'}}
        </h2>
        <div class="space-y-4 pl-1">
          <div v-for="item in data.customSections?.find(c => 'custom-' + c.id === secId)?.items" :key="item.id">
            <div class="flex justify-between items-baseline mb-0.5">
              <h3 class="text-sm font-bold text-slate-900">{{ item.title }}</h3>
              <span class="text-[11px] text-slate-500 whitespace-nowrap ml-4">{{ item.dateStr }}</span>
            </div>
            <div class="flex justify-between items-baseline mb-1">
              <p v-if="item.subtitle || item.location" class="text-xs font-semibold text-slate-800">
                {{ item.subtitle }}<span v-if="item.subtitle && item.location">, </span>{{ item.location }}
              </p>
            </div>
            <p v-if="item.description" class="text-xs text-slate-600 leading-snug mb-1">
              {{ item.description }}
            </p>
            <ul v-if="item.bullets && item.bullets.length > 0" class="space-y-1 mt-1">
              <li v-for="(bullet, bIdx) in item.bullets" :key="bIdx"
                class="text-xs text-slate-600 pl-[1em] -indent-[1em]">
                <span class="inline-block w-[1em] text-center !indent-0">•</span> {{ bullet }}
              </li>
            </ul>
          </div>
        </div>
      </section>
    </template>

    <!-- Bottom page indicator for UI feel -->
    <div class="flex-grow"></div>
    <div v-if="data.personal.showFooterTitle !== false || data.personal.showLastModified !== false"
      class="mt-8 pt-4 border-t border-slate-200 flex justify-between text-[9px] text-slate-400 uppercase tracking-widest mt-auto">
      <span v-if="data.personal.showFooterTitle !== false">{{ data.personal.footerTitle || 'Curriculum Vitae' }}</span>
      <span v-else></span>
      <span v-if="data.personal.showLastModified !== false">{{ data.personal.lastModifiedText || 'Last modified: 2026.04.23' }}</span>
    </div>
    <div v-else class="mt-8 pt-4 border-t border-transparent text-[8px] mt-auto"></div>
  </div>
</template>

<style scoped>
/* 防止在打印时发生尴尬的段落中断 */
:deep(section),
:deep(.mb-6) {
  page-break-inside: avoid;
  break-inside: avoid;
}

:deep(h2),
:deep(h3) {
  page-break-after: avoid;
  break-after: avoid;
}
</style>
