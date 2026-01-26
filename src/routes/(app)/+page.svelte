<script>
    import { onMount, tick } from "svelte";
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
    import { fade, slide, fly } from "svelte/transition";

    // View State: 'dashboard' | 'pay' | 'success'
    let currentView = "dashboard";

    // Payment State
    const merchant = writable(undefined);
    const price = writable(undefined);
    const scanning = writable(false);
    const noCamera = writable(false);
    const merchant_list = writable([]);
    let isProcessing = false;
    let successData = { merchant: "", amount: 0 };

    getMerchantList().then((list) => {
        merchant_list.set(list.map((m) => m.name));
    });

    onMount(() => {
        // 1. Restore auth state
        const storedUser = localStorage.getItem("user");
        if (!userState.session_token && storedUser) {
            try {
                const user = JSON.parse(storedUser);
                userState.session_token = user.session_token;
                userState.name = user.name;
                userState.email = user.email;
                userState.picture = user.picture;

                refreshBalance();
                refreshHistory();
            } catch (err) {
                console.error("Failed to parse stored user:", err);
                localStorage.removeItem("user");
            }
        }

        // 2. Hard auth guard
        if (!userState.session_token) {
            window.location.href = "/login";
            return;
        }

        // 3. QR Scanner setup
        // Moved to openPay to ensure DOM element exists
    });

    let qrScanner;
    function setupScanner() {
        const qrEl = document.getElementById("qr");
        if (!qrEl) {
            console.warn("QR Element not found");
            return;
        }

        if (qrScanner) {
            qrScanner.destroy();
        }

        qrScanner = new QrScanner(
            qrEl,
            (result) => {
                console.log("decoded qr code:", result);
                if ($merchant === undefined) {
                    merchant.set(result.data);
                    scanning.set(false); // Stop scanning once found
                }
            },
            {
                highlightScanRegion: true,
                highlightCodeOutline: true,
            },
        );
    }

    // React to scanning state
    $: if (qrScanner) {
        if ($scanning) {
            qrScanner
                .start()
                .then(() => {
                    noCamera.set(false);
                })
                .catch((err) => {
                    console.warn("Camera unavailable:", err);
                    noCamera.set(true);
                });
        } else {
            qrScanner.stop();
        }
    }

    function handleLogout() {
        if (confirm("Are you sure you want to log out?")) {
            endSession()
                .catch(console.error)
                .finally(() => {
                    clearUserState();
                    localStorage.removeItem("user");
                    window.location.href = "/login";
                });
        }
    }

    async function handlePayment() {
        if (!$merchant || !$price) return;

        isProcessing = true;

        // Fix: Ensure price is string before replace
        const amountStr = String($price);
        const amountClean = amountStr.replace(/\D/g, ""); // Ensure number

        try {
            const response = await completePayment($merchant, amountClean);
            if (response == "Payment completed") {
                successData = { merchant: $merchant, amount: amountClean };
                await refreshBalance();
                await refreshHistory();
                currentView = "success";
                // Reset form
                merchant.set(undefined);
                price.set(undefined);
            } else {
                alert(response); // Fallback error
            }
        } catch (e) {
            alert("Payment failed: " + e.message);
        } finally {
            isProcessing = false;
        }
    }

    async function openPay() {
        currentView = "pay";
        await tick(); // Wait for DOM to update so #qr exists
        setupScanner();
        scanning.set(true); // Default to scan mode
    }

    function closePay() {
        scanning.set(false);
        if (qrScanner) {
            qrScanner.destroy(); // Clean up camera stream
            qrScanner = null;
        }
        merchant.set(undefined);
        price.set(undefined);
        currentView = "dashboard";
    }

    function closeSuccess() {
        currentView = "dashboard";
        successData = { merchant: "", amount: 0 };
    }
</script>

<div
    class="min-h-screen bg-slate-50 relative overflow-hidden flex flex-col max-w-md mx-auto shadow-2xl shadow-slate-200"
