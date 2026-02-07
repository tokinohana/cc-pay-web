<script>
    import "../../app.css";
    import { onMount } from "svelte";
    import { getMerchantList, getMerchantHistory } from "$lib/user.svelte";
    import { writable } from "svelte/store";
    import thousandsFormat from "$lib/thousandsFormat";
    import { fade, slide } from "svelte/transition";

    const merchant = writable(undefined);
    const balance = writable(undefined);
    const history = writable([]);
    const merchant_list = writable([]);
    const check_data = writable(false);
    let loading = true;

    onMount(async () => {
        const list = await getMerchantList();
        merchant_list.set(list);
        loading = false;
    });

    async function handleAccess() {
        if ($merchant) {
            const m = $merchant_list.find((m) => m.name === $merchant);
            if (m) {
                loading = true;
                try {
                    balance.set(m.balance);

                    // Fetch history
                    const h = await getMerchantHistory($merchant);
                    history.set(h);

                    check_data.set(true);
                } catch (e) {
                    console.error(e);
                    alert("Failed to load merchant data");
                } finally {
                    loading = false;
                }
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

                    // Refresh history
                    try {
                        const h = await getMerchantHistory($merchant);
                        history.set(h);
                    } catch (e) {
                        console.error("Failed to refresh history:", e);
                    }
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
    <div class="w-full max-w-4xl card p-8 transition-all" in:fade>
        {#if $check_data == true}
            <div
                class="flex flex-col items-center text-center gap-6 w-full max-w-4xl"
                in:slide
            >
                <div class="w-full flex items-center justify-between">
                    <div class="flex items-center gap-4">
                        <div
                            class="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600"
                        >
                            <i class="fa-solid fa-shop text-xl"></i>
                        </div>
                        <div class="text-left">
                            <h1 class="text-xl font-bold text-slate-900">
                                {$merchant}
                            </h1>
                            <p class="text-slate-500 text-sm">
                                Merchant Dashboard
                            </p>
                        </div>
                    </div>

                    <button
                        onclick={() => check_data.set(false)}
                        class="text-slate-500 text-sm hover:text-slate-800 transition-colors"
                    >
                        Sign Out
                    </button>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                    <!-- Stats Card -->
                    <div
                        class="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col justify-center h-fit"
                    >
                        <p
                            class="text-slate-400 text-xs uppercase font-semibold tracking-wider mb-2"
                        >
                            Total Revenue
                        </p>
                        <p
                            class="text-4xl font-bold text-slate-800 tracking-tight"
                        >
                            <span class="text-xl align-top text-slate-400 mr-1"
                                >Rp</span
                            >{thousandsFormat($balance ?? 0)}
                        </p>

                        <button
                            onclick={handleRefresh}
                            class="btn-primary w-full mt-6"
                        >
                            <i class="fa-solid fa-arrows-rotate mr-2"></i> Refresh
                            Data
                        </button>
                    </div>

                    <!-- History -->
                    <div
                        class="md:col-span-2 bg-white rounded-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[600px]"
                    >
                        <div
                            class="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center"
                        >
                            <h2 class="font-semibold text-slate-700">
                                Transaction History
                            </h2>
                            <span class="text-xs text-slate-400"
                                >{$history.length} transactions</span
                            >
                        </div>

                        <div class="overflow-y-auto p-0 flex-1">
                            {#if $history.length === 0}
                                <div
                                    class="p-8 text-center text-slate-400 text-sm"
                                >
                                    No transactions found
                                </div>
                            {:else}
                                <table class="w-full text-sm text-left">
                                    <thead
                                        class="bg-slate-50 text-slate-500 font-medium sticky top-0 z-10"
                                    >
                                        <tr>
                                            <th class="px-4 py-3">Time</th>
                                            <th class="px-4 py-3">User</th>
                                            <th class="px-4 py-3 text-right"
                                                >Amount</th
                                            >
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-slate-100">
                                        {#each $history as tx}
                                            <tr class="hover:bg-slate-50/50">
                                                <td
                                                    class="px-4 py-3 text-slate-500 whitespace-nowrap"
                                                >
                                                    {new Date(
                                                        tx.timestamp * 1000,
                                                    ).toLocaleString()}
                                                </td>
                                                <td
                                                    class="px-4 py-3 text-slate-600 font-medium"
                                                >
                                                    {tx.user_email}
                                                </td>
                                                <td
                                                    class="px-4 py-3 text-right font-bold text-emerald-600 whitespace-nowrap"
                                                >
                                                    +{thousandsFormat(
                                                        tx.amount,
                                                    )}
                                                </td>
                                            </tr>
                                        {/each}
                                    </tbody>
                                </table>
                            {/if}
                        </div>
                    </div>
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
