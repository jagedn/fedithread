<script setup lang="ts">
import {instanceStore} from '@/stores/instance';
import {ref} from 'vue';
import router from '@/router';
const store = instanceStore();

const instance = ref('')

const getQueryVariable = (variable:any) =>{
  var query = window.location.search.substring(1);
  var vars = query.split('&');
  for (var i = 0; i < vars.length; i++) {
    var pair = vars[i].split('=');
    if (decodeURIComponent(pair[0]) == variable) {
      return decodeURIComponent(pair[1]);
    }
  }
}

const current = window.location;
const urlObj = new URL(current.toString());
urlObj.search = '';
urlObj.hash = '';
const redirect_uri = urlObj.toString();

const login= async ()=>{
  const url = 'https://'+ instance.value;
  const scopes = "read write";
  const args = {
    client_name: "FediThread",
    redirect_uris: redirect_uri,
    website: "",
    scopes: scopes
  };
  const response = await fetch(url + "/api/v1/apps",{
    method: "POST",
    mode: "cors",
    cache: "no-cache",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
    },
    redirect: "follow",
    referrerPolicy: "no-referrer",
    body: JSON.stringify(args),
  });
  const json = await response.json()

  const user = {
    url: url,
    clientId: json.client_id,
    clientSecret: json.client_secret,
    accessToken: null,
    maxTootChars: 300
  }
  store.updateUser(user)

  const redirectLink = url + "/oauth/authorize?client_id=" + user.clientId + "&redirect_uri=" + redirect_uri + "&response_type=code&scope=" + scopes;
  window.location.href = redirectLink;
}

if(window.location.href.indexOf("?code=")!=-1){
  const user = store.getUser() || {};
  const code = getQueryVariable("code");
  const url = user.url + "/oauth/token";

  const args = {
    client_id: user.clientId,
    client_secret: user.clientSecret,
    redirect_uri: redirect_uri,
    grant_type: "authorization_code",
    code: code
  };
  fetch(url,{
    method: "POST",
    mode: "cors",
    cache: "no-cache",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
    },
    redirect: "follow",
    referrerPolicy: "no-referrer",
    body: JSON.stringify(args),
  }).then( async (data) => {
    const json = await data.json();
    user.accessToken = json.access_token;

    const details = await fetch(user.url + '/api/v1/instance');
    const detailsJson = await details.json();
    user.maxTootChars = detailsJson.max_toot_chars || 300;

    store.updateUser(user)
    router.push( {name:"home"})
  })
}

</script>

<template>
<div>
  <Panel class="h-full v-full" header="Welcome to FediThread">
    <div class="field grid">
      <label class="col-fixed" for="id" style="width:100px">Instance</label>
      <div class="id">
        https://<InputText id="instance" v-model="instance" type="text"/>
      </div>
    </div>
    <div class="field grid">
      <Button @click="login" label="Login"/>
    </div>
  </Panel>
</div>
</template>