>
    <!-- HEADER (Visible on Dashboard) -->
    {#if currentView === "dashboard"}
        <div
            class="bg-white p-6 pb-4 pt-8 sticky top-0 z-10"
            in:slide={{ duration: 200, axis: "y" }}
        >
            <div class="flex items-center justify-between mb-6">
                <div class="flex items-center gap-3">
                    <!-- {#if userState.picture}
                        <img src={userState.picture} alt="Profile" class="h-10 w-10 rounded-full border border-slate-200">
                    {:else} -->
                    <div
                        class="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400"
                    >
                        <i class="fa-solid fa-user"></i>
                    </div>
                    <!-- {/if} -->
                    <div>
                        <p class="text-xs text-slate-500 font-medium">Hello,</p>
                        <p
                            class="text-sm font-bold text-slate-900 leading-tight"
                        >
                            {userState.name || "User"}
                        </p>
                    </div>
                </div>
                <!-- svelte-ignore a11y_consider_explicit_label -->
                <button
                    onclick={handleLogout}
                    class="text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <i class="fa-solid fa-right-from-bracket text-lg"></i>
                </button>
            </div>

            <!-- BALANCE CARD -->
            <div
                class="bg-emerald-600 rounded-2xl p-6 text-white shadow-lg shadow-emerald-200 relative overflow-hidden"
            >
                <div class="absolute -right-4 -top-4 opacity-10">
                    <i class="fa-solid fa-wallet text-9xl"></i>
                </div>

                <p class="text-emerald-100 text-sm font-medium mb-1">
                    Coupon Balance
                </p>
                <div class="flex items-baseline gap-1">
                    <span class="text-2xl font-semibold opacity-80">Rp</span>
                    <span class="text-4xl font-bold tracking-tight"
                        >{thousandsFormat($userState.balance ?? 0)}</span
                    >
                </div>
            </div>

            <!-- PRIMARY ACTION -->
            <div class="mt-6">
                <button
                    onclick={openPay}
                    class="btn-primary flex items-center justify-center gap-2 py-4 text-base shadow-emerald-200 hover:shadow-emerald-300"
                >
                    <i class="fa-solid fa-qrcode"></i>
                    Pay Merchant
                </button>
            </div>
        </div>

        <!-- RECENT ACTIVITY -->
        <div class="flex-1 bg-white px-6 py-4" in:fade>
            <h3
                class="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider"
            >
                Recent Activity
            </h3>

            <div class="space-y-1 pb-20">
                {#if ($userState.history ?? []).length === 0}
                    <div class="text-center py-10 text-slate-400">
                        <p class="text-sm">No recent transactions</p>
                    </div>
                {/if}
                {#each $userState.history ?? [] as item (item.timestamp)}
                    <Transaction
                        label={item.merchant_name}
                        amount={item.amount}
                        timestamp={item.timestamp}
                    />
                {/each}
            </div>
        </div>

        <!-- PAY VIEW -->
    {:else if currentView === "pay"}
        <div
            class="absolute inset-0 bg-white z-20 flex flex-col"
            in:fly={{ x: 300, duration: 300 }}
            out:fly={{ x: 300, duration: 200 }}
        >
            <!-- Navigation -->
            <div class="p-4 flex items-center mb-2">
                <!-- svelte-ignore a11y_consider_explicit_label -->
                <button
                    onclick={closePay}
                    class="h-10 w-10 flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-600"
                >
                    <i class="fa-solid fa-arrow-left"></i>
                </button>
                <h2 class="ml-2 text-lg font-bold text-slate-900">
                    Pay Merchant
                </h2>
            </div>

            <div class="flex-1 overflow-y-auto px-6 pb-6">
                <!-- 1. Merchant Selection Phase -->
                {#if !$merchant}
                    <div class="flex flex-col gap-6">
                        <!-- QR Scanner Container -->
                        <div
                            class="aspect-square bg-slate-900 rounded-2xl overflow-hidden relative shadow-inner"
                        >
                            {#if !$noCamera}
                                <!-- svelte-ignore a11y_media_has_caption -->
                                <video
                                    id="qr"
                                    class="w-full h-full object-cover"
                                ></video>
                                <div
                                    class="absolute inset-0 border-2 border-white/30 m-8 rounded-xl pointer-events-none"
                                ></div>
                                <div
                                    class="absolute bottom-4 left-0 right-0 text-center text-white/80 text-xs shadow-black/50 drop-shadow-md"
                                >
                                    Scanning...
                                </div>
                            {:else}
                                <div
                                    class="w-full h-full flex flex-col items-center justify-center text-slate-500"
                                >
                                    <i
                                        class="fa-solid fa-camera-slash text-2xl mb-2"
                                    ></i>
                                    <span class="text-xs"
                                        >Camera access required</span
                                    >
                                </div>
                            {/if}
                        </div>

                        <div class="relative">
                            <div
                                class="absolute inset-0 flex items-center"
                                aria-hidden="true"
                            >
                                <div
                                    class="w-full border-t border-slate-200"
                                ></div>
                            </div>
                            <div class="relative flex justify-center">
                                <span
                                    class="bg-white px-2 text-sm text-slate-500"
                                    >or select manually</span
                                >
                            </div>
                        </div>

                        <div>
                            <select
                                onchange={(e) => merchant.set(e.target.value)}
                                class="input-primary"
                            >
                                <option disabled selected value=""
                                    >Choose Merchant...</option
                                >
                                {#each $merchant_list as m}
                                    <option value={m}>{m}</option>
                                {/each}
                            </select>
                        </div>
                    </div>

                    <!-- 2. Amount Entry Phase -->
                {:else}
                    <div class="flex flex-col items-center pt-8 gap-8" in:fade>
                        <div class="text-center">
                            <p class="text-slate-500 text-sm mb-1">Paying to</p>
                            <h3 class="text-2xl font-bold text-slate-900">
                                {$merchant}
                            </h3>
                            <button
                                onclick={() => merchant.set(undefined)}
                                class="text-xs text-emerald-600 font-medium mt-2"
                                >Change</button
                            >
                        </div>

                        <div class="w-full">
                            <label
                                for="amount"
                                class="block text-xs font-semibold uppercase text-slate-400 mb-2 tracking-wider"
                                >Amount</label
                            >
                            <div class="relative">
                                <span
                                    class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold"
                                    >Rp</span
                                >
                                <input
                                    id="amount"
                                    class="input-primary pl-12 text-lg font-semibold"
                                    type="number"
                                    placeholder="0"
                                    bind:value={$price}
                                />
                            </div>
                        </div>

                        <button
                            disabled={!$price || isProcessing}
                            onclick={handlePayment}
                            class="btn-primary w-full py-4 text-base mt-4"
                        >
                            {#if isProcessing}
                                <i class="fa-solid fa-spinner fa-spin mr-2"></i>
                                Processing...
                            {:else}
                                Confirm Payment
                            {/if}
                        </button>
                    </div>
                {/if}
            </div>
        </div>

        <!-- SUCCESS VIEW -->
    {:else if currentView === "success"}
        <div
            class="absolute inset-0 bg-emerald-600 z-30 flex flex-col items-center justify-center p-8 text-white text-center"
            in:fade
        >
            <div
                class="w-20 h-20 bg-white rounded-full flex items-center justify-center text-emerald-600 mb-6 shadow-xl animate-bounce"
            >
                <i class="fa-solid fa-check text-4xl"></i>
            </div>

            <h2 class="text-3xl font-bold mb-2">Payment Sent!</h2>
            <p class="text-emerald-100 mb-10">
                Transaction completed successfully.
            </p>

            <div
                class="bg-white/10 rounded-2xl p-6 w-full max-w-sm backdrop-blur-sm border border-white/20 mb-8"
            >
                <p
                    class="text-emerald-100 text-xs uppercase tracking-wider mb-1"
                >
                    Total Paid
                </p>
                <p class="text-3xl font-bold mb-4">
                    Rp {thousandsFormat(successData.amount)}
                </p>
                <div class="h-px bg-white/20 w-full mb-4"></div>
                <div class="flex justify-between items-center text-sm">
                    <span class="text-emerald-100">Merchant</span>
                    <span class="font-semibold">{successData.merchant}</span>
                </div>
            </div>

            <button
                onclick={closeSuccess}
                class="w-full bg-white text-emerald-600 font-bold py-4 rounded-xl shadow-lg hover:bg-emerald-50 transition-colors"
            >
                Done
            </button>
        </div>
    {/if}
</div>
