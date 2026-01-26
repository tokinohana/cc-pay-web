<script>
    import "../../app.css";
    import { onMount } from "svelte";
    import { getMerchantList } from "$lib/user.svelte";
    import { writable } from "svelte/store";
    import thousandsFormat from "$lib/thousandsFormat";
    import { fade, slide } from "svelte/transition";

    const merchant = writable(undefined);
    const balance = writable(undefined);
    const merchant_list = writable([]);
    const check_data = writable(false);
    let loading = true;

    onMount(async () => {
        const list = await getMerchantList();
        merchant_list.set(list);
        loading = false;
    });

    function handleAccess() {
        if ($merchant) {
            const m = $merchant_list.find((m) => m.name === $merchant);
            if (m) {
                balance.set(m.balance);
                check_data.set(true);
            }
        }
    }

    async function handleRefresh() {
        loading = true;
        try {
            const list = await getMerchantList();
            merchant_list.set(list);

            // Update current merchant view if selected
            if ($merchant) {
                const m = list.find((m) => m.name === $merchant);
                if (m) {
                    balance.set(m.balance);
                }
            }
        } catch (error) {
            console.error("Failed to refresh merchants:", error);
            alert("Failed to refresh data");
        } finally {
            loading = false;
        }
    }
</script>

<div
    class="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6"
>
    <div class="w-full max-w-md card p-8 transition-all" in:fade>
        {#if $check_data == true}
            <div class="flex flex-col items-center text-center gap-6" in:slide>
                <div
                    class="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-2"
                >
                    <i class="fa-solid fa-shop text-2xl"></i>
                </div>

                <div>
                    <h1 class="text-2xl font-bold text-slate-900 mb-1">
                        {$merchant}
                    </h1>
                    <p class="text-slate-500 text-sm">Merchant Dashboard</p>
                </div>

                <div
                    class="bg-slate-50 rounded-2xl p-6 w-full border border-slate-100"
                >
                    <p
                        class="text-slate-400 text-xs uppercase font-semibold tracking-wider mb-2"
                    >
                        Total Revenue
                    </p>
                    <p class="text-4xl font-bold text-slate-800 tracking-tight">
                        <span class="text-xl align-top text-slate-400 mr-1"
                            >Rp</span
                        >{thousandsFormat($balance ?? 0)}
                    </p>
                </div>

                <p
                    class="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full"
                >
                    History disabled by policy
                </p>

                <div class="w-full flex flex-col gap-3 mt-4">
                    <button onclick={handleRefresh} class="btn-primary w-full">
                        <i class="fa-solid fa-arrows-rotate mr-2"></i> Refresh Data
                    </button>

                    <button
                        onclick={() => check_data.set(false)}
                        class="text-slate-500 text-sm hover:text-slate-800 py-2 transition-colors"
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        {:else}
            <div class="flex flex-col gap-6" in:slide>
                <div class="text-center mb-2">
                    <h1 class="text-2xl font-bold text-slate-900">
                        Merchant Portal
                    </h1>
                    <p class="text-slate-500 text-sm mt-1">
                        Select your account to continue
                    </p>
                </div>

                {#if loading}
                    <div
                        class="w-full h-12 bg-slate-100 animate-pulse rounded-xl"
                    ></div>
                {:else}
                    <div class="flex flex-col gap-2">
                        <label
                            for="merchant_select"
                            class="text-xs font-semibold text-slate-500 uppercase ml-1"
                            >Select Merchant</label
                        >
                        <select
                            id="merchant_select"
                            onchange={(e) => merchant.set(e.target.value)}
                            class="input-primary appearance-none"
                        >
                            <option disabled selected value="">Choose...</option
                            >
                            {#each $merchant_list as m}
                                <option value={m.name}>{m.name}</option>
                            {/each}
                        </select>
                    </div>

                    <button
                        disabled={!$merchant}
                        onclick={handleAccess}
                        class="btn-primary mt-2"
                    >
                        Access Dashboard
                    </button>
                {/if}
            </div>
        {/if}
    </div>
</div>
