<script setup lang="ts">
import { computed, ref } from 'vue';
import EditorSection from './EditorSection.vue';
import IconPicker from './IconPicker.vue';
import type { CvData } from '../types';
import { parseBibtex } from '../lib/bibtex';

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
      // Ensure existing custom customSections are in sectionOrder
      if (val.customSections) {
        val.customSections.forEach(cs => {
          if (!val.sectionOrder!.includes(`custom-${cs.id}`)) {
            val.sectionOrder!.push(`custom-${cs.id}`);
            modified = true;
          }
        });
      }
    }

    if (val.personal && val.personal.showDocumentTitle === undefined) {
      val.personal.showDocumentTitle = true;
      val.personal.documentTitle = 'Curriculum Vitae';
      modified = true;
    }

    if (val.personal && val.personal.showFooterTitle === undefined) {
      val.personal.showFooterTitle = true;
      val.personal.footerTitle = 'Curriculum Vitae';
      val.personal.showLastModified = true;
      val.personal.lastModifiedText = `Last modified: ${new Date().toISOString().split('T')[0].replace(/-/g, '.')}`;
      modified = true;
    }

    // Initialize fontScale if not set
    if (val.fontScale === undefined) {
      val.fontScale = 1;
      modified = true;
    }

    if (modified) {
      emit('update:modelValue', val);
    }
    return val;
  },
  set: (val) => emit('update:modelValue', val)
});

const generateId = () => Math.random().toString(36).substr(2, 9);

const moveItem = (arr: any[], index: number, direction: number) => {
  if (index + direction < 0 || index + direction >= arr.length) return;
  const temp = arr[index];
  arr[index] = arr[index + direction];
  arr[index + direction] = temp;
};

const getSectionTitle = (secId: string) => {
  if (secId.startsWith('custom-')) {
    const cId = secId.replace('custom-', '');
    const cSec = data.value.customSections?.find(c => c.id === cId);
    return cSec ? (cSec.title || 'Custom Section') : 'Unknown Custom Section';
  }
  const mapping: Record<string, string | undefined> = {
    education: data.value.sectionSettings?.education?.title,
    employment: data.value.sectionSettings?.employment?.title,
    skills: data.value.sectionSettings?.skills?.title,
    articles: data.value.sectionSettings?.articles?.title,
    conferences: data.value.sectionSettings?.conferences?.title,
    academic: data.value.sectionSettings?.academic?.title,
    awards: data.value.sectionSettings?.awards?.title,
  };
  return mapping[secId] || secId;
};

