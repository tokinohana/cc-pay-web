<script>
    import "../../app.css";
    import { setBalances, userState, getMerchantList } from "$lib/user.svelte";
    import { writable } from "svelte/store";
    import thousandsFormat from "$lib/thousandsFormat";
    import { onMount } from "svelte";
    import { fade } from "svelte/transition";

    onMount(() => {
        if (
            userState.session_token == undefined &&
            localStorage.getItem("user") != null
        ) {
            const user = JSON.parse(localStorage.getItem("user"));
            userState.session_token = user.session_token;
            userState.name = user.name;
            userState.email = user.email;
            userState.picture = user.picture;
            userState.balance = user.balance;
        }
        if (
            userState.session_token == undefined &&
            window.location.href !== window.location.origin + "/login"
        ) {
            window.location.href = window.location.origin + "/login";
        }
    });

    const action = writable("set_balance");
    const amount = writable(0);
    const merchant_balances = writable([]); // Changed default to array

    getMerchantList().then((list) => {
        merchant_balances.set(list);
    });

    const action_method = async () => {
        return setBalances($amount, document.getElementById("target").value);
    };
</script>

<div class="min-h-screen bg-slate-50 flex flex-col items-center p-6">
    <div class="w-full max-w-2xl card p-8" in:fade>
        <div class="mb-8 text-center sm:text-left">
            <h1 class="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
            <p class="text-slate-500 text-sm">
                Manage system balances and merchants
            </p>
        </div>

        <div class="mb-6">
            <label
                for="action_select"
                class="block text-sm font-medium text-slate-700 mb-2"
                >Action</label
            >
            <div class="relative">
                <select
                    id="action_select"
                    onchange={(e) => action.set(e.target.value)}
                    class="input-primary appearance-none cursor-pointer"
                >
                    <option value="set_balance">Set Student Balance</option>
                    <option value="merchant_balance"
                        >View Merchant Balances</option
                    >
                </select>
                <div
                    class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500"
                >
                    <i class="fa-solid fa-chevron-down text-xs"></i>
                </div>
            </div>
        </div>

        <div class="border-t border-slate-100 pt-6">
            {#if $action == "set_balance"}
                <div class="space-y-4 max-w-md mx-auto sm:mx-0">
                    <div>
                        <label
                            for="target"
                            class="block text-sm font-medium text-slate-700 mb-1"
                            >Student NIS / Email</label
                        >
                        <input
                            class="input-primary"
                            type="text"
                            id="target"
                            placeholder="Enter NIS or Email (separated by comma/space)"
                        />
                    </div>

                    <div>
                        <label
                            for="amount"
                            class="block text-sm font-medium text-slate-700 mb-1"
                            >Amount (Raw)</label
                        >
                        <input
                            onfocusin={() => {
                                document.getElementById("amount").value =
                                    $amount;
                            }}
                            onchange={(e) => {
                                amount.set(e.target.value);
                            }}
                            onfocusout={() => {
                                document.getElementById("amount").value =
                                    "Rp" + thousandsFormat($amount ?? 0);
                            }}
                            class="input-primary"
                            type="text"
                            id="amount"
                            placeholder="0"
                        />
                    </div>

                    <div class="pt-2">
                        <button
                            onclick={() => {
                                action_method().then((response) => {
                                    alert(response);
                                });
                            }}
                            class="btn-primary"
                        >
                            Submit Transaction
                        </button>
                    </div>
                </div>
            {/if}

            {#if $action == "merchant_balance"}
                <div
                    class="overflow-hidden shadow ring-1 ring-black/5 rounded-xl"
                >
                    <table class="min-w-full divide-y divide-slate-300">
                        <thead class="bg-slate-50">
                            <tr>
                                <th
                                    scope="col"
                                    class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-6"
                                    >Merchant</th
                                >
                                <th
                                    scope="col"
                                    class="px-3 py-3.5 text-right text-sm font-semibold text-slate-900"
                                    >Balance</th
                                >
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-200 bg-white">
                            {#each $merchant_balances as merchant}
                                <tr>
                                    <td
                                        class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-slate-900 sm:pl-6"
                                        >{merchant.name}</td
                                    >
                                    <td
                                        class="whitespace-nowrap px-3 py-4 text-right text-sm text-slate-500 font-mono"
                                        >Rp{thousandsFormat(
                                            merchant.balance ?? 0,
                                        )}</td
                                    >
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            {/if}
        </div>
    </div>
</div>
