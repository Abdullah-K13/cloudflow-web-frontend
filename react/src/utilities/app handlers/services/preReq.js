import { utility } from "../..";

export const preReqs = (...args) => {
    let [navigator] = args;
    utility.navigate = navigator();
}