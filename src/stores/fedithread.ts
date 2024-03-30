import { defineStore } from 'pinia'
import Thread from '@/model/Thread';
import {type Ref, ref} from 'vue';


const SETTINGS_LOCAL_STORAGE_FEDITHREAD = 'FEDITHREAD'

export const fedithreadStore = defineStore('fedithread', () => {


  const thread : Ref<Thread|null> = ref( null)

  const get = ( instance : string)=>{
    const json = localStorage.getItem(SETTINGS_LOCAL_STORAGE_FEDITHREAD+"_"+instance);
    thread.value = new Thread(instance)
    if( json ){
      thread.value?.parseJSON(json)
    }
    save()
  }

  const save = ()=>{
    if( thread.value ) {
      localStorage.setItem(SETTINGS_LOCAL_STORAGE_FEDITHREAD+"_"+thread.value?.instance, thread.value?.toJSON());
    }
  }


  return {  thread, get, save }
})
