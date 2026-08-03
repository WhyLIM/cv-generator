<script setup lang="ts">
import { computed, ref } from 'vue';
import EditorSection from './EditorSection.vue';
import LineNumberedTextarea from './LineNumberedTextarea.vue';
import IconPicker from './IconPicker.vue';
import type { CvData } from '../types';
import { parseBibtex } from '../lib/bibtex';
import { useLocale } from '../composables/useLocale';

const { t, isZh } = useLocale();

const props = defineProps<{
  modelValue: CvData;
  activeTab: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: CvData): void;
}>();

// Mutable proxy
const data = computed({
  get: () => {
    const val = props.modelValue;
    let modified = false;
    // Auto-migrate old data CustomTitles to sectionSettings
    if (!val.sectionSettings) {
      val.sectionSettings = {
        education: { title: val.customTitles?.education || 'EDUCATION', visible: true },
        employment: { title: val.customTitles?.employment || 'EMPLOYMENT', visible: true },
        skills: { title: val.customTitles?.skills || 'SKILLS', visible: true },
        articles: { title: val.customTitles?.articles || 'PEER-REVIEWED ARTICLES', visible: true },
        conferences: { title: val.customTitles?.conferences || 'CONFERENCE PROCEEDINGS', visible: true },
        academic: { title: val.customTitles?.academic || 'ACADEMIC CONTRIBUTIONS', visible: true },
        awards: { title: val.customTitles?.awards || 'SELECTED AWARDS AND HONORS', visible: true }
      };
      if (!val.customSections) val.customSections = [];
      modified = true;
    }

    // Auto-migrate section order
    if (!val.sectionOrder) {
      val.sectionOrder = ['education', 'employment', 'skills', 'articles', 'conferences', 'academic', 'awards'];
      if (val.customSections) {
        val.customSections.forEach(cs => val.sectionOrder!.push(`custom-${cs.id}`));
      }
      modified = true;
    } else {
      // Deduplicate sectionOrder only when duplicates exist (avoid infinite loop)
      const deduped = [...new Set(val.sectionOrder)];
      if (deduped.length !== val.sectionOrder.length) {
        val.sectionOrder = deduped;
        modified = true;
      }

      // Ensure existing custom customSections are in sectionOrder
      if (val.customSections) {
        val.customSections.forEach(cs => {
          if (!val.sectionOrder!.includes(`custom-${cs.id}`)) {
            val.sectionOrder!.push(`custom-${cs.id}`);
            modified = true;
          }
        });
      }

      // Remove sectionOrder entries that don't exist in data
      const validSections = ['education', 'employment', 'skills', 'articles', 'conferences', 'academic', 'awards'];
      const customSectionIds = val.customSections ? val.customSections.map(cs => 'custom-' + cs.id) : [];
      const validOrder = val.sectionOrder.filter((id: string) => validSections.includes(id) || customSectionIds.includes(id));

      // Only update if there were duplicates or invalid entries
      if (val.sectionOrder.length !== validOrder.length) {
        val.sectionOrder = validOrder;
        modified = true;
      }
    }

    if (val.personal && val.personal.showDocumentTitle === undefined) {
      val.personal.showDocumentTitle = true;
      val.personal.documentTitle = 'Curriculum Vitae';
      modified = true;
    }

    // Migrate legacy phone/email/github/website fields into contactLinks
    if (val.personal && val.personal.contactLinks === undefined) {
      const legacy = val.personal;
      const links: any[] = [];
      if (legacy.phone) links.push({ id: generateId(), label: legacy.phone, url: 'tel:' + legacy.phone.replace(/\s+/g, ''), icon: 'fa-solid fa-phone', visible: true });
      if (legacy.email) links.push({ id: generateId(), label: legacy.email, url: 'mailto:' + legacy.email, icon: 'fa-solid fa-envelope', visible: true });
      if (legacy.githubUrl) links.push({ id: generateId(), label: legacy.github || legacy.githubUrl.replace(/^https?:\/\//, ''), url: legacy.githubUrl, icon: 'fa-brands fa-github', visible: !!legacy.github });
      if (legacy.websiteUrl) links.push({ id: generateId(), label: legacy.website || legacy.websiteUrl.replace(/^https?:\/\//, ''), url: legacy.websiteUrl, icon: 'fa-solid fa-globe', visible: !!legacy.website });
      val.personal.contactLinks = links;
      modified = true;
    }

    if (val.personal && val.personal.showFooterTitle === undefined) {
      val.personal.showFooterTitle = true;
      val.personal.footerTitle = 'Curriculum Vitae';
      val.personal.showLastModified = true;
      const lastModPrefix = isZh.value ? '最后修改日期：' : 'Last modified: ';
      val.personal.lastModifiedText = `${lastModPrefix}${new Date().toISOString().split('T')[0].replace(/-/g, '.')}`;
      modified = true;
    }

    // Initialize fontScale if not set
    if (val.fontScale === undefined) {
      val.fontScale = 1;
      modified = true;
    }

    // Initialize fontFamily if not set
    if (val.fontFamily === undefined) {
      val.fontFamily = 'Inter';
      modified = true;
    }

    // Initialize fontFamilyZh if not set
    if (val.fontFamilyZh === undefined) {
      val.fontFamilyZh = "'Noto Sans SC'";
      modified = true;
    }

    // Migrate custom items: default bulletListType
    if (val.customSections) {
      val.customSections.forEach(cs => {
        cs.items?.forEach(item => {
          if (item.bulletListType === undefined) {
            item.bulletListType = 'unordered';
            modified = true;
          }
        });
      });
    }

    if (modified) {
      emit('update:modelValue', val);
    }
    return val;
  },
  set: (val) => emit('update:modelValue', val)
});

const generateId = () => Math.random().toString(36).substr(2, 9);

// Check if a section is visible
const isSectionVisible = (secId: string): boolean => {
  if (secId.startsWith('custom-')) {
    const cId = secId.replace('custom-', '');
    return data.value.customSections?.some(c => c.id === cId && c.visible) || false;
  }
  const settings = data.value.sectionSettings;
  if (!settings) return true;
  switch (secId) {
    case 'education': return settings.education?.visible !== false;
    case 'employment': return settings.employment?.visible !== false;
    case 'skills': return settings.skills?.visible !== false;
    case 'articles': return settings.articles?.visible !== false;
    case 'conferences': return settings.conferences?.visible !== false;
    case 'academic': return settings.academic?.visible !== false;
    case 'awards': return settings.awards?.visible !== false;
    default: return true;
  }
};

// Filter visible section order
const visibleSectionOrder = computed(() => {
  return (data.value.sectionOrder || []).filter(isSectionVisible);
});

// Move section in order
const moveSection = (secId: string, direction: number) => {
  const order = data.value.sectionOrder;
  if (!order) return;
  const idx = order.indexOf(secId);
  if (idx === -1) return;
  const newIdx = idx + direction;
  if (newIdx < 0 || newIdx >= order.length) return;
  [order[idx], order[newIdx]] = [order[newIdx], order[idx]];
};

// Move item inside a list (used by collapsible items: articles, custom items)
const moveItem = (list: any[], idx: number, direction: number) => {
  if (!list) return;
  const newIdx = idx + direction;
  if (newIdx < 0 || newIdx >= list.length) return;
  [list[idx], list[newIdx]] = [list[newIdx], list[idx]];
};

// Get section title with fallback
const getSectionTitle = (secId: string): string => {
  if (secId.startsWith('custom-')) {
    const cId = secId.replace('custom-', '');
    const cSec = data.value.customSections?.find(c => c.id === cId);
    return cSec?.title || 'Custom Section';
  }
  const settings = data.value.sectionSettings;
  if (!settings) return secId;
  const titles: Record<string, string> = {
    education: settings.education?.title || 'Education',
    employment: settings.employment?.title || 'Employment',
    skills: settings.skills?.title || 'Skills',
    articles: settings.articles?.title || 'Articles',
    conferences: settings.conferences?.title || 'Conferences',
    academic: settings.academic?.title || 'Academic',
    awards: settings.awards?.title || 'Awards',
  };
  return titles[secId] || secId;
};

const addCustomSection = () => {
  const newId = generateId();
  if (!data.value.customSections) data.value.customSections = [];
  const newSection = { id: newId, title: 'MY CUSTOM SECTION', visible: true, items: [] };
  data.value.customSections.push(newSection);
  if (!data.value.sectionOrder) data.value.sectionOrder = [];
  if (!data.value.sectionOrder.includes(`custom-${newId}`)) {
    data.value.sectionOrder.push(`custom-${newId}`);
  }
};

const removeCustomSection = (index: number) => {
  if (!data.value.customSections) return;
  const secId = data.value.customSections[index].id;
  data.value.customSections.splice(index, 1);
  if (data.value.sectionOrder) {
    const oId = `custom-${secId}`;
    data.value.sectionOrder = data.value.sectionOrder.filter(id => id !== oId);
  }
};

const bibtexInput = ref('');
const handleBibtexImport = () => {
  if (!bibtexInput.value.trim()) return;
  const articles = parseBibtex(bibtexInput.value);
  if (articles.length > 0) {
    data.value.articles = [...data.value.articles, ...articles];
    bibtexInput.value = '';
  } else {
    alert("Could not extract valid entries from BibTeX. Please check formatting.");
  }
};

const handlePhotoUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      data.value.personal.photoUrl = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
};

// --- Contact link helpers ---
const addContactLink = (preset?: 'phone' | 'email' | 'github') => {
  if (!data.value.personal.contactLinks) data.value.personal.contactLinks = [];
  let newLink: any;
  if (preset === 'phone') {
    newLink = { id: generateId(), label: '', url: 'tel:', icon: 'fa-solid fa-phone', visible: true };
  } else if (preset === 'email') {
    newLink = { id: generateId(), label: '', url: 'mailto:', icon: 'fa-solid fa-envelope', visible: true };
  } else if (preset === 'github') {
    newLink = { id: generateId(), label: '', url: 'https://github.com/', icon: 'fa-brands fa-github', visible: true };
  } else {
    newLink = { id: generateId(), label: '', url: '', icon: 'fa-solid fa-link', visible: true };
  }
  data.value.personal.contactLinks.push(newLink);
};

const removeContactLink = (idx: number) => {
  if (!data.value.personal.contactLinks) return;
  data.value.personal.contactLinks.splice(idx, 1);
};
</script>

<template>
  <div class="w-full flex flex-col p-4 md:p-6 pb-20">

    <!-- PERSONAL TAB -->
    <template v-if="activeTab === 'personal'">
      <EditorSection :title="t('personal')" :data="data.personal" @update="data.personal = $event">
        <div class="grid grid-cols-2 gap-4">
          <div><label class="block text-[10px] text-slate-500 mb-1 font-bold">{{ t('name') }}</label><input
              v-model="data.personal.name"
              class="w-full text-xs box-border border border-slate-200 rounded p-2 outline-none focus:border-[#01a3a4] transition-colors">
          </div>
          <div><label class="block text-[10px] text-slate-500 mb-1 font-bold">{{ t('name') }} (Zh)</label><input
              v-model="data.personal.nameZh"
              class="w-full text-xs box-border border border-slate-200 rounded p-2 outline-none focus:border-[#01a3a4] transition-colors">
          </div>
          <div><label class="block text-[10px] text-slate-500 mb-1 font-bold">{{ t('documentTitle') || 'Document Title'
              }}</label><input v-model="data.personal.documentTitle" :disabled="!data.personal.showDocumentTitle"
              class="w-full text-xs box-border border border-slate-200 rounded p-2 outline-none focus:border-[#01a3a4] transition-colors disabled:bg-slate-100 disabled:text-slate-400">
          </div>
          <div><label class="block text-[10px] text-slate-500 mb-1 font-bold">{{ t('showDocTitle') }}</label>
            <div class="h-[34px] flex items-center">
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" v-model="data.personal.showDocumentTitle" class="sr-only peer">
                <div
                  class="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#01a3a4]">
                </div>
                <span class="ml-2 text-xs text-slate-600 font-medium whitespace-nowrap">{{
                  data.personal.showDocumentTitle ? t('enabled') : t('disabled') }}</span>
              </label>
            </div>
          </div>
        </div>
      </EditorSection>

      <!-- Contact links section -->
      <div class="mt-6">
        <EditorSection :title="t('contactInfo')" :data="data.personal" @update="data.personal = $event">
          <p class="text-[10px] text-slate-500 -mt-1 mb-3 leading-relaxed">{{ t('contactInfoHint') }}</p>
          <div class="space-y-2">
            <div v-for="(link, idx) in (data.personal.contactLinks || [])" :key="link.id"
              class="p-2.5 border border-slate-200 bg-slate-50/60 rounded-lg group">
              <!-- Header row: icon + label preview + controls -->
              <div class="flex items-center gap-2">
                <span
                  class="w-7 h-7 flex items-center justify-center rounded bg-white border border-slate-200 text-slate-500 shrink-0">
                  <i :class="link.icon || 'fa-solid fa-link'"></i>
                </span>
                <span class="flex-1 text-xs font-medium text-slate-700 truncate min-w-0">
                  {{ link.label || link.url || t('untitledItem') }}
                </span>
                <label class="inline-flex items-center cursor-pointer shrink-0" :title="t('visible')">
                  <input type="checkbox" v-model="link.visible" class="sr-only peer">
                  <div
                    class="w-7 h-4 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#01a3a4] relative">
                  </div>
                </label>
                <button @click="moveItem(data.personal.contactLinks!, idx, -1)" :disabled="idx === 0"
                  class="w-6 h-6 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 disabled:opacity-30 disabled:hover:bg-white shadow-sm flex items-center justify-center"><i
                    class="fa-solid fa-arrow-up text-[10px]"></i></button>
                <button @click="moveItem(data.personal.contactLinks!, idx, 1)"
                  :disabled="idx === (data.personal.contactLinks || []).length - 1"
                  class="w-6 h-6 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 disabled:opacity-30 disabled:hover:bg-white shadow-sm flex items-center justify-center"><i
                    class="fa-solid fa-arrow-down text-[10px]"></i></button>
                <button @click="removeContactLink(idx)"
                  class="w-6 h-6 rounded bg-white hover:bg-red-50 border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 shadow-sm flex items-center justify-center"><i
                    class="fa-solid fa-trash text-[10px]"></i></button>
              </div>
              <!-- Detail fields -->
              <div class="grid grid-cols-12 gap-2 mt-2">
                <div class="col-span-5">
                  <label class="block text-[9px] text-slate-500 font-bold mb-0.5">{{ t('contactLabel') }}</label>
                  <input v-model="link.label" :placeholder="t('contactLabelPlaceholder')"
                    class="w-full text-xs border border-slate-200 rounded p-1.5 outline-none focus:border-[#01a3a4] bg-white">
                </div>
                <div class="col-span-7">
                  <label class="block text-[9px] text-slate-500 font-bold mb-0.5">{{ t('contactUrl') }}</label>
                  <input v-model="link.url" :placeholder="t('contactUrlPlaceholder')"
                    class="w-full text-xs border border-slate-200 rounded p-1.5 outline-none focus:border-[#01a3a4] bg-white">
                </div>
                <div class="col-span-12">
                  <label class="block text-[9px] text-slate-500 font-bold mb-0.5">{{ t('contactIcon') }}</label>
                  <IconPicker v-model="link.icon" />
                </div>
              </div>
            </div>

            <!-- Add buttons -->
            <div class="flex flex-wrap items-center gap-2 pt-2">
              <button @click="addContactLink('phone')"
                class="px-3 py-1.5 border border-dashed border-slate-300 rounded-lg text-slate-600 text-[11px] font-semibold hover:border-[#01a3a4] hover:text-[#01a3a4] transition-colors flex items-center gap-1.5">
                <i class="fa-solid fa-phone text-[10px]"></i> {{ t('presetPhone') }}
              </button>
              <button @click="addContactLink('email')"
                class="px-3 py-1.5 border border-dashed border-slate-300 rounded-lg text-slate-600 text-[11px] font-semibold hover:border-[#01a3a4] hover:text-[#01a3a4] transition-colors flex items-center gap-1.5">
                <i class="fa-solid fa-envelope text-[10px]"></i> {{ t('presetEmail') }}
              </button>
              <button @click="addContactLink('github')"
                class="px-3 py-1.5 border border-dashed border-slate-300 rounded-lg text-slate-600 text-[11px] font-semibold hover:border-[#01a3a4] hover:text-[#01a3a4] transition-colors flex items-center gap-1.5">
                <i class="fa-brands fa-github text-[10px]"></i> {{ t('presetGithub') }}
              </button>
              <button @click="addContactLink()"
                class="px-3 py-1.5 border border-dashed border-slate-300 rounded-lg text-slate-600 text-[11px] font-semibold hover:border-[#01a3a4] hover:text-[#01a3a4] transition-colors flex items-center gap-1.5">
                <i class="fa-solid fa-plus text-[10px]"></i> {{ t('addContact') }}
              </button>
            </div>
          </div>
        </EditorSection>
      </div>

      <div class="mt-6">
        <EditorSection :title="t('profilePhoto')" :data="data.personal" @update="data.personal = $event">
          <div class="flex flex-col gap-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="data.personal.showPhoto"
                class="w-4 h-4 text-[#01a3a4] rounded border-slate-300 focus:ring-[#01a3a4]">
              <span class="text-xs font-bold text-slate-700">{{ t('displayPhoto') }}</span>
            </label>
            <div v-if="data.personal.showPhoto"
              class="p-3 border border-slate-200 rounded-lg bg-slate-50 flex items-start gap-4">
              <div v-if="data.personal.photoUrl"
                class="w-16 h-20 bg-slate-200 border border-slate-300 shadow-sm shrink-0 rounded overflow-hidden flex items-center justify-center">
                <img :src="data.personal.photoUrl" class="w-full h-full object-cover" />
              </div>
              <div v-else
                class="w-16 h-20 bg-slate-200 border border-slate-300 shadow-sm shrink-0 rounded flex items-center justify-center text-slate-400 text-2xl">
                <i class="fa-solid fa-user"></i>
              </div>
              <div class="flex-1">
                <label class="block text-[10px] text-slate-500 mb-1 font-bold">{{ t('uploadPhoto') }}</label>
                <input type="file" accept="image/*" @change="handlePhotoUpload"
                  class="text-xs w-full text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-[#01a3a4] file:text-white hover:file:bg-[#01a3a4]/90 focus:outline-none">
                <p class="text-[9px] text-slate-400 mt-1">{{ t('photoAspectRatio') }}</p>
              </div>
            </div>
          </div>
        </EditorSection>
      </div>

      <div class="mt-6">
        <EditorSection :title="t('footerContent')" :data="data.personal" @update="data.personal = $event">
          <div class="grid grid-cols-2 gap-4">
            <div><label class="block text-[10px] text-slate-500 mb-1 font-bold">{{ t('footerTitle') }}</label><input
                v-model="data.personal.footerTitle" :disabled="!data.personal.showFooterTitle"
                class="w-full text-xs box-border border border-slate-200 rounded p-2 outline-none focus:border-[#01a3a4] transition-colors disabled:bg-slate-100 disabled:text-slate-400">
            </div>
            <div><label class="block text-[10px] text-slate-500 mb-1 font-bold">{{ t('showFooterTitle') }}</label>
              <div class="h-[34px] flex items-center">
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" v-model="data.personal.showFooterTitle" class="sr-only peer">
                  <div
                    class="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#01a3a4]">
                  </div>
                  <span class="ml-2 text-xs text-slate-600 font-medium whitespace-nowrap">{{
                    data.personal.showFooterTitle ? t('enabled') : t('disabled') }}</span>
                </label>
              </div>
            </div>
            <div>
              <label class="block text-[10px] text-slate-500 mb-1 font-bold">{{ t('lastModifiedText') }}</label>
              <div class="flex gap-1">
                <input v-model="data.personal.lastModifiedText" :disabled="!data.personal.showLastModified"
                  class="w-full text-xs box-border border border-slate-200 rounded p-2 outline-none focus:border-[#01a3a4] transition-colors disabled:bg-slate-100 disabled:text-slate-400">
                <button
                  @click="data.personal.lastModifiedText = `${t('lastModified')}${new Date().toISOString().split('T')[0].replace(/-/g, '.')}`"
                  :disabled="!data.personal.showLastModified" :title="t('syncToToday')"
                  class="px-2 border border-slate-200 rounded bg-white text-slate-500 disabled:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed hover:bg-slate-50 hover:text-[#01a3a4] hover:border-[#01a3a4]/30 transition-colors">
                  <i class="fa-solid fa-clock-rotate-left"></i>
                </button>
              </div>
            </div>
            <div><label class="block text-[10px] text-slate-500 mb-1 font-bold">{{ t('showLastModified') }}</label>
              <div class="h-[34px] flex items-center">
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" v-model="data.personal.showLastModified" class="sr-only peer">
                  <div
                    class="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#01a3a4]">
                  </div>
                  <span class="ml-2 text-xs text-slate-600 font-medium whitespace-nowrap">{{
                    data.personal.showLastModified ? t('enabled') : t('disabled') }}</span>
                </label>
              </div>
            </div>
          </div>
        </EditorSection>
      </div>

      <!-- Skills put in Personal for visual balance or you can put it in Extra -->
    </template>

    <!-- EDUCATION TAB -->
    <template v-if="activeTab === 'education'">
      <EditorSection :title="t('education')" :data="data.education" @update="data.education = $event"
        v-model:settings="data.sectionSettings.education">
        <div class="space-y-4">
          <div v-for="(ed, idx) in data.education" :key="idx"
            class="p-3 border border-slate-200 bg-slate-50/50 rounded relative group">
            <button class="absolute top-2 right-2 text-slate-400 hover:text-red-500 transition-colors"
              @click="data.education.splice(idx, 1)"><i class="fa-solid fa-trash text-xs"></i></button>
            <div class="grid grid-cols-2 gap-3 mb-2">
              <div class="col-span-2"><label class="block text-[10px] text-slate-500 font-bold mb-1">{{
                t('institutionName') }}</label><input v-model="ed.institution" :placeholder="t('enterInstitution')"
                  class="w-full text-xs border border-slate-200 rounded p-1.5 outline-none focus:border-[#01a3a4] bg-white">
              </div>
              <div><label class="block text-[10px] text-slate-500 font-bold mb-1">{{ t('degree') }}</label><input
                  v-model="ed.degree" :placeholder="t('enterDegree')"
                  class="w-full text-xs border border-slate-200 rounded p-1.5 outline-none focus:border-[#01a3a4] bg-white">
              </div>
              <div><label class="block text-[10px] text-slate-500 font-bold mb-1">{{ t('location') }}</label><input
                  v-model="ed.location" :placeholder="t('enterLocation')"
                  class="w-full text-xs border border-slate-200 rounded p-1.5 outline-none focus:border-[#01a3a4] bg-white">
              </div>
              <div><label class="block text-[10px] text-slate-500 font-bold mb-1">{{ t('startDate') }}</label><input
                  v-model="ed.startDate"
                  class="w-full text-xs border border-slate-200 rounded p-1.5 outline-none focus:border-[#01a3a4] bg-white">
              </div>
              <div><label class="block text-[10px] text-slate-500 font-bold mb-1">{{ t('endDate') }}</label><input
                  v-model="ed.endDate"
                  class="w-full text-xs border border-slate-200 rounded p-1.5 outline-none focus:border-[#01a3a4] bg-white">
              </div>
            </div>
          </div>
          <button
            @click="data.education.push({ id: generateId(), institution: t('newInstitution'), degree: '', location: '', startDate: '', endDate: '' })"
            class="w-full py-2.5 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 text-xs font-semibold hover:border-[#01a3a4] hover:text-[#01a3a4] transition-colors"><i
              class="fa-solid fa-plus mr-1"></i>{{ t('addEducation') }}</button>
        </div>
      </EditorSection>

      <EditorSection :title="t('skills')" :data="data.skills" @update="data.skills = $event"
        v-model:settings="data.sectionSettings.skills">
        <div class="space-y-4">
          <div v-for="(skill, idx) in data.skills" :key="idx"
            class="p-3 border border-slate-200 bg-slate-50/50 rounded relative group">
            <button @click="data.skills.splice(idx, 1)"
              class="absolute top-2 right-2 text-slate-400 hover:text-red-500 transition-colors"><i
                class="fa-solid fa-trash text-xs"></i></button>
            <div class="grid grid-cols-2 gap-3 mb-3 pr-6">
              <div><label class="block text-[10px] text-slate-500 font-bold mb-1">{{ t('category') }}</label><input
                  v-model="skill.category" :placeholder="t('enterCategory')"
                  class="w-full text-xs border border-slate-200 rounded p-1.5 outline-none focus:border-[#01a3a4] bg-white">
              </div>
              <div><label class="block text-[10px] text-slate-500 font-bold mb-1">{{ t('iconClassOptional') }}</label>
                <IconPicker v-model="skill.icon" />
              </div>
            </div>
            <div>
              <label class="block text-[10px] text-slate-500 font-bold mb-1">{{ t('items') }} <span
                  class="font-normal">{{ t('commaSeparated') }}</span></label>
              <textarea :value="skill.items.join(', ')"
                @change="(e) => skill.items = (e.target as HTMLTextAreaElement).value.split(',').map(s => s.trim()).filter(s => s)"
                class="w-full text-xs border border-slate-200 rounded p-2 outline-none focus:border-[#01a3a4] bg-white resize-y"
                rows="2" :placeholder="t('enterSkill')"></textarea>
            </div>
          </div>
          <button
            @click="data.skills.push({ id: generateId(), category: t('newCategory'), icon: 'fa-solid fa-star', items: [] })"
            class="w-full py-2.5 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 text-xs font-semibold hover:border-[#01a3a4] hover:text-[#01a3a4] transition-colors"><i
              class="fa-solid fa-plus mr-1"></i>{{ t('addSkill') }}</button>
        </div>
      </EditorSection>
    </template>

    <!-- ARTICLES TAB -->
    <template v-if="activeTab === 'articles'">
      <div class="mb-4 bg-white border border-[#01a3a4]/20 rounded-lg p-3">
        <label class="block text-xs font-bold text-[#01a3a4] mb-2"><i class="fa-solid fa-file-import mr-1"></i> {{
          t('importBibtex') }}</label>
        <textarea v-model="bibtexInput"
          class="w-full text-xs box-border border border-slate-200 rounded p-2 outline-none focus:border-[#01a3a4] transition-colors resize-y h-24 custom-scrollbar mb-2"
          :placeholder="t('bibtexPlaceholder')"></textarea>
        <button @click="handleBibtexImport"
          class="px-3 py-1.5 text-xs font-semibold text-white rounded bg-[#01a3a4] hover:bg-[#01a3a4]/90 transition-colors shadow-sm">
          {{ t('parseBibtex') }}
        </button>
      </div>

      <EditorSection :title="t('publications')" :data="data.articles" @update="data.articles = $event"
        v-model:settings="data.sectionSettings.articles">
        <div class="space-y-4">
          <div v-for="(ar, idx) in data.articles" :key="ar.id || idx"
            class="p-3 border border-[#01a3a4]/20 bg-[#01a3a4]/5 rounded-lg relative">

            <!-- Header for collapsible and Reordering -->
            <div class="flex items-center justify-between mb-2">
              <div class="flex-1 font-bold text-xs text-[#01a3a4] cursor-pointer"
                @click="ar._collapsed = !ar._collapsed">
                <i class="fa-solid fa-chevron-right mr-1 transition-transform inline-block"
                  :class="{ 'rotate-90': !ar._collapsed }"></i>
                {{ ar.title || t('untitledPublication') }}
              </div>
              <div class="flex items-center gap-1 shrink-0 ml-2">
                <button @click.stop="moveItem(data.articles, idx, -1)" :disabled="idx === 0"
                  class="w-6 h-6 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 disabled:opacity-30 disabled:hover:bg-white shadow-sm flex items-center justify-center"><i
                    class="fa-solid fa-arrow-up text-[10px]"></i></button>
                <button @click.stop="moveItem(data.articles, idx, 1)" :disabled="idx === data.articles.length - 1"
                  class="w-6 h-6 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 disabled:opacity-30 disabled:hover:bg-white shadow-sm flex items-center justify-center"><i
                    class="fa-solid fa-arrow-down text-[10px]"></i></button>
                <button @click.stop="data.articles.splice(idx, 1)"
                  class="w-6 h-6 rounded bg-white hover:bg-red-50 border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 shadow-sm ml-1 flex items-center justify-center"><i
                    class="fa-solid fa-trash text-[10px]"></i></button>
              </div>
            </div>

            <!-- Body of the article -->
            <div v-show="!ar._collapsed" class="mt-3 pt-3 border-t border-[#01a3a4]/20">
              <div class="grid grid-cols-12 gap-3 mb-3">
                <div class="col-span-12"><label class="block text-[10px] text-[#01a3a4] font-bold mb-1">{{ t('title')
                    }}</label><input v-model="ar.title"
                    class="w-full font-semibold text-xs border border-[#01a3a4]/30 bg-white rounded p-1.5 outline-none focus:border-[#01a3a4]">
                </div>
                <div class="col-span-6"><label class="block text-[10px] text-[#01a3a4] font-bold mb-1">{{
                  t('journalName') }}</label><input v-model="ar.journal"
                    class="w-full text-xs border border-[#01a3a4]/30 bg-white rounded p-1.5 outline-none focus:border-[#01a3a4]">
                </div>
                <div class="col-span-6"><label class="block text-[10px] text-[#01a3a4] font-bold mb-1">{{ t('doi')
                    }}</label><input v-model="ar.doi"
                    class="w-full text-xs border border-[#01a3a4]/30 bg-white rounded p-1.5 outline-none focus:border-[#01a3a4]">
                </div>
                <div class="col-span-3"><label class="block text-[10px] text-[#01a3a4] font-bold mb-1">{{ t('year')
                    }}</label><input v-model="ar.year"
                    class="w-full text-xs border border-[#01a3a4]/30 bg-white rounded p-1.5 outline-none focus:border-[#01a3a4]">
                </div>
                <div class="col-span-3"><label class="block text-[10px] text-[#01a3a4] font-bold mb-1">{{
                  t('volumeIssue') }}</label><input v-model="ar.volumeAndIssue"
                    class="w-full text-xs border border-[#01a3a4]/30 bg-white rounded p-1.5 outline-none focus:border-[#01a3a4]">
                </div>
                <div class="col-span-3"><label class="block text-[10px] text-[#01a3a4] font-bold mb-1">{{ t('pages')
                    }}</label><input v-model="ar.pages"
                    class="w-full text-xs border border-[#01a3a4]/30 bg-white rounded p-1.5 outline-none focus:border-[#01a3a4]">
                </div>
                <div class="col-span-3"><label class="block text-[10px] text-[#01a3a4] font-bold mb-1">{{
                  t('impactFactor') }}</label><input type="number" step="0.1" v-model="ar.impactFactor"
                    class="w-full text-xs border border-[#01a3a4]/30 bg-white rounded p-1.5 outline-none focus:border-[#01a3a4]"
                    :placeholder="t('impactFactorNote')"></div>
              </div>

              <div class="mt-3 border-t border-[#01a3a4]/10 pt-3">
                <label class="flex justify-between items-end text-[10px] text-[#01a3a4] font-bold mb-2">
                  <span>{{ t('authorsClickToggle') }}</span>
                </label>
                <div class="flex flex-wrap gap-2">
                  <div v-for="(au, i) in ar.authors" :key="i"
                    class="text-[10px] flex flex-col bg-white border border-[#01a3a4]/30 rounded overflow-hidden shadow-sm hover:border-[#01a3a4]/60 transition-colors">
                    <div class="flex items-center">
                      <input v-model="au.name" class="px-1.5 py-1 text-center font-semibold text-xs outline-none w-24">
                      <button @click="ar.authors.splice(i, 1)" class="px-1 text-slate-300 hover:text-red-500"
                        :title="t('removeAuthor')"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <div class="flex flex-row text-[9px] divide-x divide-slate-100 border-t border-slate-100">
                      <button @click="au.isMe = !au.isMe"
                        :class="au.isMe ? 'bg-[#01a3a4] text-white' : 'text-slate-500 hover:bg-slate-50'"
                        class="flex-1 py-1 px-1 text-center transition-colors" :title="t('toggleMe')">{{ t('me')
                        }}</button>
                      <button @click="au.isFirst = !au.isFirst"
                        :class="au.isFirst ? 'bg-orange-500 text-white' : 'text-slate-500 hover:bg-slate-50'"
                        class="flex-1 py-1 px-1 text-center transition-colors" :title="t('toggleFirst')">{{
                          t('firstAuthor') }}</button>
                      <button @click="au.isCorresponding = !au.isCorresponding"
                        :class="au.isCorresponding ? 'bg-blue-500 text-white' : 'text-slate-500 hover:bg-slate-50'"
                        class="flex-1 py-1 px-1 text-center transition-colors" :title="t('toggleCorresponding')">{{
                          t('corresponding') }}</button>
                    </div>
                  </div>
                  <button
                    @click="ar.authors.push({ name: t('newAuthor'), isMe: false, isFirst: false, isCorresponding: false })"
                    class="text-[10px] px-2 py-1 bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200 rounded shadow-sm flex items-center justify-center h-full min-h-[44px]">
                    <i class="fa-solid fa-plus"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <button
            @click="data.articles.push({ id: generateId(), title: t('newPublication'), authors: [{ name: t('me'), isMe: true, isFirst: true, isCorresponding: false }], journal: '', year: '', doi: '' })"
            class="w-full py-2.5 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 text-xs font-semibold hover:border-[#01a3a4] hover:text-[#01a3a4] transition-colors"><i
              class="fa-solid fa-plus mr-1"></i> {{ t('addPublication') }}</button>
        </div>
      </EditorSection>

      <EditorSection :title="t('conferenceProceedings')" :data="data.conferences" @update="data.conferences = $event"
        v-model:settings="data.sectionSettings.conferences">
        <div class="space-y-4">
          <div v-for="(cf, idx) in data.conferences" :key="idx"
            class="p-3 border border-slate-200 bg-slate-50/50 rounded relative group">
            <button @click="data.conferences.splice(idx, 1)"
              class="absolute top-2 right-2 text-slate-400 hover:text-red-500 transition-colors"><i
                class="fa-solid fa-trash text-xs"></i></button>
            <div class="grid grid-cols-2 gap-3 mb-2 pr-6">
              <div class="col-span-2"><label class="block text-[10px] text-slate-500 font-bold mb-1">{{
                t('conferenceName') }}</label><input v-model="cf.name"
                  class="w-full font-medium text-xs border border-slate-200 rounded p-1.5 outline-none focus:border-[#01a3a4] bg-white">
              </div>
              <div><label class="block text-[10px] text-slate-500 font-bold mb-1">{{ t('date') }}</label><input
                  v-model="cf.dateStr"
                  class="w-full text-xs border border-slate-200 rounded p-1.5 outline-none focus:border-[#01a3a4] bg-white">
              </div>
              <div><label class="block text-[10px] text-slate-500 font-bold mb-1">{{ t('location') }}</label><input
                  v-model="cf.location"
                  class="w-full text-xs border border-slate-200 rounded p-1.5 outline-none focus:border-[#01a3a4] bg-white">
              </div>
              <div class="col-span-2"><label class="block text-[10px] text-slate-500 font-bold mb-1">{{ t('type')
                  }}</label><input v-model="cf.type"
                  class="w-full text-xs border border-slate-200 rounded p-1.5 outline-none focus:border-[#01a3a4] bg-white"
                  :placeholder="t('conferenceTypeHint')">
              </div>
            </div>
          </div>
          <button
            @click="data.conferences.push({ id: generateId(), name: t('newConference'), dateStr: '', location: '', type: '' })"
            class="w-full py-2.5 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 text-xs font-semibold hover:border-[#01a3a4] hover:text-[#01a3a4] transition-colors"><i
              class="fa-solid fa-plus mr-1"></i> {{ t('addConference') }}</button>
        </div>
      </EditorSection>
    </template>

    <!-- EMPLOYMENT TAB -->
    <template v-if="activeTab === 'employment'">
      <EditorSection :title="t('employmentHistory')" :data="data.employment" @update="data.employment = $event"
        v-model:settings="data.sectionSettings.employment">
        <div class="space-y-4">
          <div v-for="(em, idx) in data.employment" :key="idx"
            class="p-3 border border-slate-200 bg-slate-50/50 rounded relative group">
            <button @click="data.employment.splice(idx, 1)"
              class="absolute top-2 right-2 text-slate-400 hover:text-red-500 transition-colors"><i
                class="fa-solid fa-trash text-xs"></i></button>
            <div class="grid grid-cols-2 gap-3 mb-2 pr-6">
              <div class="col-span-2"><label class="block text-[10px] text-slate-500 font-bold mb-1">{{ t('roleTitle')
                  }}</label><input v-model="em.role"
                  class="w-full font-medium text-xs border border-slate-200 rounded p-1.5 outline-none focus:border-[#01a3a4] bg-white">
              </div>
              <div class="col-span-2"><label class="block text-[10px] text-slate-500 font-bold mb-1">{{
                t('institutionCompany') }}</label><input v-model="em.institution"
                  class="w-full text-xs border border-slate-200 rounded p-1.5 outline-none focus:border-[#01a3a4] bg-white">
              </div>
              <div><label class="block text-[10px] text-slate-500 font-bold mb-1">{{ t('location') }}</label><input
                  v-model="em.location"
                  class="w-full text-xs border border-slate-200 rounded p-1.5 outline-none focus:border-[#01a3a4] bg-white">
              </div>
              <div class="flex gap-2">
                <div class="w-1/2"><label class="block text-[10px] text-slate-500 font-bold mb-1">{{ t('startDate')
                    }}</label><input v-model="em.startDate"
                    class="w-full text-xs border border-slate-200 rounded p-1.5 outline-none focus:border-[#01a3a4] bg-white">
                </div>
                <div class="w-1/2"><label class="block text-[10px] text-slate-500 font-bold mb-1">{{ t('endDate')
                    }}</label><input v-model="em.endDate"
                    class="w-full text-xs border border-slate-200 rounded p-1.5 outline-none focus:border-[#01a3a4] bg-white">
                </div>
              </div>
              <div class="col-span-2"><label class="block text-[10px] text-slate-500 font-bold mb-1">{{
                t('descriptionOptional') }}</label><textarea v-model="em.description" rows="2"
                  class="w-full text-xs border border-slate-200 rounded p-1.5 outline-none focus:border-[#01a3a4] bg-white resize-y"
                  :placeholder="t('enterDescription')"></textarea>
              </div>
            </div>
          </div>
          <button
            @click="data.employment.push({ id: generateId(), role: t('newRole'), institution: '', location: '', startDate: '', endDate: '', description: '' })"
            class="w-full py-2.5 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 text-xs font-semibold hover:border-[#01a3a4] hover:text-[#01a3a4] transition-colors"><i
              class="fa-solid fa-plus mr-1"></i> {{ t('addEmployment') }}</button>
        </div>
      </EditorSection>
    </template>

    <!-- OTHER META DATA TAB (Awards, Fundings, Academic Contributions) -->
    <template v-if="activeTab === 'other'">
      <EditorSection :title="t('awardsHonors')" :data="data.awards" @update="data.awards = $event"
        v-model:settings="data.sectionSettings.awards">
        <div class="space-y-4">
          <div v-for="(aw, idx) in data.awards" :key="idx"
            class="p-3 border border-slate-200 bg-slate-50/50 rounded relative group">
            <button @click="data.awards.splice(idx, 1)"
              class="absolute top-2 right-2 text-slate-400 hover:text-red-500 transition-colors"><i
                class="fa-solid fa-trash text-xs"></i></button>
            <div class="grid grid-cols-2 gap-3 mb-2 pr-6">
              <div class="col-span-2"><label class="block text-[10px] text-slate-500 font-bold mb-1">{{ t('awardTitle')
                  }}</label><input v-model="aw.title"
                  class="w-full font-medium text-xs border border-slate-200 rounded p-1.5 outline-none focus:border-[#01a3a4] bg-white">
              </div>
              <div><label class="block text-[10px] text-slate-500 font-bold mb-1">{{ t('issuerOrganizer')
                  }}</label><input v-model="aw.issuer"
                  class="w-full text-xs border border-slate-200 rounded p-1.5 outline-none focus:border-[#01a3a4] bg-white">
              </div>
              <div><label class="block text-[10px] text-slate-500 font-bold mb-1">{{ t('date') }}</label><input
                  v-model="aw.dateStr"
                  class="w-full text-xs border border-slate-200 rounded p-1.5 outline-none focus:border-[#01a3a4] bg-white">
              </div>
              <div class="col-span-2">
                <label class="block text-[10px] text-slate-500 font-bold mb-1">{{ t('description') }}</label>
                <textarea v-model="aw.description"
                  class="w-full text-xs border border-slate-200 bg-white rounded p-2 outline-none focus:border-[#01a3a4] resize-y custom-scrollbar"
                  rows="2"></textarea>
              </div>
            </div>
            <!-- Sub-editor for award links could go here -->
          </div>
          <button
            @click="data.awards.push({ id: generateId(), title: t('newAward'), issuer: '', dateStr: '', description: '', links: [] })"
            class="w-full py-2.5 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 text-xs font-semibold hover:border-[#01a3a4] hover:text-[#01a3a4] transition-colors"><i
              class="fa-solid fa-plus mr-1"></i> {{ t('addAward') }}</button>
        </div>
      </EditorSection>

      <EditorSection :title="t('researchFundings')" :data="data.fundings" @update="data.fundings = $event"
        v-model:settings="data.sectionSettings.academic">
        <div class="space-y-4">
          <div v-for="(fd, idx) in data.fundings" :key="idx"
            class="p-3 border border-slate-200 bg-slate-50/50 rounded relative group">
            <button @click="data.fundings.splice(idx, 1)"
              class="absolute top-2 right-2 text-slate-400 hover:text-red-500 transition-colors"><i
                class="fa-solid fa-trash text-xs"></i></button>
            <div class="grid grid-cols-2 gap-3 mb-2 pr-6">
              <div class="col-span-2"><label class="block text-[10px] text-slate-500 font-bold mb-1">{{
                t('projectTitle') }}</label><input v-model="fd.title"
                  class="w-full text-xs border border-slate-200 rounded p-1.5 outline-none focus:border-[#01a3a4] bg-white">
              </div>
              <div class="col-span-2"><label class="block text-[10px] text-slate-500 font-bold mb-1">{{
                t('fundingSource') }}</label><input v-model="fd.source"
                  class="w-full text-xs border border-slate-200 rounded p-1.5 outline-none focus:border-[#01a3a4] bg-white">
              </div>
              <div><label class="block text-[10px] text-slate-500 font-bold mb-1">{{ t('grantNo') }}</label><input
                  v-model="fd.grantNo"
                  class="w-full text-xs border border-slate-200 rounded p-1.5 outline-none focus:border-[#01a3a4] bg-white">
              </div>
              <div><label class="block text-[10px] text-slate-500 font-bold mb-1">{{ t('period') }}</label><input
                  v-model="fd.period"
                  class="w-full text-xs border border-slate-200 rounded p-1.5 outline-none focus:border-[#01a3a4] bg-white">
              </div>
              <div class="col-span-2"><label class="block text-[10px] text-slate-500 font-bold mb-1">{{ t('yourRole')
                  }}</label><input v-model="fd.role"
                  class="w-full text-xs border border-slate-200 rounded p-1.5 outline-none focus:border-[#01a3a4] bg-white">
              </div>
            </div>
          </div>
          <button
            @click="data.fundings.push({ id: generateId(), source: '', grantNo: '', title: t('newFunding'), period: '', role: '' })"
            class="w-full py-2.5 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 text-xs font-semibold hover:border-[#01a3a4] hover:text-[#01a3a4] transition-colors"><i
              class="fa-solid fa-plus mr-1"></i> {{ t('addFunding') }}</button>
        </div>
      </EditorSection>

      <EditorSection :title="t('academicContributions')"
        :data="{ societyServices: data.societyServices, reviews: data.reviews, contributions: data.contributions }"
        @update="data.societyServices = $event.societyServices; data.reviews = $event.reviews; data.contributions = $event.contributions">
        <div class="text-xs text-slate-600 mb-4 bg-slate-100 p-3 rounded shadow-inner">
          <i class="fa-solid fa-circle-info text-[#01a3a4] mr-1"></i>
          {{ t('simpleListHint') }}
        </div>
        <div class="mb-4">
          <label class="block text-xs font-bold text-slate-700 mb-1 border-l-2 border-[#01a3a4] pl-2">{{
            t('societyServices') }}
            <span class="font-normal text-slate-400">({{ data.societyServices.length }} items)</span></label>
        </div>
        <div class="mb-4">
          <label class="block text-xs font-bold text-slate-700 mb-1 border-l-2 border-[#01a3a4] pl-2">{{ t('reviews') }}
            <span class="font-normal text-slate-400">({{ data.reviews.length }} items)</span></label>
        </div>
        <div class="mb-2">
          <label class="block text-xs font-bold text-slate-700 mb-1 border-l-2 border-[#01a3a4] pl-2">{{
            t('contributions') }}
            <span class="font-normal text-slate-400">({{ data.contributions.length }} items)</span></label>
        </div>
      </EditorSection>
    </template>

    <!-- CUSTOM SECTIONS TAB -->
    <template v-if="activeTab === 'custom'">
      <div class="mb-4 text-xs text-slate-500 bg-slate-100 p-3 rounded shadow-sm border border-slate-200">
        <i class="fa-solid fa-shapes mr-1 text-[#01a3a4]"></i> {{ t('customSectionDescription') }}
      </div>
      <div class="space-y-6">
        <div v-for="(sec, sIdx) in data.customSections" :key="sec.id"
          class="border-2 border-slate-200 rounded-lg bg-white relative overflow-hidden shadow-sm">

          <div
            class="px-3 py-2 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:justify-between md:items-center gap-2">
            <div class="flex items-center gap-2 flex-1">
              <input type="checkbox" v-model="sec.visible" :title="t('toggleVisibility')"
                class="accent-[#01a3a4] cursor-pointer w-3.5 h-3.5 rounded shrink-0">
              <input v-model="sec.title"
                class="text-[11px] font-bold text-slate-700 uppercase tracking-wider bg-transparent border-b border-dashed border-slate-300 hover:border-slate-400 focus:border-[#01a3a4] outline-none px-1 py-0.5 w-full max-w-[200px]"
                :placeholder="t('customSectionTitle')">
            </div>
            <button @click="removeCustomSection(sIdx)"
              class="text-[10px] text-red-500 hover:text-red-600 transition shrink-0 font-medium">{{ t('removeSection')
              }}</button>
          </div>

          <div class="p-4 bg-white" :class="{ 'opacity-50 grayscale transition-all duration-300': !sec.visible }">
            <div class="space-y-4">
              <div v-for="(item, iIdx) in sec.items" :key="item.id"
                class="p-3 border border-slate-200 bg-slate-50/50 rounded relative group">

                <!-- Collapsible header -->
                <div class="flex items-center justify-between gap-2">
                  <div class="flex-1 font-bold text-xs text-slate-700 cursor-pointer flex items-center min-w-0"
                    @click="item._collapsed = !item._collapsed">
                    <i class="fa-solid fa-chevron-right mr-1 transition-transform inline-block shrink-0"
                      :class="{ 'rotate-90': !item._collapsed }"></i>
                    <span class="truncate">{{ item.title || t('untitledItem') }}</span>
                  </div>
                  <div class="flex items-center gap-1 shrink-0">
                    <button @click.stop="moveItem(sec.items, iIdx, -1)" :disabled="iIdx === 0"
                      class="w-6 h-6 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 disabled:opacity-30 disabled:hover:bg-white shadow-sm flex items-center justify-center"><i
                        class="fa-solid fa-arrow-up text-[10px]"></i></button>
                    <button @click.stop="moveItem(sec.items, iIdx, 1)" :disabled="iIdx === sec.items.length - 1"
                      class="w-6 h-6 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 disabled:opacity-30 disabled:hover:bg-white shadow-sm flex items-center justify-center"><i
                        class="fa-solid fa-arrow-down text-[10px]"></i></button>
                    <button @click.stop="sec.items.splice(iIdx, 1)"
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
              <!-- Add Custom Item Button -->
              <button
                @click="sec.items.push({ id: generateId(), title: t('newItem'), subtitle: '', dateStr: '', location: '', description: '', bullets: [] })"
                class="w-full py-2.5 border border-dashed border-slate-300 rounded-lg text-slate-500 text-xs font-semibold hover:border-[#01a3a4] hover:text-[#01a3a4] transition-colors"><i
                  class="fa-solid fa-plus mr-1"></i> {{ t('addItem') }} {{ sec.title || '' }}</button>
            </div>
          </div>
        </div>

        <button @click="addCustomSection"
          class="w-full py-3 bg-[#e6f6f6] border border-[#01a3a4]/20 rounded-lg text-[#01a3a4] text-sm font-semibold hover:bg-[#d0efef] transition-colors shadow-sm"><i
            class="fa-solid fa-folder-plus mr-1"></i> {{ t('addCustomSection') }}</button>
      </div>
    </template>

    <!-- SETTINGS / RAW TEMPLATE TAB -->
    <template v-if="activeTab === 'settings'">
      <div class="mb-4 border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm p-4">
        <h3 class="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">{{
          t('globalSettings') }}</h3>
        <label class="block text-xs font-bold text-slate-500 mb-2">{{ t('themeColor') }}</label>
        <div class="flex items-center gap-3">
          <input type="color" v-model="data.themeColor"
            class="w-10 h-10 rounded border border-slate-200 p-0 cursor-pointer shadow-inner">
          <input type="text" v-model="data.themeColor"
            class="text-sm font-mono border border-slate-200 rounded p-1.5 outline-none w-28 focus:border-[#01a3a4]">
        </div>

        <label class="block text-xs font-bold text-slate-500 mb-2 mt-4">{{ t('fontScale') }}</label>
        <div class="flex items-center gap-2">
          <select v-model.number="data.fontScale"
            class="text-xs border border-slate-200 rounded p-1.5 focus:border-[#01a3a4] outline-none bg-white">
            <option :value="0.70">70%</option>
            <option :value="0.75">75%</option>
            <option :value="0.80">80%</option>
            <option :value="0.85">85%</option>
            <option :value="0.90">90%</option>
            <option :value="0.95">95%</option>
            <option :value="1.00">100%</option>
            <option :value="1.05">105%</option>
            <option :value="1.10">110%</option>
            <option :value="1.15">115%</option>
            <option :value="1.20">120%</option>
          </select>
          <input type="range" v-model.number="data.fontScale" min="0.7" max="1.2" step="0.01"
            class="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#01a3a4]">
          <input type="number" :value="Math.round(data.fontScale * 100)"
            @input="data.fontScale = ($event.target as HTMLInputElement).value / 100" min="70" max="120" step="1"
            class="w-16 text-sm font-mono border border-slate-200 rounded p-1 text-center focus:border-[#01a3a4] outline-none">
          <span class="text-sm font-mono text-slate-600 w-8">%</span>
        </div>
        <p class="text-[10px] text-slate-400 mt-1">{{ t('fontScaleHint') }}</p>

        <label class="block text-xs font-bold text-slate-500 mb-2 mt-4">{{ t('fontFamily') }}</label>
        <select v-model="data.fontFamily"
          class="w-full text-xs border border-slate-200 rounded p-1.5 focus:border-[#01a3a4] outline-none bg-white">
          <option value="Inter" style="font-family: 'Inter', sans-serif;">Inter</option>
          <option value="Roboto" style="font-family: 'Roboto', sans-serif;">Roboto</option>
          <option value="Lato" style="font-family: 'Lato', sans-serif;">Lato</option>
          <option value="'Open Sans'" style="font-family: 'Open Sans', sans-serif;">Open Sans</option>
          <option value="Merriweather" style="font-family: 'Merriweather', serif;">Merriweather</option>
          <option value="'Source Serif 4'" style="font-family: 'Source Serif 4', serif;">Source Serif 4</option>
          <option value="'Playfair Display'" style="font-family: 'Playfair Display', serif;">Playfair Display</option>
          <option value="'Times New Roman'" style="font-family: 'Times New Roman', serif;">Times New Roman</option>
        </select>

        <label class="block text-xs font-bold text-slate-500 mb-2 mt-3">{{ t('fontFamilyZh') }}</label>
        <select v-model="data.fontFamilyZh"
          class="w-full text-xs border border-slate-200 rounded p-1.5 focus:border-[#01a3a4] outline-none bg-white">
          <option value="'Noto Sans SC'" style="font-family: 'Noto Sans SC', sans-serif;">Noto Sans SC（思源黑体）</option>
          <option value="'Noto Serif SC'" style="font-family: 'Noto Serif SC', serif;">Noto Serif SC（思源宋体）</option>
          <option value="'Microsoft YaHei'" style="font-family: 'Microsoft YaHei', sans-serif;">微软雅黑</option>
          <option value="'SimSun'" style="font-family: 'SimSun', serif;">宋体（SimSun）</option>
          <option value="'PingFang SC'" style="font-family: 'PingFang SC', sans-serif;">苹方（PingFang SC）</option>
        </select>
        <p class="text-[10px] text-slate-400 mt-1">{{ t('fontFamilyHint') }}</p>
      </div>

      <div class="mb-6 border border-slate-200 rounded-lg bg-white shadow-sm p-4" v-if="visibleSectionOrder.length > 0">
        <h3 class="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
          {{ t('sectionDisplayOrder') }}</h3>
        <p class="text-[10px] text-slate-500 mb-3">{{ t('reorderSectionsInfo') }}</p>
        <div class="space-y-2">
          <div v-for="(secId, index) in visibleSectionOrder" :key="secId"
            class="flex justify-between items-center px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700 font-medium">
            <div class="flex items-center gap-2">
              <i class="fa-solid fa-grip-lines text-slate-300"></i>
              <span class="uppercase tracking-wide">{{ getSectionTitle(secId) }}</span>
            </div>
            <div class="flex gap-1">
              <button @click="moveSection(secId, -1)" :disabled="index === 0"
                class="w-7 h-7 rounded bg-white border border-slate-200 hover:bg-slate-100 text-slate-500 disabled:opacity-30 flex justify-center items-center transition-colors"><i
                  class="fa-solid fa-arrow-up text-[10px]"></i></button>
              <button @click="moveSection(secId, 1)" :disabled="index === visibleSectionOrder.length - 1"
                class="w-7 h-7 rounded bg-white border border-slate-200 hover:bg-slate-100 text-slate-500 disabled:opacity-30 flex justify-center items-center transition-colors"><i
                  class="fa-solid fa-arrow-down text-[10px]"></i></button>
            </div>
          </div>
        </div>
      </div>

      <EditorSection :title="t('dataSourceInspection')" :data="data" @update="emit('update:modelValue', $event)">
        <div
          class="p-4 bg-orange-50 text-orange-800 text-xs rounded border border-orange-200 leading-relaxed shadow-inner">
          <p class="font-bold mb-1 text-sm"><i class="fa-solid fa-triangle-exclamation mr-1"></i> {{
            t('advancedUseOnly') }}</p>
          <p>{{ t('jsonTabHint') }}</p>
        </div>
      </EditorSection>
    </template>

  </div>
</template>
