import { registerSW } from "virtual:pwa-register";

registerSW({ immediate: true });

const root = document.querySelector<HTMLDivElement>("#app");
if (root) root.textContent = "Wattblock";
