import { registerSW } from "virtual:pwa-register";
import { INITIAL_STATE } from "./state";
import { render } from "./render";

registerSW({ immediate: true });

const root = document.querySelector<HTMLDivElement>("#app");
if (root) render(INITIAL_STATE, root);
