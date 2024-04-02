<script lang="ts" setup>
import router from '@/router';
import {instanceStore} from '@/stores/instance';
import {fedithreadStore} from '@/stores/fedithread';
import {storeToRefs} from 'pinia';
import Textarea from 'primevue/textarea';
import type Toot from '@/model/Toot';
import Image from 'primevue/image';
import Toast from 'primevue/toast';
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
  <div class="flex-column justify-content-center">
    <Toast position="top-left"/>
    <Card>
      <template #header>
        {{ currentUser?.url }}
        <br/>
        Made with love by jorge@social.aguilera.soy
      </template>
      <template #content>
        <Toolbar>
          <template #start>
            <Button icon="pi pi-share-alt" class="mr-2" severity="primary" @click="publish"/>
            <Button icon="pi pi-save" severity="secondary" @click="save"/>
            <Button icon="pi pi-trash" severity="secondary" @click="clean"/>
            <Button icon="pi pi-sign-out" class="mr-2" severity="secondary" @click="logout"/>
          </template>
        </Toolbar>
      </template>
    </Card>


    <div v-for="(t,idx) in thread?.toots">
      <Card>
        <template #header>
          {{ idx + 1 }} / {{ thread?.toots.length }}
        </template>
        <template #content>
          <p class="m-0">
            <Textarea v-model="t.message" autoResize rows="5" cols="30" :maxlength="currentUser?.maxTootChars-5"/>
          </p>
          <div class="flex gap-3 mt-1">
            <Toolbar>
              <template #start>
                <Button icon="pi pi-images" class="mr-2" severity="secondary" @click="addImage(t)" :disabled="t.files.length>2"/>
                <Button icon="pi pi-plus" class="mr-2" severity="secondary" @click="addToot(t)"/>
                <Button icon="pi pi-minus" class="mr-2" severity="secondary" v-if="idx!=0" @click="removeToot(t)"/>
                <input :data-toot="t.index" class="file-input" type="file" accept="image/png, image/jpeg" @change="fileSelected($event,t)" hidden="true">
              </template>
              <template #end>
                <span class="message-counter">{{ t.message.length }} / {{currentUser?.maxTootChars-5}}</span>
              </template>
            </Toolbar>
          </div>
        </template>
        <template #footer>
          <div class="flex gap-3 mt-1">
            <div class="flex flex-column gap-2" v-for="(f,fidx) in t.files">
              <Image width="100" :src="f.preview" :data-image-toot="fidx" @click.stop="removeImage($event,t)"/>
              <InputText v-model="f.description" />
            </div>
          </div>
        </template>
      </Card>
      <hr/>
    </div>
  </div>
</template>
