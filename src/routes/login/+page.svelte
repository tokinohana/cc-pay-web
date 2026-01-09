<script>
    import { onMount } from "svelte";
    import { userState, startSession } from "$lib/user.svelte";

    function parseJwt (token) {
        var base64Url = token.split('.')[1];
        var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    }
    function handleCredentialResponse(response) {
        console.log("Encoded JWT ID token: " + response.credential);
        startSession(response.credential).then(() => {
            const user = parseJwt(response.credential)
            console.log(user)
            if(user.email.split("@")[1] == "kanisius.sch.id") {
                // sessionStorage.setItem("id_token", response.credential)
                userState.id_token = response.credential
                // sessionStorage.setItem("name", user.name)
                userState.name = user.name
                // sessionStorage.setItem("email", user.email)
                userState.email = user.email
                // sessionStorage.setItem("picture", user.picture)
                userState.picture = user.picture
                // alert(JSON.stringify(userState))
                localStorage.setItem("user", JSON.stringify(userState))
                window.location.replace(window.location.origin)
            } else {
                alert("Mohon gunakan email sekolah (___@kanisius.sch.id)")
                window.location.replace(window.location.origin+"/login")
            }
        })
    }

    onMount(() =>  {
        google.accounts.id.initialize({
            client_id: "139622074174-3ijmd86seqaomlu50f8d6ojuc655vuqr.apps.googleusercontent.com",
            callback: handleCredentialResponse
        });
        google.accounts.id.renderButton(
            document.getElementById("buttonDiv"),
            { theme: "outline", size: "medium", shape: "pill" }  // customization attributes
        );
    })
</script>

<div class="flex flex-col items-center h-full justify-between">
    <div class="flex items-center flex-col text-black mt-12">
        <h2 style="font-family: asimovian;" class="italic">Welcome to</h2>
        <h1 class="!text-5xl">CC PAY ZOZS</h1>
    </div>
    <div id="buttonDiv" class="scale-125 mb-6"></div>
</div>