const addCustomSection = () => {
  const newId = generateId();
  if (!data.value.customSections) data.value.customSections = [];
  data.value.customSections.push({ id: newId, title: 'MY CUSTOM SECTION', visible: true, items: [] });
  if (!data.value.sectionOrder) data.value.sectionOrder = [];
  data.value.sectionOrder.push(`custom-${newId}`);
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
</script>

<template>
  <div class="w-full flex flex-col p-4 md:p-6 pb-20">

    <!-- PERSONAL TAB -->
    <template v-if="activeTab === 'personal'">
      <EditorSection title="Personal Information" :data="data.personal" @update="data.personal = $event">
        <div class="grid grid-cols-2 gap-4">
          <div><label class="block text-[10px] text-slate-500 mb-1 font-bold">Name</label><input
              v-model="data.personal.name"
              class="w-full text-xs box-border border border-slate-200 rounded p-2 outline-none focus:border-[#01a3a4] transition-colors">
          </div>
          <div><label class="block text-[10px] text-slate-500 mb-1 font-bold">Name (Zh)</label><input
              v-model="data.personal.nameZh"
              class="w-full text-xs box-border border border-slate-200 rounded p-2 outline-none focus:border-[#01a3a4] transition-colors">
          </div>
          <div><label class="block text-[10px] text-slate-500 mb-1 font-bold">Document Title</label><input
              v-model="data.personal.documentTitle" :disabled="!data.personal.showDocumentTitle"
              class="w-full text-xs box-border border border-slate-200 rounded p-2 outline-none focus:border-[#01a3a4] transition-colors disabled:bg-slate-100 disabled:text-slate-400">
          </div>
          <div><label class="block text-[10px] text-slate-500 mb-1 font-bold">Show Doc Title</label>
            <div class="h-[34px] flex items-center">
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" v-model="data.personal.showDocumentTitle" class="sr-only peer">
                <div
                  class="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#01a3a4]">
                </div>
                <span class="ml-2 text-xs text-slate-600 font-medium whitespace-nowrap">{{
                  data.personal.showDocumentTitle ? 'Enabled' : 'Disabled' }}</span>
              </label>
            </div>
          </div>
          <div><label class="block text-[10px] text-slate-500 mb-1 font-bold">Phone</label><input
              v-model="data.personal.phone"
              class="w-full text-xs box-border border border-slate-200 rounded p-2 outline-none focus:border-[#01a3a4] transition-colors">
          </div>
          <div><label class="block text-[10px] text-slate-500 mb-1 font-bold">Email</label><input
              v-model="data.personal.email"
              class="w-full text-xs box-border border border-slate-200 rounded p-2 outline-none focus:border-[#01a3a4] transition-colors">
          </div>
          <div><label class="block text-[10px] text-slate-500 mb-1 font-bold">Github (Label)</label><input
              v-model="data.personal.github"
              class="w-full text-xs box-border border border-slate-200 rounded p-2 outline-none focus:border-[#01a3a4] transition-colors">
          </div>
          <div><label class="block text-[10px] text-slate-500 mb-1 font-bold">Github URL</label><input
              v-model="data.personal.githubUrl"
              class="w-full text-xs box-border border border-slate-200 rounded p-2 outline-none focus:border-[#01a3a4] transition-colors">
          </div>
          <div><label class="block text-[10px] text-slate-500 mb-1 font-bold">Website (Label)</label><input
              v-model="data.personal.website"
              class="w-full text-xs box-border border border-slate-200 rounded p-2 outline-none focus:border-[#01a3a4] transition-colors">
          </div>
          <div><label class="block text-[10px] text-slate-500 mb-1 font-bold">Website URL</label><input
              v-model="data.personal.websiteUrl"
              class="w-full text-xs box-border border border-slate-200 rounded p-2 outline-none focus:border-[#01a3a4] transition-colors">
          </div>
        </div>
      </EditorSection>

      <div class="mt-6">
        <EditorSection title="Profile Photo" :data="data.personal" @update="data.personal = $event">
          <div class="flex flex-col gap-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="data.personal.showPhoto"
                class="w-4 h-4 text-[#01a3a4] rounded border-slate-300 focus:ring-[#01a3a4]">
              <span class="text-xs font-bold text-slate-700">Display Profile Photo on CV</span>
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
                <label class="block text-[10px] text-slate-500 mb-1 font-bold">Upload Photo</label>
                <input type="file" accept="image/*" @change="handlePhotoUpload"
                  class="text-xs w-full text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-[#01a3a4] file:text-white hover:file:bg-[#01a3a4]/90 focus:outline-none">
                <p class="text-[9px] text-slate-400 mt-1">Recommended aspect ratio: 3:4. The image is saved directly in
                  the browser using Base64 format.</p>
              </div>
            </div>
          </div>
        </EditorSection>
      </div>

      <div class="mt-6">
        <EditorSection title="Footer Content" :data="data.personal" @update="data.personal = $event">
          <div class="grid grid-cols-2 gap-4">
            <div><label class="block text-[10px] text-slate-500 mb-1 font-bold">Footer Title</label><input
                v-model="data.personal.footerTitle" :disabled="!data.personal.showFooterTitle"
                class="w-full text-xs box-border border border-slate-200 rounded p-2 outline-none focus:border-[#01a3a4] transition-colors disabled:bg-slate-100 disabled:text-slate-400">
            </div>
            <div><label class="block text-[10px] text-slate-500 mb-1 font-bold">Show Footer Title</label>
              <div class="h-[34px] flex items-center">
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" v-model="data.personal.showFooterTitle" class="sr-only peer">
                  <div
                    class="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#01a3a4]">
                  </div>
                  <span class="ml-2 text-xs text-slate-600 font-medium whitespace-nowrap">{{
                    data.personal.showFooterTitle ? 'Enabled' : 'Disabled' }}</span>
                </label>
              </div>
            </div>
            <div>
              <label class="block text-[10px] text-slate-500 mb-1 font-bold">Last Modified Text</label>
              <div class="flex gap-1">
                <input v-model="data.personal.lastModifiedText" :disabled="!data.personal.showLastModified"
                  class="w-full text-xs box-border border border-slate-200 rounded p-2 outline-none focus:border-[#01a3a4] transition-colors disabled:bg-slate-100 disabled:text-slate-400">
                <button
                  @click="data.personal.lastModifiedText = `Last modified: ${new Date().toISOString().split('T')[0].replace(/-/g, '.')}`"
                  :disabled="!data.personal.showLastModified" title="Sync to Today's Date"
                  class="px-2 border border-slate-200 rounded bg-white text-slate-500 disabled:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed hover:bg-slate-50 hover:text-[#01a3a4] hover:border-[#01a3a4]/30 transition-colors">
                  <i class="fa-solid fa-clock-rotate-left"></i>
                </button>
              </div>
            </div>
            <div><label class="block text-[10px] text-slate-500 mb-1 font-bold">Show Last Modified</label>
              <div class="h-[34px] flex items-center">
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" v-model="data.personal.showLastModified" class="sr-only peer">
                  <div
                    class="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#01a3a4]">
                  </div>
                  <span class="ml-2 text-xs text-slate-600 font-medium whitespace-nowrap">{{
                    data.personal.showLastModified ? 'Enabled' : 'Disabled' }}</span>
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
      <EditorSection title="Education" :data="data.education" @update="data.education = $event"
        v-model:settings="data.sectionSettings.education">
        <div class="space-y-4">
          <div v-for="(ed, idx) in data.education" :key="idx"
            class="p-3 border border-slate-200 bg-slate-50/50 rounded relative group">
            <button class="absolute top-2 right-2 text-slate-400 hover:text-red-500 transition-colors"
              @click="data.education.splice(idx, 1)"><i class="fa-solid fa-trash text-xs"></i></button>
            <div class="grid grid-cols-2 gap-3 mb-2">
              <div class="col-span-2"><label
                  class="block text-[10px] text-slate-500 font-bold mb-1">Institution</label><input
                  v-model="ed.institution"
                  class="w-full text-xs border border-slate-200 rounded p-1.5 outline-none focus:border-[#01a3a4] bg-white">
              </div>
              <div><label class="block text-[10px] text-slate-500 font-bold mb-1">Degree</label><input
                  v-model="ed.degree"
                  class="w-full text-xs border border-slate-200 rounded p-1.5 outline-none focus:border-[#01a3a4] bg-white">
              </div>
              <div><label class="block text-[10px] text-slate-500 font-bold mb-1">Location</label><input
                  v-model="ed.location"
                  class="w-full text-xs border border-slate-200 rounded p-1.5 outline-none focus:border-[#01a3a4] bg-white">
              </div>
              <div><label class="block text-[10px] text-slate-500 font-bold mb-1">Start Date</label><input
                  v-model="ed.startDate"
                  class="w-full text-xs border border-slate-200 rounded p-1.5 outline-none focus:border-[#01a3a4] bg-white">
              </div>
              <div><label class="block text-[10px] text-slate-500 font-bold mb-1">End Date</label><input
                  v-model="ed.endDate"
                  class="w-full text-xs border border-slate-200 rounded p-1.5 outline-none focus:border-[#01a3a4] bg-white">
              </div>
            </div>
          </div>
          <button
            @click="data.education.push({ id: generateId(), institution: 'New Institution', degree: '', location: '', startDate: '', endDate: '' })"
            class="w-full py-2.5 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 text-xs font-semibold hover:border-[#01a3a4] hover:text-[#01a3a4] transition-colors"><i
              class="fa-solid fa-plus mr-1"></i> Add Education</button>
        </div>
      </EditorSection>

      <EditorSection title="Skills" :data="data.skills" @update="data.skills = $event"
        v-model:settings="data.sectionSettings.skills">
        <div class="space-y-4">
          <div v-for="(skill, idx) in data.skills" :key="idx"
            class="p-3 border border-slate-200 bg-slate-50/50 rounded relative group">
            <button @click="data.skills.splice(idx, 1)"
              class="absolute top-2 right-2 text-slate-400 hover:text-red-500 transition-colors"><i
                class="fa-solid fa-trash text-xs"></i></button>
            <div class="grid grid-cols-2 gap-3 mb-3 pr-6">
              <div><label class="block text-[10px] text-slate-500 font-bold mb-1">Category</label><input
                  v-model="skill.category"
                  class="w-full text-xs border border-slate-200 rounded p-1.5 outline-none focus:border-[#01a3a4] bg-white">
              </div>
              <div><label class="block text-[10px] text-slate-500 font-bold mb-1">Icon Class (Optional)</label>
                <IconPicker v-model="skill.icon" />
              </div>
            </div>
            <div>
              <label class="block text-[10px] text-slate-500 font-bold mb-1">Items <span
                  class="font-normal">(comma-separated)</span></label>
              <textarea :value="skill.items.join(', ')"
                @change="(e) => skill.items = (e.target as HTMLTextAreaElement).value.split(',').map(s => s.trim()).filter(s => s)"
                class="w-full text-xs border border-slate-200 rounded p-2 outline-none focus:border-[#01a3a4] bg-white resize-y"
                rows="2"></textarea>
            </div>
          </div>
          <button
            @click="data.skills.push({ id: generateId(), category: 'New Category', icon: 'fa-solid fa-star', items: [] })"
            class="w-full py-2.5 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 text-xs font-semibold hover:border-[#01a3a4] hover:text-[#01a3a4] transition-colors"><i
              class="fa-solid fa-plus mr-1"></i> Add Skill Category</button>
        </div>
      </EditorSection>
    </template>

    <!-- ARTICLES TAB -->
    <template v-if="activeTab === 'articles'">
      <div class="mb-4 bg-white border border-[#01a3a4]/20 rounded-lg p-3">
        <label class="block text-xs font-bold text-[#01a3a4] mb-2"><i class="fa-solid fa-file-import mr-1"></i> Import
          BibTeX</label>
        <textarea v-model="bibtexInput"
          class="w-full text-xs box-border border border-slate-200 rounded p-2 outline-none focus:border-[#01a3a4] transition-colors resize-y h-24 custom-scrollbar mb-2"
          placeholder="Paste your BibTeX citations here..."></textarea>
        <button @click="handleBibtexImport"
          class="px-3 py-1.5 text-xs font-semibold text-white rounded bg-[#01a3a4] hover:bg-[#01a3a4]/90 transition-colors shadow-sm">
          Parse & Append
        </button>
      </div>

      <EditorSection title="Publications" :data="data.articles" @update="data.articles = $event"
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
                {{ ar.title || 'Untitled Publication' }}
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
                <div class="col-span-12"><label
                    class="block text-[10px] text-[#01a3a4] font-bold mb-1">Title</label><input v-model="ar.title"
                    class="w-full font-semibold text-xs border border-[#01a3a4]/30 bg-white rounded p-1.5 outline-none focus:border-[#01a3a4]">
                </div>
                <div class="col-span-6"><label class="block text-[10px] text-[#01a3a4] font-bold mb-1">Journal
                    Name</label><input v-model="ar.journal"
                    class="w-full text-xs border border-[#01a3a4]/30 bg-white rounded p-1.5 outline-none focus:border-[#01a3a4]">
                </div>
                <div class="col-span-6"><label class="block text-[10px] text-[#01a3a4] font-bold mb-1">DOI</label><input
                    v-model="ar.doi"
                    class="w-full text-xs border border-[#01a3a4]/30 bg-white rounded p-1.5 outline-none focus:border-[#01a3a4]">
                </div>
                <div class="col-span-3"><label
                    class="block text-[10px] text-[#01a3a4] font-bold mb-1">Year</label><input v-model="ar.year"
                    class="w-full text-xs border border-[#01a3a4]/30 bg-white rounded p-1.5 outline-none focus:border-[#01a3a4]">
                </div>
                <div class="col-span-3"><label
                    class="block text-[10px] text-[#01a3a4] font-bold mb-1">Vol(Issue)</label><input
                    v-model="ar.volumeAndIssue"
                    class="w-full text-xs border border-[#01a3a4]/30 bg-white rounded p-1.5 outline-none focus:border-[#01a3a4]">
                </div>
                <div class="col-span-3"><label
                    class="block text-[10px] text-[#01a3a4] font-bold mb-1">Pages</label><input v-model="ar.pages"
                    class="w-full text-xs border border-[#01a3a4]/30 bg-white rounded p-1.5 outline-none focus:border-[#01a3a4]">
                </div>
                <div class="col-span-3"><label class="block text-[10px] text-[#01a3a4] font-bold mb-1">Impact
                    Factor</label><input type="number" step="0.1" v-model="ar.impactFactor"
                    class="w-full text-xs border border-[#01a3a4]/30 bg-white rounded p-1.5 outline-none focus:border-[#01a3a4]"
                    placeholder="(0=Chapter)"></div>
              </div>

              <div class="mt-3 border-t border-[#01a3a4]/10 pt-3">
                <label class="flex justify-between items-end text-[10px] text-[#01a3a4] font-bold mb-2">
                  <span>Authors (Click to toggle properties)</span>
                </label>
                <div class="flex flex-wrap gap-2">
                  <div v-for="(au, i) in ar.authors" :key="i"
                    class="text-[10px] flex flex-col bg-white border border-[#01a3a4]/30 rounded overflow-hidden shadow-sm hover:border-[#01a3a4]/60 transition-colors">
                    <div class="flex items-center">
                      <input v-model="au.name" class="px-1.5 py-1 text-center font-semibold text-xs outline-none w-24">
                      <button @click="ar.authors.splice(i, 1)" class="px-1 text-slate-300 hover:text-red-500"
                        title="Remove author"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <div class="flex flex-row text-[9px] divide-x divide-slate-100 border-t border-slate-100">
                      <button @click="au.isMe = !au.isMe"
                        :class="au.isMe ? 'bg-[#01a3a4] text-white' : 'text-slate-500 hover:bg-slate-50'"
                        class="flex-1 py-1 px-1 text-center transition-colors" title="Toggle 'Me' (Bold)">Me</button>
                      <button @click="au.isFirst = !au.isFirst"
                        :class="au.isFirst ? 'bg-orange-500 text-white' : 'text-slate-500 hover:bg-slate-50'"
                        class="flex-1 py-1 px-1 text-center transition-colors"
                        title="Toggle First Author (#)">#</button>
                      <button @click="au.isCorresponding = !au.isCorresponding"
                        :class="au.isCorresponding ? 'bg-blue-500 text-white' : 'text-slate-500 hover:bg-slate-50'"
                        class="flex-1 py-1 px-1 text-center transition-colors"
                        title="Toggle Corresponding (*)">*</button>
                    </div>
                  </div>
                  <button
                    @click="ar.authors.push({ name: 'New Author', isMe: false, isFirst: false, isCorresponding: false })"
                    class="text-[10px] px-2 py-1 bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200 rounded shadow-sm flex items-center justify-center h-full min-h-[44px]">
                    <i class="fa-solid fa-plus"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <button
            @click="data.articles.push({ id: generateId(), title: 'New Publication', authors: [{ name: 'Me', isMe: true, isFirst: true, isCorresponding: false }], journal: '', year: '', doi: '' })"
            class="w-full py-2.5 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 text-xs font-semibold hover:border-[#01a3a4] hover:text-[#01a3a4] transition-colors"><i
              class="fa-solid fa-plus mr-1"></i> Add Publication</button>
        </div>
      </EditorSection>

      <EditorSection title="Conference Proceedings" :data="data.conferences" @update="data.conferences = $event"
        v-model:settings="data.sectionSettings.conferences">
        <div class="space-y-4">
          <div v-for="(cf, idx) in data.conferences" :key="idx"
            class="p-3 border border-slate-200 bg-slate-50/50 rounded relative group">
            <button @click="data.conferences.splice(idx, 1)"
              class="absolute top-2 right-2 text-slate-400 hover:text-red-500 transition-colors"><i
                class="fa-solid fa-trash text-xs"></i></button>
            <div class="grid grid-cols-2 gap-3 mb-2 pr-6">
              <div class="col-span-2"><label class="block text-[10px] text-slate-500 font-bold mb-1">Conference
                  Name</label><input v-model="cf.name"
                  class="w-full font-medium text-xs border border-slate-200 rounded p-1.5 outline-none focus:border-[#01a3a4] bg-white">
              </div>
              <div><label class="block text-[10px] text-slate-500 font-bold mb-1">Date</label><input
                  v-model="cf.dateStr"
                  class="w-full text-xs border border-slate-200 rounded p-1.5 outline-none focus:border-[#01a3a4] bg-white">
              </div>
              <div><label class="block text-[10px] text-slate-500 font-bold mb-1">Location</label><input
                  v-model="cf.location"
                  class="w-full text-xs border border-slate-200 rounded p-1.5 outline-none focus:border-[#01a3a4] bg-white">
              </div>
              <div class="col-span-2"><label class="block text-[10px] text-slate-500 font-bold mb-1">Type (e.g., Poster
                  presentation)</label><input v-model="cf.type"
                  class="w-full text-xs border border-slate-200 rounded p-1.5 outline-none focus:border-[#01a3a4] bg-white">
              </div>
            </div>
          </div>
          <button
            @click="data.conferences.push({ id: generateId(), name: 'New Conference', dateStr: '', location: '', type: '' })"
            class="w-full py-2.5 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 text-xs font-semibold hover:border-[#01a3a4] hover:text-[#01a3a4] transition-colors"><i
              class="fa-solid fa-plus mr-1"></i> Add Conference</button>
        </div>
      </EditorSection>
    </template>

    <!-- EMPLOYMENT TAB -->
    <template v-if="activeTab === 'employment'">
      <EditorSection title="Employment History" :data="data.employment" @update="data.employment = $event"
        v-model:settings="data.sectionSettings.employment">
        <div class="space-y-4">
          <div v-for="(em, idx) in data.employment" :key="idx"
            class="p-3 border border-slate-200 bg-slate-50/50 rounded relative group">
            <button @click="data.employment.splice(idx, 1)"
              class="absolute top-2 right-2 text-slate-400 hover:text-red-500 transition-colors"><i
                class="fa-solid fa-trash text-xs"></i></button>
            <div class="grid grid-cols-2 gap-3 mb-2 pr-6">
              <div class="col-span-2"><label
                  class="block text-[10px] text-slate-500 font-bold mb-1">Role/Title</label><input v-model="em.role"
                  class="w-full font-medium text-xs border border-slate-200 rounded p-1.5 outline-none focus:border-[#01a3a4] bg-white">
              </div>
              <div class="col-span-2"><label
                  class="block text-[10px] text-slate-500 font-bold mb-1">Institution/Company</label><input
                  v-model="em.institution"
                  class="w-full text-xs border border-slate-200 rounded p-1.5 outline-none focus:border-[#01a3a4] bg-white">
              </div>
              <div><label class="block text-[10px] text-slate-500 font-bold mb-1">Location</label><input
                  v-model="em.location"
                  class="w-full text-xs border border-slate-200 rounded p-1.5 outline-none focus:border-[#01a3a4] bg-white">
              </div>
              <div class="flex gap-2">
                <div class="w-1/2"><label class="block text-[10px] text-slate-500 font-bold mb-1">Start
                    Date</label><input v-model="em.startDate"
                    class="w-full text-xs border border-slate-200 rounded p-1.5 outline-none focus:border-[#01a3a4] bg-white">
                </div>
                <div class="w-1/2"><label class="block text-[10px] text-slate-500 font-bold mb-1">End Date</label><input
                    v-model="em.endDate"
                    class="w-full text-xs border border-slate-200 rounded p-1.5 outline-none focus:border-[#01a3a4] bg-white">
                </div>
              </div>
            </div>
          </div>
          <button
            @click="data.employment.push({ id: generateId(), role: 'New Role', institution: '', location: '', startDate: '', endDate: '' })"
            class="w-full py-2.5 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 text-xs font-semibold hover:border-[#01a3a4] hover:text-[#01a3a4] transition-colors"><i
              class="fa-solid fa-plus mr-1"></i> Add Employment</button>
        </div>
      </EditorSection>
    </template>

    <!-- OTHER META DATA TAB (Awards, Fundings, Academic Contributions) -->
    <template v-if="activeTab === 'other'">
      <EditorSection title="Awards & Honors" :data="data.awards" @update="data.awards = $event"
        v-model:settings="data.sectionSettings.awards">
        <div class="space-y-4">
          <div v-for="(aw, idx) in data.awards" :key="idx"
            class="p-3 border border-slate-200 bg-slate-50/50 rounded relative group">
            <button @click="data.awards.splice(idx, 1)"
              class="absolute top-2 right-2 text-slate-400 hover:text-red-500 transition-colors"><i
                class="fa-solid fa-trash text-xs"></i></button>
            <div class="grid grid-cols-2 gap-3 mb-2 pr-6">
              <div class="col-span-2"><label class="block text-[10px] text-slate-500 font-bold mb-1">Award
                  Title</label><input v-model="aw.title"
                  class="w-full font-medium text-xs border border-slate-200 rounded p-1.5 outline-none focus:border-[#01a3a4] bg-white">
              </div>
              <div><label class="block text-[10px] text-slate-500 font-bold mb-1">Issuer / Organizer</label><input
                  v-model="aw.issuer"
                  class="w-full text-xs border border-slate-200 rounded p-1.5 outline-none focus:border-[#01a3a4] bg-white">
              </div>
              <div><label class="block text-[10px] text-slate-500 font-bold mb-1">Date</label><input
                  v-model="aw.dateStr"
                  class="w-full text-xs border border-slate-200 rounded p-1.5 outline-none focus:border-[#01a3a4] bg-white">
              </div>
              <div class="col-span-2">
                <label class="block text-[10px] text-slate-500 font-bold mb-1">Description</label>
                <textarea v-model="aw.description"
                  class="w-full text-xs border border-slate-200 bg-white rounded p-2 outline-none focus:border-[#01a3a4] resize-y custom-scrollbar"
                  rows="2"></textarea>
              </div>
            </div>
            <!-- Sub-editor for award links could go here -->
          </div>
          <button
            @click="data.awards.push({ id: generateId(), title: 'New Award', issuer: '', dateStr: '', description: '', links: [] })"
            class="w-full py-2.5 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 text-xs font-semibold hover:border-[#01a3a4] hover:text-[#01a3a4] transition-colors"><i
              class="fa-solid fa-plus mr-1"></i> Add Award</button>
        </div>
      </EditorSection>

      <EditorSection title="Research Fundings (Academic Block)" :data="data.fundings" @update="data.fundings = $event"
        v-model:settings="data.sectionSettings.academic">
        <div class="space-y-4">
          <div v-for="(fd, idx) in data.fundings" :key="idx"
            class="p-3 border border-slate-200 bg-slate-50/50 rounded relative group">
            <button @click="data.fundings.splice(idx, 1)"
              class="absolute top-2 right-2 text-slate-400 hover:text-red-500 transition-colors"><i
                class="fa-solid fa-trash text-xs"></i></button>
            <div class="grid grid-cols-2 gap-3 mb-2 pr-6">
              <div class="col-span-2"><label class="block text-[10px] text-slate-500 font-bold mb-1">Project
                  Title</label><input v-model="fd.title"
                  class="w-full text-xs border border-slate-200 rounded p-1.5 outline-none focus:border-[#01a3a4] bg-white">
              </div>
              <div class="col-span-2"><label class="block text-[10px] text-slate-500 font-bold mb-1">Funding
                  Source</label><input v-model="fd.source"
                  class="w-full text-xs border border-slate-200 rounded p-1.5 outline-none focus:border-[#01a3a4] bg-white">
              </div>
              <div><label class="block text-[10px] text-slate-500 font-bold mb-1">Grant Number</label><input
                  v-model="fd.grantNo"
                  class="w-full text-xs border border-slate-200 rounded p-1.5 outline-none focus:border-[#01a3a4] bg-white">
              </div>
              <div><label class="block text-[10px] text-slate-500 font-bold mb-1">Duration/Period</label><input
                  v-model="fd.period"
                  class="w-full text-xs border border-slate-200 rounded p-1.5 outline-none focus:border-[#01a3a4] bg-white">
              </div>
              <div class="col-span-2"><label class="block text-[10px] text-slate-500 font-bold mb-1">Your
                  Role</label><input v-model="fd.role"
                  class="w-full text-xs border border-slate-200 rounded p-1.5 outline-none focus:border-[#01a3a4] bg-white">
              </div>
            </div>
          </div>
          <button
            @click="data.fundings.push({ id: generateId(), source: '', grantNo: '', title: 'New Funding', period: '', role: '' })"
            class="w-full py-2.5 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 text-xs font-semibold hover:border-[#01a3a4] hover:text-[#01a3a4] transition-colors"><i
              class="fa-solid fa-plus mr-1"></i> Add Funding</button>
        </div>
      </EditorSection>

      <EditorSection title="Extra Academic Items"
        :data="{ societyServices: data.societyServices, reviews: data.reviews, contributions: data.contributions }"
        @update="data.societyServices = $event.societyServices; data.reviews = $event.reviews; data.contributions = $event.contributions">
        <div class="text-xs text-slate-600 mb-4 bg-slate-100 p-3 rounded shadow-inner">
          <i class="fa-solid fa-circle-info text-[#01a3a4] mr-1"></i>
          These are simple lists of strings. To edit them easily (add, remove, change order), please switch to the
          <strong>JSON tab</strong> above.
        </div>
        <div class="mb-4">
          <label class="block text-xs font-bold text-slate-700 mb-1 border-l-2 border-[#01a3a4] pl-2">Society Services
            <span class="font-normal text-slate-400">({{ data.societyServices.length }} items)</span></label>
        </div>
        <div class="mb-4">
          <label class="block text-xs font-bold text-slate-700 mb-1 border-l-2 border-[#01a3a4] pl-2">Reviews <span
              class="font-normal text-slate-400">({{ data.reviews.length }} items)</span></label>
        </div>
        <div class="mb-2">
          <label class="block text-xs font-bold text-slate-700 mb-1 border-l-2 border-[#01a3a4] pl-2">Contributions
            <span class="font-normal text-slate-400">({{ data.contributions.length }} items)</span></label>
        </div>
      </EditorSection>
    </template>

    <!-- CUSTOM SECTIONS TAB -->
    <template v-if="activeTab === 'custom'">
      <div class="mb-4 text-xs text-slate-500 bg-slate-100 p-3 rounded shadow-sm border border-slate-200">
        <i class="fa-solid fa-shapes mr-1 text-[#01a3a4]"></i> Custom sections allow you to create completely new resume
        blocks (e.g., 'Projects', 'Volunteering', 'Certificates') with custom titles and generic content structures.
      </div>
      <div class="space-y-6">
        <div v-for="(sec, sIdx) in data.customSections" :key="sec.id"
          class="border-2 border-slate-200 rounded-lg bg-white relative overflow-hidden shadow-sm">

          <div
            class="px-3 py-2 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:justify-between md:items-center gap-2">
            <div class="flex items-center gap-2 flex-1">
              <input type="checkbox" v-model="sec.visible" title="Toggle section visibility"
                class="accent-[#01a3a4] cursor-pointer w-3.5 h-3.5 rounded shrink-0">
              <input v-model="sec.title"
                class="text-[11px] font-bold text-slate-700 uppercase tracking-wider bg-transparent border-b border-dashed border-slate-300 hover:border-slate-400 focus:border-[#01a3a4] outline-none px-1 py-0.5 w-full max-w-[200px]"
                placeholder="Custom Section Title">
            </div>
            <button @click="removeCustomSection(sIdx)"
              class="text-[10px] text-red-500 hover:text-red-600 transition shrink-0 font-medium">Remove
              Section</button>
          </div>

          <div class="p-4 bg-white" :class="{ 'opacity-50 grayscale transition-all duration-300': !sec.visible }">
            <div class="space-y-4">
              <div v-for="(item, iIdx) in sec.items" :key="item.id"
                class="p-3 border border-slate-200 bg-slate-50/50 rounded relative group">
                <button @click="sec.items.splice(iIdx, 1)"
                  class="absolute top-2 right-2 text-slate-400 hover:text-red-500 transition-colors"><i
                    class="fa-solid fa-trash text-xs"></i></button>
                <div class="grid grid-cols-2 gap-3 mb-2 pr-6">
                  <div class="col-span-2"><label class="block text-[10px] text-slate-500 font-bold mb-1">Item
                      Title</label><input v-model="item.title" placeholder="e.g. Project Name"
                      class="w-full font-medium text-xs border border-slate-200 rounded p-1.5 outline-none focus:border-[#01a3a4] bg-white">
                  </div>
                  <div><label class="block text-[10px] text-slate-500 font-bold mb-1">Subtitle</label><input
                      v-model="item.subtitle"
                      class="w-full text-xs border border-slate-200 rounded p-1.5 outline-none focus:border-[#01a3a4] bg-white">
                  </div>
                  <div><label class="block text-[10px] text-slate-500 font-bold mb-1">Date</label><input
                      v-model="item.dateStr"
                      class="w-full text-xs border border-slate-200 rounded p-1.5 outline-none focus:border-[#01a3a4] bg-white">
                  </div>
                  <div><label class="block text-[10px] text-slate-500 font-bold mb-1">Location</label><input
                      v-model="item.location"
                      class="w-full text-xs border border-slate-200 rounded p-1.5 outline-none focus:border-[#01a3a4] bg-white">
                  </div>
                  <div class="col-span-2">
                    <label class="block text-[10px] text-slate-500 font-bold mb-1">Description</label>
                    <textarea v-model="item.description"
                      class="w-full text-xs border border-slate-200 bg-white rounded p-2 outline-none focus:border-[#01a3a4] resize-y custom-scrollbar"
                      rows="2"></textarea>
                  </div>
                </div>
                <div class="mt-2 border-t border-slate-200 pt-2">
                  <label class="block text-[10px] text-slate-500 font-bold mb-1">Bullet Points <span
                      class="font-normal">(One per line)</span></label>
                  <textarea :value="item.bullets?.join('\n')"
                    @change="(e) => item.bullets = (e.target as HTMLTextAreaElement).value.split('\n').map(s => s.trim()).filter(s => s)"
                    class="w-full text-xs border border-slate-200 bg-white rounded p-2 outline-none focus:border-[#01a3a4] resize-y custom-scrollbar"
                    rows="3"></textarea>
                </div>
              </div>
              <!-- Add Custom Item Button -->
              <button
                @click="sec.items.push({ id: generateId(), title: 'New Item', subtitle: '', dateStr: '', location: '', description: '', bullets: [] })"
                class="w-full py-2.5 border border-dashed border-slate-300 rounded-lg text-slate-500 text-xs font-semibold hover:border-[#01a3a4] hover:text-[#01a3a4] transition-colors"><i
                  class="fa-solid fa-plus mr-1"></i> Add Item into {{ sec.title || 'this section' }}</button>
            </div>
          </div>
        </div>

        <button @click="addCustomSection"
          class="w-full py-3 bg-[#e6f6f6] border border-[#01a3a4]/20 rounded-lg text-[#01a3a4] text-sm font-semibold hover:bg-[#d0efef] transition-colors shadow-sm"><i
            class="fa-solid fa-folder-plus mr-1"></i> Create New Custom Section</button>
      </div>
    </template>

    <!-- SETTINGS / RAW TEMPLATE TAB -->
    <template v-if="activeTab === 'settings'">
      <div class="mb-4 border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm p-4">
        <h3 class="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Global
          Settings</h3>
        <label class="block text-xs font-bold text-slate-500 mb-2">Accent / Theme Color</label>
        <div class="flex items-center gap-3">
          <input type="color" v-model="data.themeColor"
            class="w-10 h-10 rounded border border-slate-200 p-0 cursor-pointer shadow-inner">
          <input type="text" v-model="data.themeColor"
            class="text-sm font-mono border border-slate-200 rounded p-1.5 outline-none w-28 focus:border-[#01a3a4]">
        </div>

        <label class="block text-xs font-bold text-slate-500 mb-2 mt-4">Font Scale</label>
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
        <p class="text-[10px] text-slate-400 mt-1">Adjust to fit more content on pages (70%-120%)</p>
      </div>

      <div class="mb-6 border border-slate-200 rounded-lg bg-white shadow-sm p-4" v-if="data.sectionOrder">
        <h3 class="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
          Section Display Order</h3>
        <p class="text-[10px] text-slate-500 mb-3">Reorder standard and custom sections within the document. The final
          PDF will respect this sequence.</p>
        <div class="space-y-2">
          <div v-for="(secId, index) in data.sectionOrder" :key="secId"
            class="flex justify-between items-center px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700 font-medium">
            <div class="flex items-center gap-2">
              <i class="fa-solid fa-grip-lines text-slate-300"></i>
              <span class="uppercase tracking-wide">{{ getSectionTitle(secId) }}</span>
            </div>
            <div class="flex gap-1">
              <button @click="moveItem(data.sectionOrder, index, -1)" :disabled="index === 0"
                class="w-7 h-7 rounded bg-white border border-slate-200 hover:bg-slate-100 text-slate-500 disabled:opacity-30 flex justify-center items-center transition-colors"><i
                  class="fa-solid fa-arrow-up text-[10px]"></i></button>
              <button @click="moveItem(data.sectionOrder, index, 1)" :disabled="index === data.sectionOrder.length - 1"
                class="w-7 h-7 rounded bg-white border border-slate-200 hover:bg-slate-100 text-slate-500 disabled:opacity-30 flex justify-center items-center transition-colors"><i
                  class="fa-solid fa-arrow-down text-[10px]"></i></button>
            </div>
          </div>
        </div>
      </div>

      <EditorSection title="Data Source Inspection" :data="data" @update="emit('update:modelValue', $event)">
        <div
          class="p-4 bg-orange-50 text-orange-800 text-xs rounded border border-orange-200 leading-relaxed shadow-inner">
          <p class="font-bold mb-1 text-sm"><i class="fa-solid fa-triangle-exclamation mr-1"></i> Advanced Use Only</p>
          <p>Please switch to the <strong>JSON tab</strong> above to manually inspect or overwrite the ENTIRE state of
            the application. To safely backup your CV or restore an old one, please use the <strong>Import JSON</strong>
            and <strong>Export JSON</strong> buttons at the top of the editor.</p>
        </div>
      </EditorSection>
    </template>

  </div>
</template>
