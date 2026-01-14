<script>
    import "../../app.css";
    import { onMount } from "svelte";
    import { getMerchantList } from "$lib/user.svelte";
    import { writable } from "svelte/store";
    import thousandsFormat from "$lib/thousandsFormat";

    const merchant = writable(undefined);
    const balance = writable(undefined);
    const history = writable([]);
    const merchant_list = writable([]);
    const check_data = writable(false);

    onMount(async () => {
        const list = await getMerchantList();
        merchant_list.set(list);
    });
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="h-dvh w-dvw flex flex-col items-center justify-center gap-4 px-8">
    {#if $check_data == true}
        <h1 class="font-bold text-center" style="font-family: 'Arimo';">
            {$merchant}
        </h1>
        <span>Total Revenue: Rp{thousandsFormat($balance)}</span>

        <!-- History currently disabled for merchants as per API limitations -->
        <p class="text-sm text-gray-500 my-4">History unavailable</p>

        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <div
            onclick={() => {
                const m = $merchant_list.find((m) => m.name === $merchant);
                if (m) {
                    balance.set(m.balance);
                }
            }}
            class="flex justify-center w-fit py-2 px-4 rounded-full drop-shadow-sm drop-shadow-aztec-gold bg-maize group select-none"
        >
            <span class="group-active:opacity-50 duration-200"
                >Refresh Data</span
            >
        </div>
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <i
            onclick={() => {
                check_data.set(false);
            }}
            class="opacity-50 active:opacity-25 active:underline duration-200 absolute bottom-10 select-none"
            >exit</i
        >
    {:else}
        <h1>MERCHANT DASHBOARD</h1>
        <select
            id="merchant_select"
            onchange={() => {
                merchant.set(document.getElementById("merchant_select").value);
            }}
            class="py-2 px-4 rounded-full drop-shadow-sm drop-shadow-aztec-gold bg-maize text-center"
        >
            <option disabled selected>Select Merchant</option>
            {#each $merchant_list as m}
                <option value={m.name}>{m.name}</option>
            {/each}
        </select>
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <div
            onclick={() => {
                if ($merchant) {
                    const m = $merchant_list.find((m) => m.name === $merchant);
                    if (m) {
                        balance.set(m.balance);
                        check_data.set(true);
                    }
                }
            }}
            class="flex justify-center w-fit py-2 px-4 rounded-full drop-shadow-sm drop-shadow-aztec-gold bg-maize group select-none"
        >
            <span class="group-active:opacity-50 duration-200"
                >Check <i>{$merchant}</i> Data</span
            >
        </div>
    {/if}
</div>
