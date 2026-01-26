<script>
    import { onMount } from "svelte";
    import { userState, startSession } from "$lib/user.svelte";
    import { jwtDecode } from "jwt-decode";
    import { fade } from "svelte/transition";

    let loading = false;

    async function handleCredentialResponse(response) {
        // console.log("Encoded JWT ID token:", response.credential);
        loading = true;

        try {
            const session = await startSession(response.credential);
            const user = jwtDecode(response.credential);

            userState.name = user.name;
            userState.email = user.email;
            userState.picture = user.picture;
            userState.session_token = session.session_token;

            localStorage.setItem("user", JSON.stringify(userState));
            window.location.replace(window.location.origin);
        } catch (error) {
            console.error("Login failed", error);
            loading = false;
        }
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
            { theme: "outline", size: "large", shape: "pill", width: "100%" }, // Adjusted for better fit
        );
    });
</script>

<div
    class="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50"
>
    <div
        class="w-full max-w-sm bg-white rounded-3xl shadow-sm border border-slate-200 p-8 text-center"
        in:fade={{ duration: 300 }}
    >
        <div class="mb-10 flex flex-col items-center gap-3">
            <div
                class="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 mb-2"
            >
                <span class="material-symbols-outlined">wallet</span>
            </div>
            <h1 class="text-3xl font-bold tracking-tight text-slate-900">
                CC Pay
            </h1>
            <p class="text-slate-500 text-sm">Seamless coupon payments.</p>
        </div>

        {#if loading}
            <div class="flex justify-center py-4">
                <div
                    class="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"
                ></div>
            </div>
        {:else}
            <div
                id="buttonDiv"
                class="w-full flex justify-center h-[50px]"
            ></div>
        {/if}

        <p class="mt-8 text-xs text-slate-400">
            By continuing, you verify that you are an authorized user of this
            internal system.
        </p>
    </div>
</div>
