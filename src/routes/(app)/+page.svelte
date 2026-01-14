<script>
    import { onMount } from "svelte";
    import {
        userState,
        clearUserState,
        refreshBalance,
        completePayment,
        refreshHistory,
        endSession,
        getMerchantList,
    } from "$lib/user.svelte";
    import QrScanner from "qr-scanner";
    import { writable } from "svelte/store";
    import thousandsFormat from "$lib/thousandsFormat";
    import Transaction from "$lib/Transaction.svelte";

    const merchant = writable(undefined);
    const price = writable(undefined);
    const scanning = writable(false);
    const noCamera = writable(false);
    const merchant_list = writable([]);
    getMerchantList().then((list) => {
        console.log(list);
        merchant_list.set(list.map((m) => m.name));
    });

    onMount(() => {
    // -----------------------------
    // 1. Restore auth state
    // -----------------------------
    const storedUser = localStorage.getItem("user");

    if (!userState.session_token && storedUser) {
        try {
            const user = JSON.parse(storedUser);

            userState.session_token = user.session_token;
            userState.name = user.name;
            userState.email = user.email;
            userState.picture = user.picture;

            // IMPORTANT:
            // balance & history MUST come from backend
            refreshBalance();
            refreshHistory();
        } catch (err) {
            console.error("Failed to parse stored user:", err);
            localStorage.removeItem("user");
        }
    }

    // -----------------------------
    // 2. Hard auth guard
    // -----------------------------
    if (!userState.session_token) {
        window.location.href = "/login";
        return; // stop execution
    }

    // -----------------------------
    // 3. QR Scanner setup
    // -----------------------------
    const qrEl = document.getElementById("qr");

    const qrScanner = new QrScanner(qrEl, (result) => {
        console.log("decoded qr code:", result);
        if ($merchant === undefined) {
            merchant.set(result);
        }
    });

    const unsubscribeScanning = scanning.subscribe(async (value) => {
        if (!value) {
            qrScanner.stop();
            qrEl.classList.add("h-0");
            document.getElementById("logoutBtn")?.classList.remove("hidden");
            return;
        }

        try {
            await qrScanner.start();
            qrEl.classList.remove("h-0");
            document.getElementById("logoutBtn")?.classList.add("hidden");
        } catch (err) {
            console.warn("Camera unavailable:", err);
            noCamera.set(true);
        }
    });

    // -----------------------------
    // 4. Logout handler
    // -----------------------------
    const logoutBtn = document.getElementById("logoutBtn");

    const logoutHandler = () => {
        endSession()
            .catch(console.error)
            .finally(() => {
                clearUserState();
                localStorage.removeItem("user");
                window.location.href = "/login";
            });
    };

    logoutBtn?.addEventListener("click", logoutHandler);

    // -----------------------------
    // 5. Cleanup (VERY IMPORTANT)
    // -----------------------------
    return () => {
        unsubscribeScanning();
        qrScanner.stop();
        logoutBtn?.removeEventListener("click", logoutHandler);
    };
});

</script>

<div class="flex flex-col h-full items-center gap-4">
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="flex flex-row w-full items-center rounded-full p-2 justify-between drop-shadow-sm drop-shadow-aztec-gold bg-maize"
    >
        <div class="flex flex-row items-center m-0 p-0">
            <div
                class="flex items-center justify-center rounded-full aspect-square h-14 w-14 bg-aztec-gold/50"
            >
                <i class="fa-solid fa-wallet text-lg"></i>
            </div>
            <div class="flex flex-col h-full w-fit align-middle ml-2">
                <span id="balance" class="font-bold leading-5"
                    >{userState.balance}</span
                >
                <span id="name" class="leading-5 wrap-anywhere"
                    >{userState.name}</span
                >
            </div>
        </div>
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <div
            onclick={() => {
                scanning.set(true);
            }}
            id="scanBtn"
            class="flex flex-col items-center justify-center rounded-full aspect-square h-14 w-14 group"
            style="background-color: #c5934a80;"
        >
            <i
                class="fa-solid fa-qrcode text-lg group-active:opacity-50 duration-200"
            ></i><span class="text-xs">Scan</span>
        </div>
    </div>

    <!-- svelte-ignore a11y_media_has_caption -->
    <video
        id="qr"
        class="aspect-square object-cover rounded-md drop-shadow-sm h-0"
    ></video>

    {#if $noCamera == true}
        <select
            id="merchantSelect"
            onchange={() => {
                merchant.set(document.getElementById("merchantSelect").value);
                // console.log($merchant_list);
            }}
            class="border border-aztec-gold w-3/4 py-2 px-4 rounded-md text-center bg-maize"
        >
            <option disabled selected>Select Merchant</option>
            {#each $merchant_list as merchant_name}
                <option value={merchant_name}>{merchant_name}</option>
            {/each}
        </select>
    {/if}

    <!-- svelte-ignore a11y_no_static_element_interactions -->
    {#if $scanning == false}
        <span id="balance" class="font-bold">Transaction History</span>
        <div
            id="history"
            class="flex flex-col overflow-scroll max-h-1/2 w-full m-0 px-2 items-center"
        >
            {#each userState.history as item (item.timestamp)}
                <Transaction
                    label={item.merchant_name}
                    amount={item.amount}
                    timestamp={item.timestamp}
                />
            {/each}
        </div>
    {:else}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <i
            onclick={() => {
                setTimeout(() => {
                    merchant.set(undefined);
                    price.set(undefined);
                    scanning.set(false);
                    noCamera.set(false);
                }, 150);
            }}
            class="active:opacity-50 active:underline duration-200 text-red-800 font-semibold"
            >cancel payment</i
        >
    {/if}
    {#if $merchant != undefined}
        <input
            id="price"
            onfocusin={() => {
                document.getElementById("price").value =
                    $price == undefined ? "" : $price;
            }}
            oninput={() => {
                price.set(document.getElementById("price").value);
                console.log($price);
            }}
            onfocusout={() => {
                document.getElementById("price").value =
                    "Rp" + thousandsFormat($price);
            }}
            type="text"
            placeholder="Rp10.000"
            class="border border-aztec-gold w-1/2 py-2 px-4 rounded-md text-center bg-maize"
        />
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
            id="payBtn"
            onclick={() => {
                document.getElementById("payBtn").disabled = true;
                completePayment($merchant, $price).then((response) => {
                    document
                        .getElementById("payBtn")
                        .classList.remove("animate-pulse");
                    price.set(undefined);
                    merchant.set(undefined);
                    scanning.set(false);
                    noCamera.set(false);
                    refreshBalance();
                    refreshHistory();
                    document.getElementById("payBtn").disabled = false;
                    if (response == "Payment completed") {
                        alert("Payment completed!");
                    }
                });
                document
                    .getElementById("payBtn")
                    .classList.add("animate-pulse");
            }}
            class="flex justify-center w-fit py-2 px-4 rounded-full drop-shadow-sm drop-shadow-aztec-gold bg-maize group"
        >
            <span class="group-active:opacity-50 duration-200"
                >Pay <i>{$merchant}</i></span
            >
        </div>
    {/if}

    <i
        id="logoutBtn"
        class="opacity-50 active:opacity-25 active:underline duration-200 absolute bottom-10"
        >logout</i
    >
</div>
