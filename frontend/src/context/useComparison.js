import { useContext } from "react";
import { ComparisonContext } from "./comparisonContextObject";

export function useComparison() {
  return useContext(ComparisonContext);
}
