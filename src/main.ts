import "./app.css";
import { registerSW } from "virtual:pwa-register";
import {
  addPoint,
  newMatch,
  openSetup,
  resumeFromPersisted,
  start,
  undo,
  updateSetup,
  type AppState,
  type TeamId,
} from "./state";
import { load, save } from "./storage";
import { render } from "./render";

registerSW({ immediate: true });

const root = document.querySelector<HTMLDivElement>("#app");
if (!root) throw new Error("Missing #app root");

const loaded: AppState = load();
let state: AppState = resumeFromPersisted(loaded);
if (state !== loaded) save(state);

function setState(next: AppState): void {
  if (next === state) return;
  state = next;
  save(state);
  render(state, root!);
}

function setStateNoRender(next: AppState): void {
  if (next === state) return;
  state = next;
  save(state);
}

render(state, root);

function getTeamFromRail(el: Element): TeamId | null {
  const rail = el.closest<HTMLElement>(".rail");
  const t = rail?.dataset.team;
  return t === "A" || t === "B" ? t : null;
}

root.addEventListener("click", (e) => {
  if (!(e.target instanceof Element)) return;
  const trigger = e.target.closest<HTMLElement>("[data-action]");
  if (!trigger) return;
  const action = trigger.dataset.action;
  switch (action) {
    case "add": {
      const team = getTeamFromRail(trigger);
      const value = Number(trigger.dataset.value);
      if (team && Number.isFinite(value)) setState(addPoint(state, team, value));
      break;
    }
    case "undo": {
      const team = getTeamFromRail(trigger);
      if (team) setState(undo(state, team));
      break;
    }
    case "preset-target": {
      const value = Number(trigger.dataset.value);
      if (Number.isFinite(value) && value > 0) {
        setState(updateSetup(state, { ...state.setup, target: value }));
      }
      break;
    }
    case "start":
      setState(start(state));
      break;
    case "open-setup":
      setState(openSetup(state));
      break;
    case "new-match":
      setState(newMatch(state));
      break;
    case "play-again":
      setState(start(newMatch(state)));
      break;
  }
});

root.addEventListener("input", (e) => {
  const target = e.target;
  if (!(target instanceof HTMLInputElement)) return;
  const action = target.dataset.action;
  switch (action) {
    case "custom-target": {
      const value = Number(target.value);
      if (Number.isFinite(value) && value > 0) {
        setStateNoRender(updateSetup(state, { ...state.setup, target: value }));
      }
      break;
    }
    case "team-a":
      setStateNoRender(updateSetup(state, { ...state.setup, teamA: target.value }));
      break;
    case "team-b":
      setStateNoRender(updateSetup(state, { ...state.setup, teamB: target.value }));
      break;
  }
});
