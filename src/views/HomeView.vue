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


if (!instance.getUser()) {
  router.push('login')
}else{
  store.get(instance.getUser()?.url)
}

</script>

<template>
  <div class="grid absolute top-0 py-3 w-4 font-bold">

    <div class="col-12">
      <Chip :label="currentUser?.url" image="/fediverse.png" />
    </div>

    <div class="col-12">
      <Menubar :model="items"/>
    </div>

    <div v-for="(t,idx) in thread?.toots" class="col-12 surface-100">
      <Card class="bg-primary-reverse">
        <template #title>
          <span class="text-sm">{{ idx + 1 }} / {{ thread?.toots.length }}</span>
        </template>
        <template #content>
          <p class="m-12">
            <Textarea v-model="t.message" class="w-full" rows="5" :maxlength="currentUser?.maxTootChars-5"/>
          </p>
          <Toolbar>
            <template #start>
              <span class="message-counter text-xs">{{ t.message.length }} / {{currentUser?.maxTootChars-5}}</span>
            </template>
            <template #end>
              <Button icon="pi pi-images" class="mr-2" severity="secondary" @click="addImage(t)" :disabled="t.files.length>1"/>
              <Button icon="pi pi-plus" class="mr-2" severity="secondary" @click="addToot(t)"/>
              <Button icon="pi pi-minus" class="mr-2" severity="secondary" v-if="idx!=0" @click="removeToot(t)"/>
              <input :data-toot="t.index" class="file-input" type="file" accept="image/png, image/jpeg" @change="fileSelected($event,t)" hidden="true">
            </template>
          </Toolbar>
        </template>
        <template #footer>
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
