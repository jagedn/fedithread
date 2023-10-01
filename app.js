//legacy code
function makePostData(args) {
    var data = [];
    Object.keys(args).forEach(function(key) {
        data.push(encodeURIComponent(key) + '=' + encodeURIComponent(args[key]));
    });
    return data.join('&').replace(/%20/g, '+');
}

function post(url, args, done) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            var data = xhr.response;
            done(data);
        }
    }
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.responseType = "json";
    var postData = JSON.stringify(args);
    xhr.send(postData);
}

function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        if (decodeURIComponent(pair[0]) == variable) {
            return decodeURIComponent(pair[1]);
        }
    }
}

function splitText(text) {
    const words = text.split("\n");
    const toots = [];
    var current = '';
    [].forEach.call(words, function(word) {
        if (`${word}`.startsWith('>>>>')) {
            toots.push(current);
            current = '';
        } else {
            const subw = word.split(' ');
            [].forEach.call(subw, function(w) {
                if (`${current} ${w}`.length > 290) {
                    toots.push(current);
                    current = '';
                }
                if (w.length == 0) {
                    w = '<br/><br/>';
                }
                current += ` ${w}`
            })
        }
    })
    toots.push(current);
    return toots;
}
// Legacy Code


class Toot {
    constructor(parent, idx, text) {
        this.parent = parent
        this.idx = idx
        this.files = []
        this.mediasId = []

        this.addMoreCtrl = $(`<button id="addRow_${idx}" type="button" class="button is-small" data-idx=${idx}>
        <span class="icon is-small">
            <i class="fas fa-plus"></i>
        </span></button>`)
        this.addMoreCtrl.toot = this;
        this.addMoreCtrl.on('click', () => {
            if (this.getText().length) {
                this.parent.createToot()
            }
        })

        this.removeCtrl = $(`<button id="removeRow_${idx}" type="button" class="button is-small" data-idx=${idx}>
        <span class="icon is-small">
            <i class="fas fa-trash"></i>
        </span></button>`)
        this.removeCtrl.toot = this;
        this.removeCtrl.on('click', () => {
            this.parent.removeToot(this.idx)
        })

        this.imagesCtrl = $(`<div class="input-group mb-3 images-toot"></div>`)
        this.imagesCtrl.toot = this;

        this.fileCtrl = $(`<div class="file has-name">
        <label class="file-label">
          <input class="file-input" type="file" name="attach_${idx}_0" data-idx=${idx} accept="image/png, image/jpeg">
          <span class="file-cta">
            <span class="file-icon">
              <i class="fas fa-upload"></i>
            </span>
            <span class="file-label">
              Choose a file…
            </span>
          </span>
          <span class="file-name">            
          </span>
        </label>
      </div>
      `)
        this.fileCtrl.toot = this;
        this.fileCtrl.on('change', (e) => {
            const file = e.target.files[0];
            this.parent.uploadFile(file).then(resp => {
                this.fileUploaded(resp)
            });
        });

        const predefined = text || (idx == 0 ? `🧵` : '') + ` ${idx + 1}/n`

        this.textareaCtrl = $(`<textarea class="textarea" 
            placeholder="toot here" id="toot_text_${idx}" maxlength=${this.parent.maxTootChars}>${predefined}</textarea>`)
        this.textareaCtrl.toot = this;
        this.textareaCtrl.on('change keyup paste', (e) => {})

        this.span = $(`<!-- toot ${idx} -->
<div class="box" id="toot_${idx}">
    <div>
        <div class="input-group mb-3 input-toot">            
        </div>
    </div>
    <div class="is-grouped"></div>
</div>
`)
        $('.is-grouped', this.span).append(this.addMoreCtrl)
        if (idx) {
            $('.is-grouped', this.span).append(this.removeCtrl)
        }
        $('.is-grouped', this.span).append(this.imagesCtrl)
        $('.is-grouped', this.span).append(this.fileCtrl)

        $('.input-toot', this.span).append(this.textareaCtrl)
    }
    getText() {
        return this.textareaCtrl.val() || ''
    }

    fileUploaded(data) {
        this.files.push(data);
        const imgCtrl = $(`<button type="button"><image src="${data.preview_url}"/></button>(click to remove)`)
        imgCtrl.on('click', () => {
            console.log(this)
            imgCtrl.remove();
            this.files = [] //TODO: find image and remove from array
        })
        this.imagesCtrl.append(imgCtrl)
    }
}

class FediThread {
    constructor(elem) {
        this.elem = elem
    }

    init(instance, access_token, maxTootChars) {
        this.instance = instance;
        this.access_token = access_token;
        this.toots = [];
        this.maxTootChars = maxTootChars;
        const json = localStorage.getItem("FEDITHREAD_" + instance) || ""
        $(this.elem).html('')
        if (json === "") {
            this.createToot()
        } else {
            this.parseJson(JSON.parse(json))
        }
    }

    createToot(text) {
        var toot = new Toot(this, this.toots.length, text)
        this.toots.push(toot)
        $(this.elem).append(toot.span)
        return toot;
    }

