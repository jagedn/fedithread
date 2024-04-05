<script lang="ts" setup>
import router from '@/router';
import {instanceStore} from '@/stores/instance';
import {fedithreadStore} from '@/stores/fedithread';
import {storeToRefs} from 'pinia';
import Textarea from 'primevue/textarea';
import type Toot from '@/model/Toot';
import Image from 'primevue/image';
import Menubar from 'primevue/menubar';
import { ref } from "vue";
import Chip from 'primevue/chip';

const items = ref([
  {
    label: 'Save',
    icon: 'pi pi-save',
    command: () => {
      save()
    }
  },
  {
    label: 'Clean',
    icon: 'pi pi-trash',
    command: () => {
      clean()
    }
  },
  {
    label: 'Publish',
    icon: 'pi pi-share-alt',
    command: () => {
      publish()
    }
  },
  {
    label: 'Logout',
    icon: 'pi pi-sign-out',
    command: () => {
      logout()
    }
  }
]);

import { useToast } from 'primevue/usetoast';

const toast = useToast();

const store = fedithreadStore();
const {thread} = storeToRefs(store)

const instance = instanceStore()
const {currentUser} = storeToRefs(instance)

const addToot = (toot:Toot)=>{
  thread.value?.newTootAfter(toot)
}

const removeToot = (toot : Toot)=>{
  thread.value?.remove(toot)
}

const logout=()=>{
  instanceStore().removeUser();
  router.push('login')
}
const publish= async()=>{
  store.save();
  try {
    await thread.value?.publish(currentUser.value?.accessToken)
    toast.add({severity: 'success', summary: 'Success', detail: 'Thread published', life: 3000});
    clean()
  }catch(e){
    await router.push({name:'login'})
  }
}

const clean=()=>{
  thread.value?.clean()
}

const save=()=>{
  store.save()
  toast.add({ severity: 'success', summary: 'Success', detail: 'Thread saved', life: 3000 });
}

const addImage=(toot:Toot)=>{
  document.body.querySelector(`[data-toot='${toot.index}']`)?.click()
}

const fileSelected= async (event :any, toot :Toot)=>{
  const file = event.target.files[0];
  try {
    const ret = await thread.value?.uploadFile(currentUser.value?.accessToken, file, toot)
    if( ret ){
      toast.add({ severity: 'success', summary: 'Success', detail: 'Media uploaded', life: 3000 });
    }
  }catch (e){
    console.log("posible access token expired, relogin")
    await router.push({name:'login'})
  }
}

const removeImage=(event:Event, toot:Toot)=>{
  event.preventDefault();
  const image = event.target;
  if( window.confirm("Do you want to remove the image?")){
    const idx = image?.getAttribute("data-image-toot") || -1
    if( idx > -1) {
      toot.removeImage(idx)
    }
  }
}

const tags = ref("")
const setTags = (tag:string)=>{
  thread.value?.setTags(tag)
}

const maxLength = ()=>{
  return currentUser.value?.maxTootChars - (thread.value?.tags?.length || 0) - 5;
}

if (!instance.getUser()) {
  router.push('login')
}else{
  store.get(instance.getUser()?.url)
}

</script>

<template>
  <div class="grid absolute top-0 py-3 lg:w-4 sm:w-4 font-bold">

    <div class="col-11">
      <Chip :label="currentUser?.url" image="fediverse.png" />
    </div>

    <div class="col-11">
      <Menubar :model="items"/>
    </div>

    <div class="col-11">
      <div class="grid">
        <span class="lg:col-1">Footer</span>
        <InputText id="tags" v-model="tags" class="col-6"/>
        <Chip icon="pi pi-tags" class="col-1" severity="secondary" @click="setTags(tags)" :disabled="!tags.length"/>
        <Chip icon="pi pi-undo" class="col-1" severity="secondary" @click="setTags('')"/>
      </div>
    </div>

    <div v-for="(t,idx) in thread?.toots" class="col-11 surface-100">
      <Card class="bg-primary-reverse">

        <template #header>
          <div class="grid">
            <Chip icon="pi pi-plus" class="col-1 col-offset-1" severity="secondary" @click="addToot(t)"/>
            <Chip icon="pi pi-minus" class="col-1" severity="secondary" v-if="idx!=0" @click="removeToot(t)"/>
          </div>
        </template>

        <template #content>
          <div class="grid">
            <span class="text-sm col-1">{{ idx + 1 }}</span>

            <Textarea v-model="t.message" class="col-11" rows="5" :maxlength="maxLength"/>

            <p class="col-12" v-if="thread?.tags?.length">
              {{thread?.tags}}
            </p>
          </div>
        </template>
        <template #footer>
          <div class="grid">
            <span class="message-counter text-xs col-3">{{ t.message.length }} / {{maxLength()}}</span>
            <Button icon="pi pi-images" class="col-1" severity="secondary" @click="addImage(t)" :disabled="t.files.length>1"/>
            <input :data-toot="t.index" class="file-input" type="file" accept="image/png, image/jpeg" @change="fileSelected($event,t)" hidden="true">
          </div>

          <div class="grid">
            <div class="col-6 grid" v-for="(f,fidx) in t.files">
              <Image width="100" :src="f.preview" :data-image-toot="fidx" @click.stop="removeImage($event,t)" class="col-12"/>
              <InputText v-model="f.description"  class="col-12"/>
            </div>
          </div>

        </template>
      </Card>

    </div>
    <em>Made with love by jorge@social.aguilera.soy</em>
  </div>
</template>
