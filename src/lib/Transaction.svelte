<script>
    import thousandsFormat from "./thousandsFormat";

    export let label;
    export let amount;
    export let timestamp;

    const date = new Date(timestamp * 1000);
    // Simple date formatter
    const formattedDate = new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);

    let isCustom = false;
    let displayLabel = label;

    if (label == null) {
        isCustom = true;
        if (amount == 0) {
            displayLabel = "Reset";
        } else {
            displayLabel = "Coupon Top-up";
        }
    }
</script>

<div
    class="flex items-center justify-between py-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors px-2 -mx-2 rounded-lg"
>
    <div class="flex flex-col gap-0.5">
        <span class="font-medium text-slate-900 line-clamp-1"
            >{displayLabel}</span
        >
        <span class="text-xs text-slate-400">{formattedDate}</span>
    </div>

    <div class="flex flex-col items-end">
        <span
            class="font-semibold tabular-nums tracking-tight {isCustom
                ? amount === 0
                    ? 'text-slate-500'
                    : 'text-emerald-600'
                : 'text-slate-800'}"
        >
            {isCustom ? "+" : "-"}Rp{thousandsFormat(amount ?? 0)}
        </span>
    </div>
</div>