    async parseJson(json) {
        for (var t in json.toots) {
            const toot = this.createToot(json.toots[t].text)
            for (var i in json.toots[t].files) {
                toot.fileUploaded(json.toots[t].files[i])
            }
        }
    }

    removeToot(idx) {
        const toot = this.toots.find((e) => e.idx === idx);
        if (!toot)
            return
        this.toots.splice(idx, 1);
        toot.span.remove()
    }

    async save() {
        const json = {
            createdAt: new Date().toISOString(),
            toots: new Array()
        }
        for (var t in this.toots) {
            const toot = this.toots[t]
            const e = {
                text: toot.getText(),
                files: toot.files
            }
            json.toots.push(e)
        }
        localStorage.setItem("FEDITHREAD_" + this.instance, JSON.stringify(json))
    }

    delete() {
        localStorage.removeItem("FEDITHREAD_" + this.instance)
        this.init()
    }

    async uploadFile(file) {
        if (!this.access_token) {
            alert("Debes identificarte primero en tu instancia")
            return
        }
        var api = new MastodonAPI({
            instance: this.instance,
            api_user_token: this.access_token
        });
        const formData = new FormData()
        formData.append('file', file);
        const resp = await api.postMedia("media", formData)
        return resp;
    }

    async publish() {
        if (!this.access_token) {
            alert("Debes identificarte primero en tu instancia")
            return
        }
        var api = new MastodonAPI({
            instance: this.instance,
            api_user_token: this.access_token
        });

        // upload medias
        for (var t = 0; t < this.toots.length; t++) {
            const toot = this.toots[t];
            if (toot.files.length) {
                toot.mediasId = [];
                for (var i = 0; i < toot.files.length; i++) {
                    const file = toot.files[i];
                    toot.mediasId.push(file.id)
                }
            }
        }

        var in_reply_to_id = null;
        for (var t = 0; t < this.toots.length; t++) {
            const toot = this.toots[t];
            const status = toot.getText()
            if (status && status.length) {
                const tootResp = await api.post("statuses", {
                    status: status,
                    in_reply_to_id: in_reply_to_id,
                    media_ids: toot.mediasId || ''
                });
                in_reply_to_id = tootResp.id;
            }
        };
        alert("Hilo publicado")
    }
}

$(document).ready(() => {

    const fediThread = new FediThread("#fediThread")

    /* main */
    const url = window.location;
    const urlObj = new URL(url);
    urlObj.search = '';
    urlObj.hash = '';
    var redirect_uri = urlObj.toString();
    var mastodon_url = localStorage.getItem("MASTODON_URL");
    var client_id = localStorage.getItem("MASTODON_CLIENT_ID");
    var client_secret = localStorage.getItem("MASTODON_CLIENT_SECRET");


    if (mastodon_url) {
        $("#mastodon_url").val(mastodon_url)
    }

    //from login redirect
    if (window.location.href.indexOf("?code=") !== -1 && mastodon_url != "" && client_id != "" && client_secret != "") {
        var code = getQueryVariable("code");
        var url2 = mastodon_url + "/oauth/token";
        $("#mastodon_url").val(mastodon_url);

        var args2 = {
            client_id: client_id,
            client_secret: client_secret,
            redirect_uri: redirect_uri,
            grant_type: "authorization_code",
            code: code
        };
        $.post(url2, args2, (data) => {
            // login ok            
            $.get(`${mastodon_url}/api/v1/instance`, (details) => {
                fediThread.init($("#mastodon_url").val(), data.access_token, details.max_toot_chars || 300)
                const elements = document.getElementsByClassName("authorized");
                [].forEach.call(elements, function(el) {
                    el.classList.remove("is-hidden")
                })
            })

        })
    } else {
        localStorage.setItem("MASTODON_CLIENT_ID", "");
        localStorage.setItem("MASTODON_CLIENT_SECRET", "");
    }

    // Login
    $("#sbmt").on("submit", (event) => {
        event.preventDefault();
        if (!$("#mastodon_url").val().startsWith("http")) {
            $("#mastodon_url").val("https://" + $("#mastodon_url").val())
        }
        var url = $("#mastodon_url").val() + "/api/v1/apps";
        var scopes = "read write";
        var args = {
            client_name: "FediThread",
            redirect_uris: redirect_uri,
            website: "",
            scopes: scopes
        };
        post(url, args, function(data) {
            localStorage.setItem("MASTODON_URL", $("#mastodon_url").val());
            localStorage.setItem("MASTODON_CLIENT_ID", data.client_id);
            localStorage.setItem("MASTODON_CLIENT_SECRET", data.client_secret);
            var redirectLink = $("#mastodon_url").val() + "/oauth/authorize?client_id=" + data.client_id + "&redirect_uri=" + redirect_uri + "&response_type=code&scope=" + scopes;
            window.location.href = redirectLink;
        });
    });

    $('#btnSave').on('click', (event) => {
        event.preventDefault();
        fediThread.save();
    });

    $('#btnDelete').on('click', (event) => {
        event.preventDefault();
        fediThread.delete();
    });

    $('#btnPublish').on('click', (event) => {
        event.preventDefault();
        fediThread.publish();
    });
})