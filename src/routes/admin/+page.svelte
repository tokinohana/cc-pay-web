<script>
    import "../../app.css";
    import {
        setBalances,
        userState,
        getBalance,
        getMerchantList,
    } from "$lib/user.svelte";
    import { get, writable } from "svelte/store";
    import thousandsFormat from "$lib/thousandsFormat";
    import { onMount } from "svelte";

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
            // alert(JSON.stringify(userState))
            window.location.href = window.location.origin + "/login";
        }
    });

    const action = writable("set_balance");
    const amount = writable(0);

    const merchant_balances = writable({});
    getMerchantList().then((list) => {
        merchant_balances.set(list);
    });

    const action_method = async () => {
        if ($action == "set_balance") {
            return setBalances($amount, document.getElementById("nis").value);
        }
        if ($action == "merchant_balance") {
            // return getBalances()
        }
    };
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    class="min-h-dvh w-dvw flex flex-col items-center justify-center gap-4 px-8 py-8 select-none"
>
    <h1 class="font-bold text-center" style="font-family: 'Arimo';">
        ADMIN DASHBOARD
    </h1>
    <select
        id="action_select"
        onchange={() => {
            action.set(document.getElementById("action_select").value);
        }}
        class="py-2 px-4 rounded-full drop-shadow-sm drop-shadow-aztec-gold bg-maize text-center"
    >
        <option value="set_balance">Set Balance</option>
        <option value="merchant_balance">Get Merchant Balances</option>
    </select>

    {#if $action == "set_balance"}
        <input
            class="py-2 px-4 rounded-full drop-shadow-sm drop-shadow-aztec-gold bg-maize text-center"
            type="text"
            id="nis"
            placeholder="NIS"
        />
        <input
            onfocusin={() => {
                document.getElementById("amount").value = $amount;
            }}
            onchange={() => {
                amount.set(document.getElementById("amount").value);
            }}
            onfocusout={() => {
                document.getElementById("amount").value =
                    "Rp" + thousandsFormat($amount);
            }}
            class="py-2 px-4 rounded-full drop-shadow-sm drop-shadow-aztec-gold bg-maize text-center"
            type="text"
            id="amount"
            placeholder="Amount"
        />

        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <div
            onclick={() => {
                action_method().then((response) => {
                    alert(response);
                });
            }}
            class="flex hover:cursor-pointer hover:contrast-75 duration-200 justify-center w-fit py-2 px-4 rounded-full drop-shadow-sm drop-shadow-aztec-gold bg-maize group select-none"
        >
            <span class="group-active:opacity-50 duration-200">Submit</span>
        </div>
    {/if}
    {#if $action == "merchant_balance"}
        <table class="text-left my-4">
            <thead>
                <tr>
                    <th class="border p-2">Merchant</th>
                    <th class="border p-2">Balance</th>
                </tr>
            </thead>
            <tbody>
                {#each $merchant_balances as merchant}
                    <tr>
                        <th class="border p-2" scope="row">{merchant.name}</th>
                        <td class="border p-2"
                            >Rp{thousandsFormat(merchant.balance)}</td
                        >
                    </tr>
                    <!-- <span class="font-bold">{merchant.name}: Rp{thousandsFormat(merchant.balance)}</span> -->
                {/each}
            </tbody>
        </table>
    {/if}
</div>
