export default function thousandsFormat(x) {
    if (x === undefined || x === null) return "0";
    return x.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ".");
}