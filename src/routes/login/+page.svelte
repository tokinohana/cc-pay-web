<script>
    import { onMount } from "svelte";
    import { userState, startSession } from "$lib/user.svelte";

    function parseJwt(token) {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split("")
                .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                .join("")
        );
        return JSON.parse(jsonPayload);
    }

    function handleCredentialResponse(response) {
        console.log("Encoded JWT ID token:", response.credential);

        startSession(response.credential).then(() => {
            const user = parseJwt(response.credential);

            userState.name = user.name;
            userState.email = user.email;
            userState.picture = user.picture;

            localStorage.setItem("user", JSON.stringify(userState));
            window.location.replace(window.location.origin);
        });
    }

    function waitForGoogle() {
        return new Promise((resolve) => {
            if (window.google) return resolve();

            const interval = setInterval(() => {
                if (window.google) {
                    clearInterval(interval);
                    resolve();
                }
            }, 50);
        });
    }

    onMount(async () => {
        await waitForGoogle();

        google.accounts.id.initialize({
            client_id:
                "353499692029-rinrhlrh96le29aenai9fr8fbfq2o7gp.apps.googleusercontent.com",
            callback: handleCredentialResponse,
        });

        google.accounts.id.renderButton(
            document.getElementById("buttonDiv"),
            { theme: "outline", size: "medium", shape: "pill" }
        );
    });
</script>

<div class="flex flex-col items-center h-full justify-between">
    <div class="flex items-center flex-col text-black mt-12">
        <h2 style="font-family: asimovian;" class="italic">Welcome to</h2>
        <h1 class="!text-5xl">CC PAY ZOZS</h1>
    </div>

    <div id="buttonDiv" class="scale-125 mb-6"></div>
</div>
