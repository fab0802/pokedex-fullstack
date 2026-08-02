import { useContext } from "react";
import { FilterContext } from "./filterContextObject";

export function useFilter() {
  return useContext(FilterContext);
}
